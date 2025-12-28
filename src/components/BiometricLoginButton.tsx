import { motion } from 'framer-motion';
import { Fingerprint, ScanFace, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';

interface BiometricLoginButtonProps {
  onSuccess: (credentials: { email: string; password: string }) => void;
  className?: string;
}

export function BiometricLoginButton({ onSuccess, className }: BiometricLoginButtonProps) {
  const { status, isLoading, getCredentials, getBiometryLabel } = useBiometricAuth();

  if (isLoading) {
    return (
      <Button variant="outline" disabled className={className}>
        <Loader2 className="h-5 w-5 animate-spin" />
      </Button>
    );
  }

  if (!status.isAvailable || !status.hasCredentials) {
    return null;
  }

  const handleBiometricLogin = async () => {
    const credentials = await getCredentials();
    if (credentials) {
      onSuccess({
        email: credentials.username,
        password: credentials.password,
      });
    }
  };

  const Icon = status.biometryType === 'face' 
    ? ScanFace 
    : status.biometryType === 'iris'
    ? Eye
    : Fingerprint;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={className}
    >
      <Button
        variant="outline"
        size="lg"
        onClick={handleBiometricLogin}
        className="w-full gap-3 py-6 border-2 hover:bg-primary/5"
      >
        <Icon className="h-6 w-6 text-primary" />
        <span>Sign in with {getBiometryLabel()}</span>
      </Button>
    </motion.div>
  );
}
