import { useState, useEffect } from 'react';
import { Plus, Package, Edit, Trash2, ExternalLink, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { ImageUpload } from './ImageUpload';
import { Link } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  stock: number;
  is_active: boolean;
  images: string[] | null;
}

interface CategoryProductsSectionProps {
  categoryId: string;
  categoryName: string;
  hasSizes: boolean;
}

export function CategoryProductsSection({ categoryId, categoryName, hasSizes }: CategoryProductsSectionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    sale_price: '',
    stock: '0',
    images: [] as string[],
    sizes: hasSizes ? ['S', 'M', 'L', 'XL'] : [],
    colors: [] as string[],
    is_active: true,
  });

  useEffect(() => {
    fetchProducts();
  }, [categoryId]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, price, sale_price, stock, is_active, images')
        .eq('category_id', categoryId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts((data || []) as Product[]);
    } catch (error) {
      console.error('Fetch products error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price) {
      toast({ title: 'Name and price are required', variant: 'destructive' });
      return;
    }

    const slug = `${formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${crypto.randomUUID().split('-')[0]}`;
    
    try {
      const { error } = await supabase.from('products').insert({
        name: formData.name,
        slug,
        description: formData.description || null,
        price: parseFloat(formData.price),
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
        stock: parseInt(formData.stock) || 0,
        category_id: categoryId,
        images: formData.images.length > 0 ? formData.images : null,
        sizes: hasSizes ? formData.sizes : null,
        colors: formData.colors.length > 0 ? formData.colors : null,
        is_active: formData.is_active,
      });

      if (error) throw error;
      
      toast({ title: 'Product created successfully' });
      setDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Create product error:', error);
      toast({ title: 'Failed to create product', variant: 'destructive' });
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      setProducts(products.filter(p => p.id !== productId));
      toast({ title: 'Product deleted' });
    } catch (error) {
      console.error('Delete error:', error);
      toast({ title: 'Failed to delete product', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      sale_price: '',
      stock: '0',
      images: [],
      sizes: hasSizes ? ['S', 'M', 'L', 'XL'] : [],
      colors: [],
      is_active: true,
    });
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-4 text-muted-foreground text-sm">Loading products...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{products.length} Products</span>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1">
              <Plus className="h-3 w-3" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Product to {categoryName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Product Images</Label>
                <ImageUpload
                  images={formData.images}
                  onImagesChange={(images) => setFormData({ ...formData, images })}
                  maxImages={5}
                  folder="products"
                />
              </div>

              <div>
                <Label>Product Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Premium Cotton T-Shirt"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Product description..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Price (৳) *</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="1200"
                  />
                </div>
                <div>
                  <Label>Sale Price (৳)</Label>
                  <Input
                    type="number"
                    value={formData.sale_price}
                    onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                    placeholder="999"
                  />
                </div>
              </div>

              <div>
                <Label>Stock</Label>
                <Input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="10"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                <Label>Active</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <Button onClick={handleSubmit} className="w-full">
                Create Product
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {products.length > 3 && (
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-7 h-8 text-xs"
          />
        </div>
      )}

      {filteredProducts.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No products yet</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filteredProducts.slice(0, 5).map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{product.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={product.sale_price ? 'line-through' : ''}>
                    ৳{product.price}
                  </span>
                  {product.sale_price && (
                    <span className="text-primary font-medium">৳{product.sale_price}</span>
                  )}
                  <span>•</span>
                  <span className={product.stock > 0 ? '' : 'text-destructive'}>
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <Link to={`/admin/products?edit=${product.id}`}>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Edit className="h-3 w-3" />
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(product.id)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          {filteredProducts.length > 5 && (
            <Link to={`/admin/products?category=${categoryId}`} className="block">
              <Button variant="ghost" size="sm" className="w-full gap-1 text-xs">
                View all {filteredProducts.length} products
                <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
