// Haptic feedback utility for mobile devices
// Uses the Vibration API when available

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'selection';

const hapticPatterns: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 10],
  error: [50, 100, 50],
  selection: 5,
};

export function triggerHaptic(type: HapticType = 'light'): void {
  // Check if the Vibration API is supported
  if (!('vibrate' in navigator)) {
    return;
  }

  try {
    const pattern = hapticPatterns[type];
    navigator.vibrate(pattern);
  } catch (error) {
    // Silently fail if vibration is not available
    console.debug('Haptic feedback not available:', error);
  }
}

// Convenience functions for common haptic patterns
export const haptics = {
  light: () => triggerHaptic('light'),
  medium: () => triggerHaptic('medium'),
  heavy: () => triggerHaptic('heavy'),
  success: () => triggerHaptic('success'),
  error: () => triggerHaptic('error'),
  selection: () => triggerHaptic('selection'),
};
