import { motion } from 'framer-motion';
import { Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';

export function CurrencySelector() {
  const { selectedCurrency, currencies, setCurrency } = useCurrency();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 h-8 px-2">
          <Globe className="h-4 w-4" />
          <span className="font-medium">{selectedCurrency.code}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {currencies.map((currency) => (
          <DropdownMenuItem
            key={currency.code}
            onClick={() => setCurrency(currency.code)}
            className={cn(
              "flex items-center justify-between cursor-pointer",
              selectedCurrency.code === currency.code && "bg-primary/10"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="w-6 text-center font-medium">{currency.symbol}</span>
              <span>{currency.code}</span>
            </div>
            {selectedCurrency.code === currency.code && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <Check className="h-4 w-4 text-primary" />
              </motion.div>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
