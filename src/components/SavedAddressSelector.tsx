import { useState } from 'react';
import { MapPin, Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { SavedAddress } from '@/hooks/useSavedAddresses';
import { cn } from '@/lib/utils';

interface SavedAddressSelectorProps {
  addresses: SavedAddress[];
  loading: boolean;
  selectedAddressId: string | null;
  onSelectAddress: (address: SavedAddress | null) => void;
  onAddNewAddress: () => void;
}

export function SavedAddressSelector({
  addresses,
  loading,
  selectedAddressId,
  onSelectAddress,
  onAddNewAddress,
}: SavedAddressSelectorProps) {
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

  return (
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
              "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
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
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
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
  );
}
