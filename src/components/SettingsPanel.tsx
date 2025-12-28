import { motion } from 'framer-motion';
import { Settings, Globe, Palette, Check, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useCurrency } from '@/hooks/useCurrency';
import { useLanguage, languages } from '@/hooks/useLanguage';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export function SettingsPanel() {
  const { selectedCurrency, currencies, setCurrency } = useCurrency();
  const { selectedLanguage, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    { value: 'light', label: t('light'), icon: Sun },
    { value: 'dark', label: t('dark'), icon: Moon },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Settings className="h-5 w-5" />
          <span className="sr-only">{t('settings')}</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t('settings')}
          </SheetTitle>
          <SheetDescription>
            Customize your shopping experience
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] mt-6 pr-4">
          <div className="space-y-6">
            {/* Theme Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Palette className="h-4 w-4 text-muted-foreground" />
                {t('theme')}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {themeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-lg border transition-all",
                      theme === option.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <option.icon className={cn(
                      "h-5 w-5",
                      theme === option.value ? "text-primary" : "text-muted-foreground"
                    )} />
                    <span className="text-xs font-medium">{option.label}</span>
                    {theme === option.value && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1"
                      >
                        <Check className="h-3 w-3 text-primary" />
                      </motion.div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Language Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Globe className="h-4 w-4 text-muted-foreground" />
                {t('language')}
              </div>
              <div className="grid gap-2">
                {languages.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => setLanguage(language.code)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border transition-all",
                      selectedLanguage.code === language.code
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{language.flag}</span>
                      <div className="text-left">
                        <p className="text-sm font-medium">{language.name}</p>
                        <p className="text-xs text-muted-foreground">{language.nativeName}</p>
                      </div>
                    </div>
                    {selectedLanguage.code === language.code && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        <Check className="h-4 w-4 text-primary" />
                      </motion.div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Currency Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="text-muted-foreground text-base">💱</span>
                {t('currency')}
              </div>
              <div className="grid gap-2">
                {currencies.map((currency) => (
                  <button
                    key={currency.code}
                    onClick={() => setCurrency(currency.code)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border transition-all",
                      selectedCurrency.code === currency.code
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 text-center font-medium text-lg">{currency.symbol}</span>
                      <div className="text-left">
                        <p className="text-sm font-medium">{currency.code}</p>
                        <p className="text-xs text-muted-foreground">{currency.name}</p>
                      </div>
                    </div>
                    {selectedCurrency.code === currency.code && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        <Check className="h-4 w-4 text-primary" />
                      </motion.div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
