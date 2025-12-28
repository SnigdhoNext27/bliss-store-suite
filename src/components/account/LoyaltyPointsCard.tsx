import { motion } from 'framer-motion';
import { Award, Gift, TrendingUp, History, Star, Crown, Trophy, Medal } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLoyaltyPoints } from '@/hooks/useLoyaltyPoints';
import { format } from 'date-fns';

const tierIcons = {
  bronze: Medal,
  silver: Trophy,
  gold: Crown,
  platinum: Star,
};

export function LoyaltyPointsCard() {
  const {
    points,
    lifetimePoints,
    tier,
    tierInfo,
    tierBenefits,
    nextTier,
    transactions,
    loadingPoints,
    loadingTransactions,
    calculatePointsValue,
  } = useLoyaltyPoints();

  const TierIcon = tierIcons[tier as keyof typeof tierIcons] || Medal;

  if (loadingPoints) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Points Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Loyalty Points
              </CardTitle>
              <CardDescription>Earn points on every purchase</CardDescription>
            </div>
            <Badge variant="secondary" className={`${tierInfo.bgColor} ${tierInfo.color} gap-1`}>
              <TierIcon className="h-3 w-3" />
              {tierInfo.name} Member
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Points Balance */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl"
          >
            <p className="text-sm text-muted-foreground mb-1">Available Points</p>
            <p className="font-display text-5xl font-bold text-primary">{points.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Worth ৳{calculatePointsValue(points)} in discounts
            </p>
          </motion.div>

          {/* Next Tier Progress */}
          {nextTier && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress to {nextTier.info.name}</span>
                <span className="font-medium">{nextTier.pointsNeeded} points to go</span>
              </div>
              <Progress
                value={Math.min(100, ((lifetimePoints - tierInfo.minPoints) / (nextTier.info.minPoints - tierInfo.minPoints)) * 100)}
                className="h-2"
              />
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-secondary/50 rounded-lg text-center">
              <TrendingUp className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{lifetimePoints.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Lifetime Points</p>
            </div>
            <div className="p-4 bg-secondary/50 rounded-lg text-center">
              <Gift className="h-5 w-5 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{tierInfo.discount}%</p>
              <p className="text-xs text-muted-foreground">Member Discount</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tier Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Membership Tiers</CardTitle>
          <CardDescription>Unlock more rewards as you earn points</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {Object.entries(tierBenefits).map(([tierKey, info]) => {
              const Icon = tierIcons[tierKey as keyof typeof tierIcons];
              const isCurrentTier = tier === tierKey;
              return (
                <div
                  key={tierKey}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    isCurrentTier ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${info.bgColor}`}>
                      <Icon className={`h-4 w-4 ${info.color}`} />
                    </div>
                    <div>
                      <p className="font-medium">{info.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {info.minPoints.toLocaleString()}+ lifetime points
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{info.discount}% off</p>
                    <p className="text-xs text-muted-foreground">{info.pointsMultiplier}x points</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5" />
            Points History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTransactions ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No points earned yet</p>
              <p className="text-sm">Start shopping to earn rewards!</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(transaction.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <span
                      className={`font-bold ${
                        transaction.type === 'earn' || transaction.type === 'bonus'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {transaction.type === 'earn' || transaction.type === 'bonus' ? '+' : '-'}
                      {Math.abs(transaction.points)}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* How it Works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <span className="text-primary font-bold">1</span>
              </div>
              <div>
                <p className="font-medium">Shop & Earn</p>
                <p className="text-muted-foreground">Earn 1 point for every ৳100 spent</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <span className="text-primary font-bold">2</span>
              </div>
              <div>
                <p className="font-medium">Level Up</p>
                <p className="text-muted-foreground">Unlock higher tiers for better rewards</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <span className="text-primary font-bold">3</span>
              </div>
              <div>
                <p className="font-medium">Redeem</p>
                <p className="text-muted-foreground">Use points for discounts (100 points = ৳10)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
