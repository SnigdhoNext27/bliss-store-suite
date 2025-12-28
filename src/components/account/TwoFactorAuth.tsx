import { useState, useEffect } from 'react';
import { Shield, ShieldCheck, ShieldOff, Loader2, Copy, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MFAFactor {
  id: string;
  friendly_name?: string;
  factor_type: string;
  status: string;
  created_at: string;
}

export function TwoFactorAuth() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [unenrolling, setUnenrolling] = useState(false);
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [enrollmentData, setEnrollmentData] = useState<{
    qr: string;
    secret: string;
    factorId: string;
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [showUnenrollDialog, setShowUnenrollDialog] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);

  useEffect(() => {
    fetchMFAFactors();
  }, []);

  const fetchMFAFactors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      
      // Filter to only verified TOTP factors
      const verifiedFactors = data?.totp?.filter(f => f.status === 'verified') || [];
      setFactors(verifiedFactors as MFAFactor[]);
    } catch (error) {
      console.error('Error fetching MFA factors:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEnrollment = async () => {
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App',
      });
      
      if (error) throw error;
      
      if (data) {
        setEnrollmentData({
          qr: data.totp.qr_code,
          secret: data.totp.secret,
          factorId: data.id,
        });
        setShowEnrollDialog(true);
      }
    } catch (error) {
      toast({
        title: 'Failed to start 2FA setup',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setEnrolling(false);
    }
  };

  const verifyEnrollment = async () => {
    if (!enrollmentData || verificationCode.length !== 6) return;
    
    setVerifying(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: enrollmentData.factorId,
      });
      
      if (challengeError) throw challengeError;
      
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: enrollmentData.factorId,
        challengeId: challengeData.id,
        code: verificationCode,
      });
      
      if (verifyError) throw verifyError;
      
      toast({
        title: '2FA Enabled',
        description: 'Two-factor authentication has been successfully enabled.',
      });
      
      setShowEnrollDialog(false);
      setEnrollmentData(null);
      setVerificationCode('');
      fetchMFAFactors();
    } catch (error) {
      toast({
        title: 'Verification failed',
        description: 'Invalid code. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setVerifying(false);
    }
  };

  const unenrollFactor = async () => {
    if (factors.length === 0) return;
    
    setUnenrolling(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: factors[0].id,
      });
      
      if (error) throw error;
      
      toast({
        title: '2FA Disabled',
        description: 'Two-factor authentication has been disabled.',
      });
      
      setShowUnenrollDialog(false);
      fetchMFAFactors();
    } catch (error) {
      toast({
        title: 'Failed to disable 2FA',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setUnenrolling(false);
    }
  };

  const copySecret = async () => {
    if (!enrollmentData?.secret) return;
    
    try {
      await navigator.clipboard.writeText(enrollmentData.secret);
      setSecretCopied(true);
      setTimeout(() => setSecretCopied(false), 2000);
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Please manually copy the secret.',
        variant: 'destructive',
      });
    }
  };

  const cancelEnrollment = async () => {
    if (enrollmentData) {
      // Unenroll the pending factor
      try {
        await supabase.auth.mfa.unenroll({ factorId: enrollmentData.factorId });
      } catch {
        // Ignore errors when canceling
      }
    }
    setShowEnrollDialog(false);
    setEnrollmentData(null);
    setVerificationCode('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const isEnabled = factors.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-full ${isEnabled ? 'bg-green-500/10' : 'bg-muted'}`}>
          {isEnabled ? (
            <ShieldCheck className="h-6 w-6 text-green-600" />
          ) : (
            <Shield className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">Two-Factor Authentication (2FA)</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {isEnabled
              ? 'Your account is protected with two-factor authentication.'
              : 'Add an extra layer of security to your account by requiring a verification code in addition to your password.'}
          </p>
          
          {isEnabled && (
            <div className="mt-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <ShieldCheck className="h-4 w-4" />
                <span>2FA is enabled using Authenticator App</span>
              </div>
            </div>
          )}
        </div>
        
        <div>
          {isEnabled ? (
            <Button
              variant="outline"
              onClick={() => setShowUnenrollDialog(true)}
              className="text-destructive hover:text-destructive"
            >
              <ShieldOff className="h-4 w-4 mr-2" />
              Disable
            </Button>
          ) : (
            <Button onClick={startEnrollment} disabled={enrolling}>
              {enrolling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Enable 2FA
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Enrollment Dialog */}
      <Dialog open={showEnrollDialog} onOpenChange={(open) => !open && cancelEnrollment()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* QR Code */}
            {enrollmentData?.qr && (
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-lg">
                  <img
                    src={enrollmentData.qr}
                    alt="2FA QR Code"
                    className="w-48 h-48"
                  />
                </div>
              </div>
            )}

            {/* Manual Entry Secret */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Can't scan? Enter this code manually:
              </Label>
              <div className="flex gap-2">
                <code className="flex-1 p-2 bg-muted rounded text-xs font-mono break-all">
                  {enrollmentData?.secret}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copySecret}
                  className="flex-shrink-0"
                >
                  {secretCopied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Verification Code Input */}
            <div className="space-y-2">
              <Label>Enter the 6-digit code from your app</Label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-widest font-mono"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={cancelEnrollment}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={verifyEnrollment}
                disabled={verificationCode.length !== 6 || verifying}
              >
                {verifying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Enable'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unenroll Confirmation Dialog */}
      <Dialog open={showUnenrollDialog} onOpenChange={setShowUnenrollDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication?</DialogTitle>
            <DialogDescription>
              This will make your account less secure. You can re-enable 2FA at any time.
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Without 2FA, your account will only be protected by your password.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowUnenrollDialog(false)}
            >
              Keep Enabled
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={unenrollFactor}
              disabled={unenrolling}
            >
              {unenrolling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Disabling...
                </>
              ) : (
                'Disable 2FA'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
