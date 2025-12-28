import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Package, Bell, Loader2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { logAdminAction } from '@/lib/auditLog';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  stock: number;
  is_active: boolean;
  is_new: boolean;
  is_featured: boolean;
  images: string[];
  sizes: string[];
  colors: string[];
  description: string | null;
  short_description: string | null;
  sku: string | null;
  category_id: string | null;
  video_url: string | null;
  category?: { name: string } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  has_sizes?: boolean;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [notifyingProduct, setNotifyingProduct] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    sale_price: '',
    stock: '',
    description: '',
    short_description: '',
    sizes: 'S, M, L, XL',
    colors: '',
    sku: '',
    images: [] as string[],
    is_active: true,
    is_new: true,
    is_featured: false,
    category_id: '',
    video_url: '',
  });
  const { toast } = useToast();

  const handleNotifySubscribers = async (product: Product) => {
    if (!product.sale_price || product.sale_price >= product.price) {
      toast({ title: 'This product is not on sale', variant: 'destructive' });
      return;
    }

    setNotifyingProduct(product.id);

    try {
      const { data, error } = await supabase.functions.invoke('sale-notification', {
        body: {
          productName: product.name,
          originalPrice: product.price,
          salePrice: product.sale_price,
          productSlug: product.slug,
          productImage: product.images?.[0] || null,
        },
      });

      if (error) throw error;

      await logAdminAction({ 
        action: 'notify_subscribers', 
        entityType: 'product', 
        entityId: product.id, 
        details: { name: product.name, subscribersNotified: data?.successCount || 0 } 
      });

      toast({ 
        title: 'Subscribers notified!', 
        description: `${data?.successCount || 0} subscribers were notified about the sale.` 
      });
    } catch (error) {
      console.error('Notify error:', error);
      toast({ title: 'Failed to notify subscribers', variant: 'destructive' });
    } finally {
      setNotifyingProduct(null);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts((data || []) as Product[]);
    } catch (error) {
      console.error('Fetch products error:', error);
      toast({ title: 'Failed to load products', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, has_sizes')
        .order('name');

      if (error) throw error;
      setCategories((data || []) as Category[]);
    } catch (error) {
      console.error('Fetch categories error:', error);
    }
  };

  // Check if selected category has sizes
  const selectedCategoryHasSizes = () => {
    if (!formData.category_id) return true;
    const category = categories.find(c => c.id === formData.category_id);
    return category?.has_sizes ?? true;
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price) {
      toast({ title: 'Name and price are required', variant: 'destructive' });
      return;
    }

    // Validate price is positive
    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0) {
      toast({ title: 'Price must be a positive number', variant: 'destructive' });
      return;
    }

    // Validate stock is non-negative
    const stock = parseInt(formData.stock) || 0;
    if (stock < 0) {
      toast({ title: 'Stock cannot be negative', variant: 'destructive' });
      return;
    }

    // Generate secure random slug suffix instead of timestamp
    const baseSlug = formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const randomSuffix = crypto.randomUUID().split('-')[0];
    
    const productData = {
      name: formData.name.substring(0, 200), // Limit name length
      slug: editingProduct ? editingProduct.slug : `${baseSlug}-${randomSuffix}`,
      price: price,
      sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
      stock: stock,
      description: formData.description?.substring(0, 5000) || null, // Limit description
      short_description: formData.short_description?.substring(0, 500) || null,
      sizes: formData.sizes.split(',').map(s => s.trim()).filter(Boolean).slice(0, 20),
      colors: formData.colors ? formData.colors.split(',').map(s => s.trim()).filter(Boolean).slice(0, 20) : [],
      images: formData.images.slice(0, 10), // Limit images
      sku: formData.sku?.substring(0, 50) || null,
      is_active: formData.is_active,
      is_new: formData.is_new,
      is_featured: formData.is_featured,
      category_id: formData.category_id || null,
      video_url: formData.video_url?.trim() || null,
    };

    try {
      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        if (error) throw error;
        await logAdminAction({ action: 'update', entityType: 'product', entityId: editingProduct.id, details: { name: productData.name } });
        toast({ title: 'Product updated' });
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert(productData)
          .select('id')
          .single();
        if (error) throw error;
        await logAdminAction({ action: 'create', entityType: 'product', entityId: data?.id, details: { name: productData.name } });
        toast({ title: 'Product created' });
      }

      setDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Save product error:', error);
      toast({ title: 'Failed to save product', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    const product = products.find(p => p.id === id);

    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      await logAdminAction({ action: 'delete', entityType: 'product', entityId: id, details: { name: product?.name } });
      setProducts(products.filter(p => p.id !== id));
      toast({ title: 'Product deleted' });
    } catch (error) {
      console.error('Delete error:', error);
      toast({ title: 'Failed to delete product', variant: 'destructive' });
    }
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      sale_price: product.sale_price?.toString() || '',
      stock: product.stock.toString(),
      description: product.description || '',
      short_description: product.short_description || '',
      sizes: product.sizes?.join(', ') || 'S, M, L, XL',
      colors: product.colors?.join(', ') || '',
      sku: product.sku || '',
      images: product.images || [],
      is_active: product.is_active,
      is_new: product.is_new,
      is_featured: product.is_featured,
      category_id: product.category_id || '',
      video_url: product.video_url || '',
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      price: '',
      sale_price: '',
      stock: '',
      description: '',
      short_description: '',
      sizes: 'S, M, L, XL',
      colors: '',
      sku: '',
      images: [],
      is_active: true,
      is_new: true,
      is_featured: false,
      category_id: '',
      video_url: '',
    });
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {/* Image Upload */}
              <div>
                <Label className="mb-2 block">Product Images</Label>
                <ImageUpload
                  images={formData.images}
                  onImagesChange={(images) => setFormData({ ...formData, images })}
                />
              </div>

              <div>
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Product name"
                />
              </div>

              <div>
                <Label>Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>SKU</Label>
                <Input
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="SKU-001"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Price (৳) *</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Sale Price (৳)</Label>
                  <Input
                    type="number"
                    value={formData.sale_price}
                    onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Stock</Label>
                  <Input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="0"
                  />
                </div>
                {selectedCategoryHasSizes() && (
                  <div>
                    <Label>Sizes (comma separated)</Label>
                    <Input
                      value={formData.sizes}
                      onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                      placeholder="S, M, L, XL"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label>Colors (comma separated)</Label>
                <Input
                  value={formData.colors}
                  onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                  placeholder="Black, White, Navy"
                />
              </div>

              <div>
                <Label>Short Description</Label>
                <Input
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  placeholder="Brief product summary"
                />
              </div>

              <div>
                <Label>Full Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed product description..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Video URL (YouTube or direct video link)</Label>
                <Input
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=... or https://example.com/video.mp4"
                />
                <p className="text-xs text-muted-foreground mt-1">Supports YouTube links or direct video URLs</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Active (visible on store)</Label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>New Arrival Badge</Label>
                  <Switch
                    checked={formData.is_new}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_new: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Featured Product</Label>
                  <Switch
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                </div>
              </div>

              <Button onClick={handleSubmit} className="w-full">
                {editingProduct ? 'Update Product' : 'Create Product'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No products found</p>
          </div>
        ) : (
          filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card rounded-xl border border-border overflow-hidden"
            >
              <div className="aspect-square bg-secondary/50 flex items-center justify-center">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="h-16 w-16 text-muted-foreground/30" />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium line-clamp-1">{product.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {product.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold">৳{Number(product.price).toLocaleString()}</span>
                  {product.sale_price && (
                    <span className="text-sm text-muted-foreground line-through">
                      ৳{Number(product.sale_price).toLocaleString()}
                    </span>
                  )}
                </div>
                {product.sku && (
                  <p className="text-xs text-muted-foreground mb-2">SKU: {product.sku}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Stock: {product.stock}</span>
                  <div className="flex gap-1">
                    {product.sale_price && product.sale_price < product.price && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleNotifySubscribers(product)}
                        disabled={notifyingProduct === product.id}
                        title="Notify subscribers about this sale"
                      >
                        {notifyingProduct === product.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Bell className="h-4 w-4 text-amber-500" />
                        )}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => openEdit(product)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
