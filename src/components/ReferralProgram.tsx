import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Copy, Gift, Check, Share2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Referral {
  id: string;
  referred_email: string;
  status: string;
  reward_points: number;
  created_at: string;
}

export function ReferralProgram() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState('');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [totalEarned, setTotalEarned] = useState(0);

  useEffect(() => {
    if (user) {
      fetchReferralData();
    }
  }, [user]);

  const fetchReferralData = async () => {
    try {
      // Get or create referral code
      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', user?.id)
        .single();

      if (profile?.referral_code) {
        setReferralCode(profile.referral_code);
      } else {
        // Generate new referral code
        const newCode = `REF${user?.id?.slice(0, 8).toUpperCase()}`;
        await supabase
          .from('profiles')
          .update({ referral_code: newCode })
          .eq('id', user?.id);
        setReferralCode(newCode);
      }

      // Fetch referrals
      const { data: referralsData } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user?.id)
        .order('created_at', { ascending: false });

      if (referralsData) {
        setReferrals(referralsData);
        const earned = referralsData
          .filter(r => r.status === 'completed')
          .reduce((sum, r) => sum + (r.reward_points || 0), 0);
        setTotalEarned(earned);
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/auth?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast({ title: 'Referral link copied!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = async () => {
    const link = `${window.location.origin}/auth?ref=${referralCode}`;
    const text = `Join Almans and get 10% off your first order! Use my referral link:`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Almans',
          text,
          url: link,
        });
      } catch (err) {
        copyReferralLink();
      }
    } else {
      copyReferralLink();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-500';
      case 'pending': return 'bg-yellow-500/10 text-yellow-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Please login to access your referral program</p>
          <Button className="mt-4" onClick={() => window.location.href = '/auth'}>
            Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Referral Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6">
          <CardHeader className="p-0 mb-4">
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-6 w-6 text-primary" />
              Refer Friends & Earn Rewards
            </CardTitle>
            <CardDescription>
              Share your referral link and earn 100 points for every friend who makes their first purchase!
            </CardDescription>
          </CardHeader>
          
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-card rounded-xl p-4 text-center"
            >
              <p className="text-3xl font-bold text-primary">{referrals.length}</p>
              <p className="text-sm text-muted-foreground">Total Referrals</p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-card rounded-xl p-4 text-center"
            >
              <p className="text-3xl font-bold text-green-500">
                {referrals.filter(r => r.status === 'completed').length}
              </p>
              <p className="text-sm text-muted-foreground">Successful</p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-card rounded-xl p-4 text-center"
            >
              <p className="text-3xl font-bold text-almans-gold">{totalEarned}</p>
              <p className="text-sm text-muted-foreground">Points Earned</p>
            </motion.div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Input
                value={`${window.location.origin}/auth?ref=${referralCode}`}
                readOnly
                className="pr-24 bg-card"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={copyReferralLink}
                className="absolute right-1 top-1/2 -translate-y-1/2"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <Button onClick={shareReferral} className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: 1, title: 'Share Your Link', desc: 'Send your unique referral link to friends' },
              { step: 2, title: 'Friend Signs Up', desc: 'They create an account and get 10% off' },
              { step: 3, title: 'Earn Points', desc: 'Get 100 points when they make a purchase' },
            ].map((item) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: item.step * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-xl flex items-center justify-center mx-auto mb-3">
                  {item.step}
                </div>
                <h4 className="font-medium mb-1">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Referral History */}
      <Card>
        <CardHeader>
          <CardTitle>Your Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No referrals yet. Start sharing!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral, index) => (
                <motion.div
                  key={referral.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{referral.referred_email}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(referral.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {referral.status === 'completed' && (
                      <span className="text-sm font-medium text-almans-gold">
                        +{referral.reward_points} pts
                      </span>
                    )}
                    <Badge variant="secondary" className={getStatusColor(referral.status)}>
                      {referral.status}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
