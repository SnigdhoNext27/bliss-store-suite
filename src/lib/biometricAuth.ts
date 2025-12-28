import { Capacitor } from '@capacitor/core';
import { NativeBiometric, BiometryType } from 'capacitor-native-biometric';

const isNative = Capacitor.isNativePlatform();
const CREDENTIALS_SERVER = 'app.lovable.almans';

export interface BiometricCredentials {
  username: string;
  password: string;
}

export interface BiometricStatus {
  isAvailable: boolean;
  biometryType: 'face' | 'fingerprint' | 'iris' | 'none';
  hasCredentials: boolean;
}

class BiometricAuthService {
  /**
   * Check if biometric authentication is available
   */
  async checkAvailability(): Promise<BiometricStatus> {
    if (!isNative) {
      return { isAvailable: false, biometryType: 'none', hasCredentials: false };
    }

    try {
      const result = await NativeBiometric.isAvailable();
      
      let biometryType: BiometricStatus['biometryType'] = 'none';
      if (result.isAvailable) {
        switch (result.biometryType) {
          case BiometryType.FACE_ID:
          case BiometryType.FACE_AUTHENTICATION:
            biometryType = 'face';
            break;
          case BiometryType.TOUCH_ID:
          case BiometryType.FINGERPRINT:
            biometryType = 'fingerprint';
            break;
          case BiometryType.IRIS_AUTHENTICATION:
            biometryType = 'iris';
            break;
        }
      }

      // Check if we have stored credentials
      let hasCredentials = false;
      try {
        await NativeBiometric.getCredentials({ server: CREDENTIALS_SERVER });
        hasCredentials = true;
      } catch {
        hasCredentials = false;
      }

      return {
        isAvailable: result.isAvailable,
        biometryType,
        hasCredentials,
      };
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return { isAvailable: false, biometryType: 'none', hasCredentials: false };
    }
  }

  /**
   * Verify user identity with biometrics
   */
  async verify(options?: { title?: string; subtitle?: string }): Promise<boolean> {
    if (!isNative) return false;

    try {
      await NativeBiometric.verifyIdentity({
        title: options?.title || 'Authenticate',
        subtitle: options?.subtitle || 'Use biometrics to continue',
        maxAttempts: 3,
      });
      return true;
    } catch (error) {
      console.error('Biometric verification failed:', error);
      return false;
    }
  }

  /**
   * Save credentials securely with biometric protection
   */
  async saveCredentials(credentials: BiometricCredentials): Promise<boolean> {
    if (!isNative) return false;

    try {
      await NativeBiometric.setCredentials({
        server: CREDENTIALS_SERVER,
        username: credentials.username,
        password: credentials.password,
      });
      return true;
    } catch (error) {
      console.error('Failed to save credentials:', error);
      return false;
    }
  }

  /**
   * Get saved credentials after biometric verification
   */
  async getCredentials(): Promise<BiometricCredentials | null> {
    if (!isNative) return null;

    try {
      // First verify identity
      const verified = await this.verify({
        title: 'Sign In',
        subtitle: 'Use biometrics to sign in quickly',
      });

      if (!verified) return null;

      // Get credentials
      const credentials = await NativeBiometric.getCredentials({
        server: CREDENTIALS_SERVER,
      });

      return {
        username: credentials.username,
        password: credentials.password,
      };
    } catch (error) {
      console.error('Failed to get credentials:', error);
      return null;
    }
  }

  /**
   * Delete saved credentials
   */
  async deleteCredentials(): Promise<boolean> {
    if (!isNative) return false;

    try {
      await NativeBiometric.deleteCredentials({
        server: CREDENTIALS_SERVER,
      });
      return true;
    } catch (error) {
      console.error('Failed to delete credentials:', error);
      return false;
    }
  }

  /**
   * Check if running on native platform
   */
  isNativePlatform(): boolean {
    return isNative;
  }
}

export const biometricAuth = new BiometricAuthService();
