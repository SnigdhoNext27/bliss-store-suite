import { useState, useEffect, useCallback } from 'react';

interface RateLimitState {
  attempts: number;
  lockoutUntil: number | null;
  lastAttempt: number | null;
}

const STORAGE_KEY = 'login_rate_limit';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_RESET_MS = 30 * 60 * 1000; // Reset attempts after 30 minutes of no activity

function getStoredState(): RateLimitState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const state = JSON.parse(stored) as RateLimitState;
      
      // Reset if last attempt was more than 30 minutes ago
      if (state.lastAttempt && Date.now() - state.lastAttempt > ATTEMPT_RESET_MS) {
        return { attempts: 0, lockoutUntil: null, lastAttempt: null };
      }
      
      // Clear lockout if it has expired
      if (state.lockoutUntil && Date.now() > state.lockoutUntil) {
        return { attempts: 0, lockoutUntil: null, lastAttempt: null };
      }
      
      return state;
    }
  } catch {
    // Ignore parsing errors
  }
  return { attempts: 0, lockoutUntil: null, lastAttempt: null };
}

function saveState(state: RateLimitState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

export function useLoginRateLimit() {
  const [state, setState] = useState<RateLimitState>(getStoredState);
  const [remainingTime, setRemainingTime] = useState<number>(0);

  // Update remaining lockout time
  useEffect(() => {
    if (!state.lockoutUntil) {
      setRemainingTime(0);
      return;
    }

    const updateRemaining = () => {
      const remaining = Math.max(0, state.lockoutUntil! - Date.now());
      setRemainingTime(remaining);
      
      if (remaining === 0) {
        // Lockout expired, reset state
        const newState = { attempts: 0, lockoutUntil: null, lastAttempt: null };
        setState(newState);
        saveState(newState);
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [state.lockoutUntil]);

  const isLocked = state.lockoutUntil !== null && Date.now() < state.lockoutUntil;
  const attemptsRemaining = Math.max(0, MAX_ATTEMPTS - state.attempts);

  const recordFailedAttempt = useCallback(() => {
    const newAttempts = state.attempts + 1;
    const newState: RateLimitState = {
      attempts: newAttempts,
      lockoutUntil: newAttempts >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_DURATION_MS : null,
      lastAttempt: Date.now(),
    };
    setState(newState);
    saveState(newState);
    
    return newAttempts >= MAX_ATTEMPTS;
  }, [state.attempts]);

  const recordSuccessfulLogin = useCallback(() => {
    const newState = { attempts: 0, lockoutUntil: null, lastAttempt: null };
    setState(newState);
    saveState(newState);
  }, []);

  const formatRemainingTime = useCallback(() => {
    if (remainingTime <= 0) return '';
    const minutes = Math.floor(remainingTime / 60000);
    const seconds = Math.floor((remainingTime % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [remainingTime]);

  return {
    isLocked,
    attemptsRemaining,
    remainingTime,
    formatRemainingTime,
    recordFailedAttempt,
    recordSuccessfulLogin,
  };
}
