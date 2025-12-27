import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Grid3X3, ImageIcon } from 'lucide-react';
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
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    has_sizes: true,
  });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">Manage product categories and banners</p>
        </div>
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
                <ImageUpload
                  images={formData.image_url ? [formData.image_url] : []}
                  onImagesChange={(images) => setFormData({ ...formData, image_url: images[0] || '' })}
                  maxImages={1}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended: 1200x300px for best results
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
              <div className="aspect-[4/1] bg-secondary/50 flex items-center justify-center relative overflow-hidden">
                {category.image_url ? (
                  <>
                    <img 
                      src={category.image_url} 
                      alt={category.name} 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
                  </>
                ) : (
                  <div className="flex flex-col items-center text-muted-foreground/50">
                    <ImageIcon className="h-8 w-8" />
                    <span className="text-xs mt-1">No banner</span>
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
