import { useState } from 'react';
import { Award, Gift, Minus, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useLoyaltyPoints } from '@/hooks/useLoyaltyPoints';
import { useAuth } from '@/lib/auth';

interface LoyaltyPointsRedemptionProps {
  subtotal: number;
  onPointsRedemption: (pointsUsed: number, discountAmount: number) => void;
  redeemedPoints: number;
}

export function LoyaltyPointsRedemption({
  subtotal,
  onPointsRedemption,
  redeemedPoints,
}: LoyaltyPointsRedemptionProps) {
  const { user } = useAuth();
  const { points, tierInfo, calculatePointsValue, loadingPoints } = useLoyaltyPoints();
  const [selectedPoints, setSelectedPoints] = useState(redeemedPoints);

  if (!user || loadingPoints) return null;
  if (points === 0) return null;

  // Max discount is 50% of subtotal or all available points value
  const maxDiscountFromPoints = calculatePointsValue(points);
  const maxDiscount = Math.min(maxDiscountFromPoints, Math.floor(subtotal * 0.5));
  const maxRedeemablePoints = Math.min(points, maxDiscount * 10);

  const discountAmount = calculatePointsValue(selectedPoints);

  const handleApplyPoints = () => {
    onPointsRedemption(selectedPoints, discountAmount);
  };

  const handleRemovePoints = () => {
    setSelectedPoints(0);
    onPointsRedemption(0, 0);
  };

  const handleSliderChange = (value: number[]) => {
    // Round to nearest 10 points
    const rounded = Math.round(value[0] / 10) * 10;
    setSelectedPoints(rounded);
  };

  if (redeemedPoints > 0) {
    return (
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <Check className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Points Applied</p>
              <p className="text-xs text-muted-foreground">
                {redeemedPoints} points = ৳{calculatePointsValue(redeemedPoints)} discount
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleRemovePoints}>
            Remove
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-4 border border-border">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          <Award className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">Redeem Loyalty Points</p>
          <p className="text-xs text-muted-foreground">
            You have <span className="font-semibold text-primary">{points}</span> points (worth ৳{calculatePointsValue(points)})
          </p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${tierInfo.bgColor} ${tierInfo.color}`}>
          {tierInfo.name}
        </span>
      </div>

      <div className="space-y-4">
        {/* Points Slider */}
        <div className="px-2">
          <Slider
            value={[selectedPoints]}
            onValueChange={handleSliderChange}
            max={maxRedeemablePoints}
            step={10}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>0 pts</span>
            <span>{maxRedeemablePoints} pts</span>
          </div>
        </div>

        {/* Quick Select Buttons */}
        <div className="flex gap-2 flex-wrap">
          {[25, 50, 75, 100].map((percent) => {
            const pointsValue = Math.floor((maxRedeemablePoints * percent) / 100 / 10) * 10;
            if (pointsValue <= 0) return null;
            return (
              <Button
                key={percent}
                variant={selectedPoints === pointsValue ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPoints(pointsValue)}
                className="text-xs"
              >
                {pointsValue} pts
              </Button>
            );
          })}
        </div>

        {/* Apply Button */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div>
            <p className="text-sm font-medium">
              {selectedPoints} points = <span className="text-primary">৳{discountAmount} off</span>
            </p>
          </div>
          <Button
            onClick={handleApplyPoints}
            disabled={selectedPoints === 0}
            size="sm"
            className="gap-2"
          >
            <Gift className="h-4 w-4" />
            Apply
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        *Maximum redemption is 50% of order value. 10 points = ৳1 discount.
      </p>
    </div>
  );
}
