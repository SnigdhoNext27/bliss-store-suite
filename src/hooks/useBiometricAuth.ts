import { useState, useEffect, useCallback } from 'react';
import { biometricAuth, BiometricStatus, BiometricCredentials } from '@/lib/biometricAuth';
import { useToast } from '@/hooks/use-toast';

interface UseBiometricAuthResult {
  status: BiometricStatus;
  isLoading: boolean;
  verify: (options?: { title?: string; subtitle?: string }) => Promise<boolean>;
  saveCredentials: (credentials: BiometricCredentials) => Promise<boolean>;
  getCredentials: () => Promise<BiometricCredentials | null>;
  deleteCredentials: () => Promise<boolean>;
  getBiometryLabel: () => string;
}

export function useBiometricAuth(): UseBiometricAuthResult {
  const [status, setStatus] = useState<BiometricStatus>({
    isAvailable: false,
    biometryType: 'none',
    hasCredentials: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkStatus = async () => {
      const result = await biometricAuth.checkAvailability();
      setStatus(result);
      setIsLoading(false);
    };
    checkStatus();
  }, []);

  const verify = useCallback(async (options?: { title?: string; subtitle?: string }) => {
    const success = await biometricAuth.verify(options);
    if (!success) {
      toast({
        title: 'Authentication failed',
        description: 'Biometric verification was unsuccessful. Please try again.',
        variant: 'destructive',
      });
    }
    return success;
  }, [toast]);

  const saveCredentials = useCallback(async (credentials: BiometricCredentials) => {
    const success = await biometricAuth.saveCredentials(credentials);
    if (success) {
      setStatus(prev => ({ ...prev, hasCredentials: true }));
      toast({
        title: 'Biometric login enabled',
        description: 'You can now use biometrics to sign in quickly.',
      });
    } else {
      toast({
        title: 'Failed to save',
        description: 'Could not enable biometric login. Please try again.',
        variant: 'destructive',
      });
    }
    return success;
  }, [toast]);

  const getCredentials = useCallback(async () => {
    return await biometricAuth.getCredentials();
  }, []);

  const deleteCredentials = useCallback(async () => {
    const success = await biometricAuth.deleteCredentials();
    if (success) {
      setStatus(prev => ({ ...prev, hasCredentials: false }));
      toast({
        title: 'Biometric login disabled',
        description: 'Your saved credentials have been removed.',
      });
    }
    return success;
  }, [toast]);

  const getBiometryLabel = useCallback(() => {
    switch (status.biometryType) {
      case 'face':
        return 'Face ID';
      case 'fingerprint':
        return 'Fingerprint';
      case 'iris':
        return 'Iris Scan';
      default:
        return 'Biometrics';
    }
  }, [status.biometryType]);

  return {
    status,
    isLoading,
    verify,
    saveCredentials,
    getCredentials,
    deleteCredentials,
    getBiometryLabel,
  };
}
