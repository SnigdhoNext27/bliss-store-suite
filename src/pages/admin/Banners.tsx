import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Image, GripVertical, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string | null;
  tagline: string | null;
  description: string | null;
  image_url: string;
  cta_text: string | null;
  cta_link: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export default function Banners() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    tagline: '',
    description: '',
    image_url: '',
    cta_text: 'Shop Now',
    cta_link: '#products',
    is_active: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setSlides(data || []);
    } catch (error) {
      console.error('Fetch slides error:', error);
      toast({ title: 'Failed to load banners', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.image_url) {
      toast({ title: 'Title and image URL are required', variant: 'destructive' });
      return;
    }

    const slideData = {
      title: formData.title,
      subtitle: formData.subtitle || null,
      tagline: formData.tagline || null,
      description: formData.description || null,
      image_url: formData.image_url,
      cta_text: formData.cta_text || 'Shop Now',
      cta_link: formData.cta_link || '#products',
      is_active: formData.is_active,
      display_order: editingSlide?.display_order || slides.length,
    };

    try {
      if (editingSlide) {
        const { error } = await supabase
          .from('hero_slides')
          .update(slideData)
          .eq('id', editingSlide.id);
        if (error) throw error;
        toast({ title: 'Banner updated' });
      } else {
        const { error } = await supabase
          .from('hero_slides')
          .insert(slideData);
        if (error) throw error;
        toast({ title: 'Banner created' });
      }

      setDialogOpen(false);
      resetForm();
      fetchSlides();
    } catch (error) {
      console.error('Save slide error:', error);
      toast({ title: 'Failed to save banner', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    try {
      const { error } = await supabase.from('hero_slides').delete().eq('id', id);
      if (error) throw error;
      setSlides(slides.filter(s => s.id !== id));
      toast({ title: 'Banner deleted' });
    } catch (error) {
      console.error('Delete error:', error);
      toast({ title: 'Failed to delete banner', variant: 'destructive' });
    }
  };

  const toggleActive = async (slide: HeroSlide) => {
    try {
      const { error } = await supabase
        .from('hero_slides')
        .update({ is_active: !slide.is_active })
        .eq('id', slide.id);
      if (error) throw error;
      setSlides(slides.map(s => s.id === slide.id ? { ...s, is_active: !s.is_active } : s));
    } catch (error) {
      console.error('Toggle error:', error);
      toast({ title: 'Failed to update banner', variant: 'destructive' });
    }
  };

  const openEdit = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title,
      subtitle: slide.subtitle || '',
      tagline: slide.tagline || '',
      description: slide.description || '',
      image_url: slide.image_url,
      cta_text: slide.cta_text || 'Shop Now',
      cta_link: slide.cta_link || '#products',
      is_active: slide.is_active,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingSlide(null);
    setFormData({
      title: '',
      subtitle: '',
      tagline: '',
      description: '',
      image_url: '',
      cta_text: 'Shop Now',
      cta_link: '#products',
      is_active: true,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading banners...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Hero Banners</h1>
          <p className="text-muted-foreground">Manage homepage slideshow</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSlide ? 'Edit Banner' : 'Add New Banner'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="ALMANS"
                />
              </div>
              <div>
                <Label>Subtitle</Label>
                <Input
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="New Collection"
                />
              </div>
              <div>
                <Label>Tagline</Label>
                <Input
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="Timeless Style 2025"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Banner description..."
                />
              </div>
              <div>
                <Label>Image URL *</Label>
                <Input
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>CTA Text</Label>
                  <Input
                    value={formData.cta_text}
                    onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                    placeholder="Shop Now"
                  />
                </div>
                <div>
                  <Label>CTA Link</Label>
                  <Input
                    value={formData.cta_link}
                    onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
                    placeholder="#products"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
              <Button onClick={handleSubmit} className="w-full">
                {editingSlide ? 'Update Banner' : 'Create Banner'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Banners List */}
      <div className="space-y-4">
        {slides.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center text-muted-foreground">
            <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No banners yet</p>
            <p className="text-sm">Add your first hero banner</p>
          </div>
        ) : (
          slides.map((slide, index) => (
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card rounded-xl border border-border overflow-hidden"
            >
              <div className="flex items-stretch">
                {/* Thumbnail */}
                <div className="w-48 h-32 bg-secondary flex-shrink-0">
                  {slide.image_url ? (
                    <img
                      src={slide.image_url}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    <div>
                      <h3 className="font-medium">{slide.title}</h3>
                      <p className="text-sm text-muted-foreground">{slide.tagline}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleActive(slide)}
                      className={`p-2 rounded-lg transition-colors ${slide.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                    >
                      {slide.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(slide)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(slide.id)}>
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
