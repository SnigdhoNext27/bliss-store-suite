import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Grid3X3, ImageIcon, Upload, X, Loader2, Images } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { logAdminAction } from '@/lib/auditLog';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  has_sizes: boolean;
  created_at: string;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    has_sizes: true,
  });
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkUploadProgress, setBulkUploadProgress] = useState<Record<string, 'pending' | 'uploading' | 'done' | 'error'>>({});
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories((data || []) as Category[]);
    } catch (error) {
      console.error('Fetch categories error:', error);
      toast({ title: 'Failed to load categories', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }

    const baseSlug = formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const randomSuffix = crypto.randomUUID().split('-')[0];

    const categoryData = {
      name: formData.name.substring(0, 100),
      slug: editingCategory ? editingCategory.slug : `${baseSlug}-${randomSuffix}`,
      description: formData.description?.substring(0, 500) || null,
      image_url: formData.image_url || null,
      has_sizes: formData.has_sizes,
    };

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', editingCategory.id);
        if (error) throw error;
        await logAdminAction({ 
          action: 'update', 
          entityType: 'category', 
          entityId: editingCategory.id, 
          details: { name: categoryData.name } 
        });
        toast({ title: 'Category updated' });
      } else {
        const { data, error } = await supabase
          .from('categories')
          .insert(categoryData)
          .select('id')
          .single();
        if (error) throw error;
        await logAdminAction({ 
          action: 'create', 
          entityType: 'category', 
          entityId: data?.id, 
          details: { name: categoryData.name } 
        });
        toast({ title: 'Category created' });
      }

      setDialogOpen(false);
      resetForm();
      fetchCategories();
    } catch (error) {
      console.error('Save category error:', error);
      toast({ title: 'Failed to save category', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? Products in this category will become uncategorized.')) return;
    const category = categories.find(c => c.id === id);

    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      await logAdminAction({ 
        action: 'delete', 
        entityType: 'category', 
        entityId: id, 
        details: { name: category?.name } 
      });
      setCategories(categories.filter(c => c.id !== id));
      toast({ title: 'Category deleted' });
    } catch (error) {
      console.error('Delete error:', error);
      toast({ title: 'Failed to delete category', variant: 'destructive' });
    }
  };

  const handleRemoveBanner = async (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category?.image_url) return;

    try {
      // Delete from storage
      const urlParts = category.image_url.split('/product-images/');
      if (urlParts.length > 1) {
        await supabase.storage.from('product-images').remove([urlParts[1]]);
      }

      // Update database
      const { error } = await supabase
        .from('categories')
        .update({ image_url: null })
        .eq('id', categoryId);

      if (error) throw error;

      await logAdminAction({
        action: 'update',
        entityType: 'category',
        entityId: categoryId,
        details: { action: 'removed_banner', name: category.name }
      });

      setCategories(categories.map(c => 
        c.id === categoryId ? { ...c, image_url: null } : c
      ));
      toast({ title: 'Banner removed, reverting to AI-generated image' });
    } catch (error) {
      console.error('Remove banner error:', error);
      toast({ title: 'Failed to remove banner', variant: 'destructive' });
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setBulkUploading(true);
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    const progress: Record<string, 'pending' | 'uploading' | 'done' | 'error'> = {};

    // Initialize progress for all files
    Array.from(files).forEach(file => {
      progress[file.name] = 'pending';
    });
    setBulkUploadProgress({ ...progress });

    let successCount = 0;

    for (const file of Array.from(files)) {
      // Extract category name from filename (e.g., "shirts.jpg" -> "Shirts")
      const fileNameWithoutExt = file.name.split('.')[0];
      const categoryName = fileNameWithoutExt.charAt(0).toUpperCase() + fileNameWithoutExt.slice(1).toLowerCase();
      
      // Find matching category
      const matchingCategory = categories.find(c => 
        c.name.toLowerCase() === categoryName.toLowerCase() ||
        c.slug.toLowerCase().includes(fileNameWithoutExt.toLowerCase())
      );

      if (!matchingCategory) {
        progress[file.name] = 'error';
        setBulkUploadProgress({ ...progress });
        continue;
      }

      progress[file.name] = 'uploading';
      setBulkUploadProgress({ ...progress });

      try {
        // Validate file
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 5 * 1024 * 1024) continue;

        const fileExt = file.name.split('.').pop()?.toLowerCase();
        if (!fileExt || !allowedExtensions.includes(fileExt)) continue;

        // Upload to storage
        const randomName = crypto.randomUUID();
        const fileName = `${randomName}.${fileExt}`;
        const filePath = `categories/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        // Update category
        const { error: updateError } = await supabase
          .from('categories')
          .update({ image_url: urlData.publicUrl })
          .eq('id', matchingCategory.id);

        if (updateError) throw updateError;

        progress[file.name] = 'done';
        successCount++;
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        progress[file.name] = 'error';
      }

      setBulkUploadProgress({ ...progress });
    }

    setBulkUploading(false);
    if (bulkInputRef.current) bulkInputRef.current.value = '';
    
    toast({ 
      title: `Bulk upload complete`, 
      description: `${successCount} of ${files.length} banners uploaded successfully` 
    });
    
    fetchCategories();
  };

  const openEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      image_url: category.image_url || '',
      has_sizes: category.has_sizes ?? true,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      image_url: '',
      has_sizes: true,
    });
  };

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">Manage product categories and banners</p>
        </div>
        <div className="flex gap-2">
          {/* Bulk Upload Dialog */}
          <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Images className="h-4 w-4 mr-2" />
                Bulk Upload Banners
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Bulk Upload Category Banners</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>How it works:</strong> Name your image files to match category names.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• <code className="bg-background px-1 rounded">shirts.jpg</code> → Shirts category</li>
                    <li>• <code className="bg-background px-1 rounded">t-shirts.png</code> → T-Shirts category</li>
                    <li>• <code className="bg-background px-1 rounded">caps.webp</code> → Caps category</li>
                  </ul>
                </div>

                <div>
                  <input
                    ref={bulkInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleBulkUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() => bulkInputRef.current?.click()}
                    disabled={bulkUploading}
                    className="w-full"
                    variant="outline"
                  >
                    {bulkUploading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Select Images
                  </Button>
                </div>

                {Object.keys(bulkUploadProgress).length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {Object.entries(bulkUploadProgress).map(([filename, status]) => (
                      <div key={filename} className="flex items-center justify-between text-sm p-2 bg-background rounded">
                        <span className="truncate flex-1">{filename}</span>
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                          status === 'done' ? 'bg-green-100 text-green-700' :
                          status === 'error' ? 'bg-red-100 text-red-700' :
                          status === 'uploading' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {status === 'done' ? 'Done' :
                           status === 'error' ? 'No match' :
                           status === 'uploading' ? 'Uploading...' : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Add Category Dialog */}
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {/* Banner Image Upload */}
                <div>
                  <Label className="mb-2 block">Category Banner Image</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Upload a custom banner to override the default AI-generated image
                  </p>
                  <ImageUpload
                    images={formData.image_url ? [formData.image_url] : []}
                    onImagesChange={(images) => setFormData({ ...formData, image_url: images[0] || '' })}
                    maxImages={1}
                    folder="categories"
                    aspectRatio="aspect-[4/3]"
                  />
                  {formData.image_url && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2 text-destructive hover:text-destructive"
                      onClick={() => setFormData({ ...formData, image_url: '' })}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Remove banner (use AI-generated)
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Recommended: 1024x768px (4:3 ratio) for best results on category cards
                  </p>
                </div>

                <div>
                  <Label>Category Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., T-Shirts, Caps, Accessories"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief category description..."
                    rows={2}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                  <div>
                    <Label className="font-medium">Show Sizes for Products</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Enable for clothing (T-Shirts, Pants). Disable for Caps, Accessories, etc.
                    </p>
                  </div>
                  <Switch
                    checked={formData.has_sizes}
                    onCheckedChange={(checked) => setFormData({ ...formData, has_sizes: checked })}
                  />
                </div>

                <Button onClick={handleSubmit} className="w-full">
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Grid3X3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No categories found</p>
          </div>
        ) : (
          filteredCategories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card rounded-xl border border-border overflow-hidden"
            >
              {/* Banner Preview */}
              <div className="aspect-[4/1] bg-secondary/50 flex items-center justify-center relative overflow-hidden group">
                {category.image_url ? (
                  <>
                    <img 
                      src={category.image_url} 
                      alt={category.name} 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
                    {/* Remove banner button on hover */}
                    <button
                      onClick={() => handleRemoveBanner(category.id)}
                      className="absolute top-2 right-2 p-1.5 bg-destructive/90 text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                      title="Remove banner (revert to AI-generated)"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-muted-foreground/50">
                    <ImageIcon className="h-8 w-8" />
                    <span className="text-xs mt-1">AI-generated</span>
                  </div>
                )}
                {category.image_url && (
                  <span className="absolute bottom-2 left-2 text-white font-display font-bold text-lg drop-shadow-lg">
                    {category.name}
                  </span>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium">{category.name}</h3>
                    <p className="text-xs text-muted-foreground">/{category.slug}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    category.has_sizes 
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {category.has_sizes ? 'Has Sizes' : 'No Sizes'}
                  </span>
                </div>

                {category.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {category.description}
                  </p>
                )}

                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(category)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(category.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
