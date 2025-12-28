import { useState } from 'react';
import { MapPin, Check, Plus, Star, Pencil, Trash2, MoreVertical, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { SavedAddress } from '@/hooks/useSavedAddresses';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface SavedAddressSelectorProps {
  addresses: SavedAddress[];
  loading: boolean;
  selectedAddressId: string | null;
  onSelectAddress: (address: SavedAddress | null) => void;
  onAddNewAddress: () => void;
  onSetDefault?: (id: string) => Promise<boolean>;
  onUpdateAddress?: (id: string, data: Partial<SavedAddress>) => Promise<boolean>;
  onDeleteAddress?: (id: string) => Promise<boolean>;
}

export function SavedAddressSelector({
  addresses,
  loading,
  selectedAddressId,
  onSelectAddress,
  onAddNewAddress,
  onSetDefault,
  onUpdateAddress,
  onDeleteAddress,
}: SavedAddressSelectorProps) {
  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [editForm, setEditForm] = useState({
    label: '',
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    district: '',
  });

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (addresses.length === 0) {
    return null;
  }

  const handleSetDefault = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!onSetDefault) return;
    
    setActionLoading(id);
    const success = await onSetDefault(id);
    setActionLoading(null);
    
    if (success) {
      toast({ title: 'Default address updated' });
    } else {
      toast({ title: 'Failed to update default address', variant: 'destructive' });
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!onDeleteAddress) return;
    
    setActionLoading(id);
    const success = await onDeleteAddress(id);
    setActionLoading(null);
    
    if (success) {
      toast({ title: 'Address deleted' });
      if (selectedAddressId === id) {
        onSelectAddress(null);
      }
    } else {
      toast({ title: 'Failed to delete address', variant: 'destructive' });
    }
  };

  const openEditDialog = (e: React.MouseEvent, address: SavedAddress) => {
    e.stopPropagation();
    setEditingAddress(address);
    setEditForm({
      label: address.label || 'Home',
      full_name: address.full_name,
      phone: address.phone,
      address_line1: address.address_line1,
      address_line2: address.address_line2 || '',
      city: address.city,
      district: address.district || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingAddress || !onUpdateAddress) return;
    
    setActionLoading(editingAddress.id);
    const success = await onUpdateAddress(editingAddress.id, {
      label: editForm.label,
      full_name: editForm.full_name,
      phone: editForm.phone,
      address_line1: editForm.address_line1,
      address_line2: editForm.address_line2 || null,
      city: editForm.city,
      district: editForm.district || null,
    });
    setActionLoading(null);
    
    if (success) {
      toast({ title: 'Address updated' });
      setEditingAddress(null);
    } else {
      toast({ title: 'Failed to update address', variant: 'destructive' });
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-base font-medium">
            <MapPin className="h-4 w-4" />
            Saved Addresses
          </Label>
          <Button variant="ghost" size="sm" onClick={onAddNewAddress} className="text-primary">
            <Plus className="h-4 w-4 mr-1" />
            New Address
          </Button>
        </div>

        <RadioGroup
          value={selectedAddressId || 'new'}
          onValueChange={(value) => {
            if (value === 'new') {
              onSelectAddress(null);
            } else {
              const address = addresses.find(a => a.id === value);
              if (address) onSelectAddress(address);
            }
          }}
          className="space-y-3"
        >
          {addresses.map((address) => (
            <Label
              key={address.id}
              htmlFor={address.id}
              className={cn(
                "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all relative group",
                selectedAddressId === address.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{address.label}</span>
                  {address.is_default && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium">{address.full_name}</p>
                <p className="text-sm text-muted-foreground">{address.phone}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {address.address_line1}
                  {address.address_line2 && `, ${address.address_line2}`}
                  {address.city && `, ${address.city}`}
                  {address.district && `, ${address.district}`}
                </p>
              </div>

              {/* Quick Actions */}
              {(onSetDefault || onUpdateAddress || onDeleteAddress) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {actionLoading === address.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreVertical className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onUpdateAddress && (
                      <DropdownMenuItem onClick={(e) => openEditDialog(e as any, address)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {onSetDefault && !address.is_default && (
                      <DropdownMenuItem onClick={(e) => handleSetDefault(e as any, address.id)}>
                        <Star className="h-4 w-4 mr-2" />
                        Set as Default
                      </DropdownMenuItem>
                    )}
                    {onDeleteAddress && (
                      <DropdownMenuItem 
                        onClick={(e) => handleDelete(e as any, address.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {selectedAddressId === address.id && (
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
              )}
            </Label>
          ))}

          <Label
            htmlFor="new"
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
              selectedAddressId === null
                ? "border-primary bg-primary/5"
                : "border-dashed border-border hover:border-primary/50"
            )}
          >
            <RadioGroupItem value="new" id="new" />
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span className="font-medium">Enter new address</span>
            </div>
          </Label>
        </RadioGroup>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingAddress} onOpenChange={(open) => !open && setEditingAddress(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Address</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-label">Label</Label>
              <Input
                id="edit-label"
                value={editForm.label}
                onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                placeholder="Home, Office, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                value={editForm.address_line1}
                onChange={(e) => setEditForm({ ...editForm, address_line1: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-city">City</Label>
                <Input
                  id="edit-city"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-district">District</Label>
                <Input
                  id="edit-district"
                  value={editForm.district}
                  onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAddress(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={actionLoading === editingAddress?.id}>
              {actionLoading === editingAddress?.id && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
