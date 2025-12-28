import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ruler } from 'lucide-react';

interface SizeGuideModalProps {
  category?: string;
}

const sizeCharts = {
  'T-Shirts': {
    headers: ['Size', 'Chest (in)', 'Length (in)', 'Shoulder (in)'],
    rows: [
      ['S', '36-38', '27', '17'],
      ['M', '38-40', '28', '18'],
      ['L', '40-42', '29', '19'],
      ['XL', '42-44', '30', '20'],
      ['XXL', '44-46', '31', '21'],
    ],
  },
  Shirts: {
    headers: ['Size', 'Chest (in)', 'Length (in)', 'Shoulder (in)', 'Sleeve (in)'],
    rows: [
      ['S', '38', '28', '17', '24'],
      ['M', '40', '29', '18', '25'],
      ['L', '42', '30', '19', '26'],
      ['XL', '44', '31', '20', '27'],
      ['XXL', '46', '32', '21', '28'],
    ],
  },
  Pants: {
    headers: ['Size', 'Waist (in)', 'Hip (in)', 'Length (in)', 'Inseam (in)'],
    rows: [
      ['28', '28', '36', '40', '30'],
      ['30', '30', '38', '41', '31'],
      ['32', '32', '40', '42', '32'],
      ['34', '34', '42', '43', '32'],
      ['36', '36', '44', '44', '33'],
      ['38', '38', '46', '44', '33'],
    ],
  },
  Jackets: {
    headers: ['Size', 'Chest (in)', 'Length (in)', 'Shoulder (in)', 'Sleeve (in)'],
    rows: [
      ['S', '40', '26', '17.5', '25'],
      ['M', '42', '27', '18.5', '26'],
      ['L', '44', '28', '19.5', '27'],
      ['XL', '46', '29', '20.5', '28'],
      ['XXL', '48', '30', '21.5', '29'],
    ],
  },
};

const measurementTips = [
  { label: 'Chest', tip: 'Measure around the fullest part of your chest, keeping the tape horizontal.' },
  { label: 'Waist', tip: 'Measure around your natural waistline, keeping the tape comfortably loose.' },
  { label: 'Hip', tip: 'Measure around the fullest part of your hips.' },
  { label: 'Length', tip: 'Measure from the highest point of the shoulder to the hem.' },
  { label: 'Shoulder', tip: 'Measure from one shoulder seam to the other across the back.' },
  { label: 'Sleeve', tip: 'Measure from the shoulder seam to the end of the sleeve.' },
  { label: 'Inseam', tip: 'Measure from the crotch to the bottom of the leg.' },
];

export function SizeGuideModal({ category }: SizeGuideModalProps) {
  const defaultCategory = category && sizeCharts[category as keyof typeof sizeCharts] 
    ? category 
    : 'T-Shirts';

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="text-sm text-primary hover:underline flex items-center gap-1">
          <Ruler className="h-3.5 w-3.5" />
          Size Guide
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">Size Guide</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={defaultCategory} className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="T-Shirts">T-Shirts</TabsTrigger>
            <TabsTrigger value="Shirts">Shirts</TabsTrigger>
            <TabsTrigger value="Pants">Pants</TabsTrigger>
            <TabsTrigger value="Jackets">Jackets</TabsTrigger>
          </TabsList>

          {Object.entries(sizeCharts).map(([cat, chart]) => (
            <TabsContent key={cat} value={cat} className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {chart.headers.map((header) => (
                        <th
                          key={header}
                          className="py-3 px-4 text-left font-semibold text-foreground bg-secondary/50"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {chart.rows.map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                      >
                        {row.map((cell, cellIdx) => (
                          <td
                            key={cellIdx}
                            className={`py-3 px-4 ${cellIdx === 0 ? 'font-medium' : 'text-muted-foreground'}`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Measurement Tips */}
        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="font-semibold text-foreground mb-4">How to Measure</h3>
          <div className="grid gap-3">
            {measurementTips.map((item) => (
              <div key={item.label} className="flex gap-3">
                <span className="font-medium text-primary min-w-[70px]">{item.label}:</span>
                <span className="text-muted-foreground text-sm">{item.tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="mt-4 p-4 bg-secondary/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Note:</strong> All measurements are in inches. 
            If you're between sizes, we recommend sizing up for a more comfortable fit.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
