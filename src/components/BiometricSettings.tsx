import { useState } from 'react';
import { Fingerprint, ScanFace, Eye, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { useAuth } from '@/lib/auth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface BiometricSettingsProps {
  userPassword?: string; // Password to save for biometric login
}

export function BiometricSettings({ userPassword }: BiometricSettingsProps) {
  const { status, isLoading, saveCredentials, deleteCredentials, getBiometryLabel } = useBiometricAuth();
  const { user } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (isLoading || !status.isAvailable) {
    return null;
  }

  const Icon = status.biometryType === 'face' 
    ? ScanFace 
    : status.biometryType === 'iris'
    ? Eye
    : Fingerprint;

  const handleToggle = async (enabled: boolean) => {
    if (enabled) {
      if (!user?.email) {
        return;
      }

      // For enabling, we need the password - this would typically be passed
      // after a successful login or from a secure input
      if (userPassword) {
        setIsSaving(true);
        await saveCredentials({
          username: user.email,
          password: userPassword,
        });
        setIsSaving(false);
      }
    } else {
      setShowDeleteDialog(true);
    }
  };

  const handleDeleteConfirm = async () => {
    await deleteCredentials();
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{getBiometryLabel()} Login</CardTitle>
              <CardDescription>
                Use {getBiometryLabel().toLowerCase()} for quick, secure access
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {status.hasCredentials ? 'Enabled' : 'Disabled'}
              </p>
              <p className="text-xs text-muted-foreground">
                {status.hasCredentials 
                  ? 'Your credentials are securely stored on device'
                  : 'Enable to sign in faster next time'
                }
              </p>
            </div>
            
            {status.hasCredentials ? (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : (
              <Switch 
                checked={status.hasCredentials}
                onCheckedChange={handleToggle}
                disabled={isSaving || !userPassword}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable {getBiometryLabel()} Login?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove your saved credentials from this device. You'll need to enter your password to sign in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Disable
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
