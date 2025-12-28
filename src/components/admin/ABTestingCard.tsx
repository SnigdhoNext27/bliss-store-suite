import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FlaskConical, 
  Plus, 
  Loader2, 
  Eye, 
  MousePointerClick,
  Trophy,
  BarChart3,
  Trash2,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';

interface ABTest {
  id: string;
  ab_test_name: string;
  created_at: string;
  variants: {
    id: string;
    variant_id: string;
    title: string;
    message: string;
    opened_count: number;
    clicked_count: number;
  }[];
}

export function ABTestingCard() {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    testName: '',
    variantA: { title: '', message: '' },
    variantB: { title: '', message: '' },
  });

  const fetchTests = async () => {
    // Fetch A/B tests (parent notifications with variants)
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('is_ab_test', true)
      .is('parent_id', null)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching tests:', error);
      setLoading(false);
      return;
    }

    // For each test, fetch its variants
    const testsWithVariants: ABTest[] = [];
    
    for (const test of (data || [])) {
      const { data: variants } = await supabase
        .from('notifications')
        .select('*')
        .eq('parent_id', test.id);

      testsWithVariants.push({
        id: test.id,
        ab_test_name: test.ab_test_name || 'Untitled Test',
        created_at: test.created_at,
        variants: [
          {
            id: test.id,
            variant_id: 'A',
            title: test.title,
            message: test.message,
            opened_count: test.opened_count || 0,
            clicked_count: test.clicked_count || 0,
          },
          ...(variants || []).map((v: any) => ({
            id: v.id,
            variant_id: v.variant_id || 'B',
            title: v.title,
            message: v.message,
            opened_count: v.opened_count || 0,
            clicked_count: v.clicked_count || 0,
          })),
        ],
      });
    }

    setTests(testsWithVariants);
    setLoading(false);
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleCreateTest = async () => {
    if (!formData.testName || !formData.variantA.title || !formData.variantB.title) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);

    try {
      // Create variant A (parent)
      const { data: variantA, error: errorA } = await supabase
        .from('notifications')
        .insert({
          title: formData.variantA.title,
          message: formData.variantA.message,
          type: 'promo',
          is_global: true,
          is_sent: true,
          is_ab_test: true,
          ab_test_name: formData.testName,
          variant_id: 'A',
        })
        .select()
        .single();

      if (errorA) throw errorA;

      // Create variant B (child)
      const { error: errorB } = await supabase
        .from('notifications')
        .insert({
          title: formData.variantB.title,
          message: formData.variantB.message,
          type: 'promo',
          is_global: true,
          is_sent: true,
          is_ab_test: true,
          ab_test_name: formData.testName,
          variant_id: 'B',
          parent_id: variantA.id,
        });

      if (errorB) throw errorB;

      toast({
        title: 'A/B Test created!',
        description: 'Both variants are now live. Monitor results in the analytics.',
      });

      setDialogOpen(false);
      setFormData({
        testName: '',
        variantA: { title: '', message: '' },
        variantB: { title: '', message: '' },
      });
      fetchTests();
    } catch (error) {
      console.error('Error creating test:', error);
      toast({
        title: 'Error',
        description: 'Failed to create A/B test.',
        variant: 'destructive',
      });
    }

    setSending(false);
  };

  const handleDeleteTest = async (testId: string) => {
    // Delete parent (cascades to children)
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', testId);

    if (!error) {
      setTests(prev => prev.filter(t => t.id !== testId));
      toast({ title: 'Test deleted' });
    }
  };

  const getWinner = (variants: ABTest['variants']) => {
    if (variants.length < 2) return null;
    
    const [a, b] = variants;
    const aCTR = a.opened_count > 0 ? a.clicked_count / a.opened_count : 0;
    const bCTR = b.opened_count > 0 ? b.clicked_count / b.opened_count : 0;
    
    if (aCTR === bCTR) return null;
    return aCTR > bCTR ? 'A' : 'B';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            A/B Testing
          </CardTitle>
          <CardDescription>
            Test different notification variants and compare performance
          </CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Test
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create A/B Test</DialogTitle>
              <DialogDescription>
                Create two notification variants to test which performs better.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Test Name</Label>
                <Input
                  placeholder="e.g., Holiday Sale Copy Test"
                  value={formData.testName}
                  onChange={(e) => setFormData(p => ({ ...p, testName: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3 p-4 border border-border rounded-lg">
                  <Badge>Variant A</Badge>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      placeholder="Notification title"
                      value={formData.variantA.title}
                      onChange={(e) => setFormData(p => ({ 
                        ...p, 
                        variantA: { ...p.variantA, title: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea
                      placeholder="Notification message"
                      value={formData.variantA.message}
                      onChange={(e) => setFormData(p => ({ 
                        ...p, 
                        variantA: { ...p.variantA, message: e.target.value }
                      }))}
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-3 p-4 border border-border rounded-lg">
                  <Badge variant="secondary">Variant B</Badge>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      placeholder="Notification title"
                      value={formData.variantB.title}
                      onChange={(e) => setFormData(p => ({ 
                        ...p, 
                        variantB: { ...p.variantB, title: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea
                      placeholder="Notification message"
                      value={formData.variantB.message}
                      onChange={(e) => setFormData(p => ({ 
                        ...p, 
                        variantB: { ...p.variantB, message: e.target.value }
                      }))}
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Both variants will be sent to users randomly (50/50 split). Track performance in the analytics.
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateTest} disabled={sending} className="gap-2">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Launch Test
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {tests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No A/B tests yet</p>
            <p className="text-xs mt-1">Create a test to compare notification variants</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tests.map((test) => {
              const winner = getWinner(test.variants);
              const totalOpens = test.variants.reduce((sum, v) => sum + v.opened_count, 0);
              const totalClicks = test.variants.reduce((sum, v) => sum + v.clicked_count, 0);

              return (
                <motion.div
                  key={test.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-border rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-medium">{test.ab_test_name}</h4>
                      <p className="text-xs text-muted-foreground">
                        Started {formatDistanceToNow(new Date(test.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTest(test.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {test.variants.map((variant) => {
                      const ctr = variant.opened_count > 0 
                        ? Math.round((variant.clicked_count / variant.opened_count) * 100) 
                        : 0;
                      const isWinner = winner === variant.variant_id;
                      const openShare = totalOpens > 0 
                        ? (variant.opened_count / totalOpens) * 100 
                        : 50;

                      return (
                        <div 
                          key={variant.id} 
                          className={`p-3 rounded-lg ${
                            isWinner ? 'bg-primary/5 border border-primary/20' : 'bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={variant.variant_id === 'A' ? 'default' : 'secondary'}>
                              {variant.variant_id}
                            </Badge>
                            {isWinner && (
                              <Trophy className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                          <p className="text-sm font-medium truncate">{variant.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1 mb-3">{variant.message}</p>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Eye className="h-3 w-3" /> Opens
                              </span>
                              <span>{variant.opened_count}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <MousePointerClick className="h-3 w-3" /> Clicks
                              </span>
                              <span>{variant.clicked_count}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">CTR</span>
                              <span className="font-medium">{ctr}%</span>
                            </div>
                            <Progress value={ctr} className="h-1" />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {totalOpens > 10 && winner && (
                    <div className="mt-3 p-2 bg-green-500/10 text-green-700 dark:text-green-400 rounded text-xs text-center">
                      Variant {winner} is winning with a higher click-through rate!
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
