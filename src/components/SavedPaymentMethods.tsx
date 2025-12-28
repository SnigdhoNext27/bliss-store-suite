import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Smartphone, Trash2, Star, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useSavedPaymentMethods, SavedPaymentMethod } from '@/hooks/useSavedPaymentMethods';

interface SavedPaymentMethodsProps {
  onSelect?: (id: string) => void;
  selectedId?: string | null;
  showAddButton?: boolean;
}

export function SavedPaymentMethods({ 
  onSelect, 
  selectedId,
  showAddButton = true 
}: SavedPaymentMethodsProps) {
  const { methods, loading, addMethod, deleteMethod, setDefault } = useSavedPaymentMethods();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addingType, setAddingType] = useState<'bkash' | 'nagad' | 'card'>('bkash');
  const [formData, setFormData] = useState({
    phone_number: '',
    last_four: '',
    card_brand: '',
    nickname: '',
    is_default: false,
  });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    setSaving(true);
    const result = await addMethod({
      method_type: addingType,
      phone_number: addingType !== 'card' ? formData.phone_number : undefined,
      last_four: addingType === 'card' ? formData.last_four : undefined,
      card_brand: addingType === 'card' ? formData.card_brand : undefined,
      nickname: formData.nickname || undefined,
      is_default: formData.is_default,
    });
    
    if (!result.error) {
      setShowAddDialog(false);
      setFormData({ phone_number: '', last_four: '', card_brand: '', nickname: '', is_default: false });
    }
    setSaving(false);
  };

  const getMethodIcon = (type: string) => {
    if (type === 'card') return <CreditCard className="h-5 w-5" />;
    return <Smartphone className="h-5 w-5" />;
  };

  const getMethodLabel = (method: SavedPaymentMethod) => {
    if (method.method_type === 'card') {
      return `${method.card_brand || 'Card'} •••• ${method.last_four}`;
    }
    return `${method.method_type === 'bkash' ? 'bKash' : 'Nagad'} ${method.phone_number}`;
  };

  const getMethodColor = (type: string) => {
    if (type === 'bkash') return 'bg-pink-500/10 text-pink-600 dark:text-pink-400';
    if (type === 'nagad') return 'bg-orange-500/10 text-orange-600 dark:text-orange-400';
    return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Saved Payment Methods</h3>
        {showAddButton && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add New
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Payment Method</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Payment Type</Label>
                  <RadioGroup
                    value={addingType}
                    onValueChange={(v) => setAddingType(v as typeof addingType)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="bkash" id="add-bkash" />
                      <Label htmlFor="add-bkash" className="cursor-pointer">bKash</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="nagad" id="add-nagad" />
                      <Label htmlFor="add-nagad" className="cursor-pointer">Nagad</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="card" id="add-card" />
                      <Label htmlFor="add-card" className="cursor-pointer">Card</Label>
                    </div>
                  </RadioGroup>
                </div>

                {addingType !== 'card' ? (
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input
                      placeholder="01XXXXXXXXX"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Last 4 Digits</Label>
                      <Input
                        placeholder="1234"
                        maxLength={4}
                        value={formData.last_four}
                        onChange={(e) => setFormData({ ...formData, last_four: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Card Brand</Label>
                      <Input
                        placeholder="Visa, Mastercard, etc."
                        value={formData.card_brand}
                        onChange={(e) => setFormData({ ...formData, card_brand: e.target.value })}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label>Nickname (Optional)</Label>
                  <Input
                    placeholder="e.g., Personal, Business"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is-default"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="is-default" className="cursor-pointer">Set as default</Label>
                </div>

                <Button onClick={handleAdd} disabled={saving} className="w-full">
                  {saving ? 'Saving...' : 'Save Payment Method'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        {methods.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-muted-foreground"
          >
            <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No saved payment methods</p>
            <p className="text-sm">Add a payment method for faster checkout</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {methods.map((method) => (
              <motion.div
                key={method.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex items-center gap-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                  selectedId === method.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => onSelect?.(method.id)}
              >
                <div className={`p-2 rounded-lg ${getMethodColor(method.method_type)}`}>
                  {getMethodIcon(method.method_type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{getMethodLabel(method)}</span>
                    {method.is_default && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  {method.nickname && (
                    <span className="text-sm text-muted-foreground">{method.nickname}</span>
                  )}
                </div>
                {selectedId === method.id && (
                  <Check className="h-5 w-5 text-primary" />
                )}
                <div className="flex gap-1">
                  {!method.is_default && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDefault(method.id);
                      }}
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMethod(method.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
