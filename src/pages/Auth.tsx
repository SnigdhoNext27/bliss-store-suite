import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, AlertTriangle, Sparkles } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { PasswordStrengthIndicator, isCommonPassword } from '@/components/PasswordStrengthIndicator';
import { useLoginRateLimit } from '@/hooks/useLoginRateLimit';
import { MFAVerification } from '@/components/auth/MFAVerification';
import { WolfLogoIcon } from '@/components/WolfLogoIcon';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const strongPasswordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*()_+\-=\[\]{}|;':",.\/<>?]/, 'Password must contain at least one special character')
  .refine(
    (password) => !isCommonPassword(password),
    'This password is too common. Please choose a stronger password.'
  );

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: strongPasswordSchema,
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'mfa'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { user, signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { 
    isLocked, 
    attemptsRemaining, 
    formatRemainingTime, 
    recordFailedAttempt, 
    recordSuccessfulLogin 
  } = useLoginRateLimit();

  const redirectTo = searchParams.get('redirect') || '/';
  const modeParam = searchParams.get('mode');

  // Set mode from URL parameter
  useEffect(() => {
    if (modeParam === 'signup') {
      setMode('signup');
    } else if (modeParam === 'login') {
      setMode('login');
    }
  }, [modeParam]);

  useEffect(() => {
    if (user) {
      navigate(redirectTo);
    }
  }, [user, navigate, redirectTo]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          title: 'Google sign-in failed',
          description: error.message,
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to sign in with Google. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    if (mode === 'forgot') {
      if (!formData.email) {
        setErrors({ email: 'Email is required' });
        setLoading(false);
        return;
      }
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        setResetSent(true);
        toast({ title: 'Password reset email sent! Check your inbox.' });
      } catch (error) {
        toast({ title: 'Failed to send reset email', description: (error as Error).message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      if (mode === 'login') {
        if (isLocked) {
          toast({
            title: 'Too many failed attempts',
            description: `Please wait ${formatRemainingTime()} before trying again.`,
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        const result = loginSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach(err => {
            if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        
        if (error) {
          const wasLocked = recordFailedAttempt();
          if (wasLocked) {
            toast({
              title: 'Account temporarily locked',
              description: 'Too many failed login attempts. Please wait 15 minutes before trying again.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Login failed',
              description: error.message === 'Invalid login credentials' 
                ? `Invalid email or password. ${attemptsRemaining - 1} attempts remaining.`
                : error.message,
              variant: 'destructive',
            });
          }
        } else if (data.session) {
          const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          
          if (mfaData?.currentLevel === 'aal1' && mfaData?.nextLevel === 'aal2') {
            const { data: factorsData } = await supabase.auth.mfa.listFactors();
            const verifiedFactor = factorsData?.totp?.find(f => f.status === 'verified');
            
            if (verifiedFactor) {
              setMfaFactorId(verifiedFactor.id);
              setMode('mfa');
              setLoading(false);
              return;
            }
          }
          
          recordSuccessfulLogin();
          toast({ title: 'Welcome back!' });
          navigate(redirectTo);
        }
      } else {
        const result = signupSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach(err => {
            if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await signUp(formData.email, formData.password, formData.fullName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'Account exists',
              description: 'This email is already registered. Please login instead.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Signup failed',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({ title: 'Account created successfully!' });
          navigate(redirectTo);
        }
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Beautiful Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary to-accent/20" />
      
      {/* Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Floating Circles */}
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-accent/30 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            x: [0, -20, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/3 w-64 h-64 bg-primary/10 rounded-full blur-2xl"
          animate={{ 
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Pattern Grid */}
        <div className="absolute inset-0 opacity-[0.02] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMSI+PHBhdGggZD0iTTAgMGg0MHY0MEgwVjB6bTEgMWgzOHYzOEgxVjF6Ii8+PC9nPjwvZz48L3N2Zz4=')]" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Logo & Header */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Logo Icon */}
            <motion.div 
              className="mx-auto mb-6"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <WolfLogoIcon className="w-20 h-20" variant="default" />
            </motion.div>
            
            <h1 className="font-display text-4xl font-bold text-foreground mb-2">
              {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Join Almans' : mode === 'mfa' ? 'Verify Identity' : 'Reset Password'}
            </h1>
            <p className="text-muted-foreground">
              {mode === 'login' 
                ? 'Sign in to continue shopping' 
                : mode === 'signup'
                ? 'Create an account for exclusive access'
                : mode === 'mfa'
                ? 'Enter your 2FA code to continue'
                : 'Enter your email to reset your password'}
            </p>
          </motion.div>

          {/* Card */}
          <motion.div 
            className="bg-card/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-border/50"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <AnimatePresence mode="wait">
              {mode === 'mfa' && mfaFactorId ? (
                <motion.div
                  key="mfa"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <MFAVerification
                    factorId={mfaFactorId}
                    onSuccess={() => {
                      recordSuccessfulLogin();
                      toast({ title: 'Welcome back!' });
                      navigate(redirectTo);
                    }}
                    onCancel={() => {
                      setMode('login');
                      setMfaFactorId(null);
                      supabase.auth.signOut();
                    }}
                  />
                </motion.div>
              ) : mode === 'forgot' ? (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {resetSent ? (
                    <div className="text-center py-4">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="h-8 w-8 text-primary" />
                      </div>
                      <p className="text-muted-foreground mb-4">Check your email for a password reset link.</p>
                      <Button variant="outline" onClick={() => { setMode('login'); setResetSent(false); }}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Login
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="pl-12 h-12 rounded-xl border-border/50 bg-background/50"
                          />
                        </div>
                        {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
                      </div>
                      <Button type="submit" className="w-full h-12 rounded-xl text-base font-medium" disabled={loading}>
                        {loading ? 'Sending...' : 'Send Reset Link'}
                      </Button>
                      <Button type="button" variant="ghost" className="w-full" onClick={() => setMode('login')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Login
                      </Button>
                    </form>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="auth"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {/* Rate Limit Warning */}
                  {isLocked && (
                    <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-destructive">Account temporarily locked</p>
                        <p className="text-xs text-destructive/80 mt-1">
                          Too many failed login attempts. Please wait {formatRemainingTime()} before trying again.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Google Sign In */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 rounded-xl text-base font-medium border-border/50 bg-background/50 hover:bg-background"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
                  >
                    {googleLoading ? (
                      'Connecting...'
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                      </>
                    )}
                  </Button>

                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/50" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-card px-4 text-muted-foreground">or continue with email</span>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'signup' && (
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="fullName"
                            type="text"
                            placeholder="John Doe"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            className="pl-12 h-12 rounded-xl border-border/50 bg-background/50"
                          />
                        </div>
                        {errors.fullName && <p className="text-destructive text-sm">{errors.fullName}</p>}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="pl-12 h-12 rounded-xl border-border/50 bg-background/50"
                          autoComplete="email"
                        />
                      </div>
                      {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                        {mode === 'login' && (
                          <button
                            type="button"
                            onClick={() => setMode('forgot')}
                            className="text-xs text-primary hover:underline"
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="pl-12 pr-12 h-12 rounded-xl border-border/50 bg-background/50"
                          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
                      {mode === 'signup' && (
                        <PasswordStrengthIndicator password={formData.password} />
                      )}
                    </div>

                    {mode === 'signup' && (
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="confirmPassword"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className="pl-12 pr-12 h-12 rounded-xl border-border/50 bg-background/50"
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                        {errors.confirmPassword && <p className="text-destructive text-sm">{errors.confirmPassword}</p>}
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full h-12 rounded-xl text-base font-medium mt-2" 
                      disabled={loading || (mode === 'login' && isLocked)}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Sparkles className="h-4 w-4" />
                          </motion.div>
                          Please wait...
                        </span>
                      ) : mode === 'login' ? 'Sign In' : 'Create Account'}
                    </Button>

                    {mode === 'login' && attemptsRemaining < 5 && attemptsRemaining > 0 && !isLocked && (
                      <p className="text-xs text-muted-foreground text-center">
                        {attemptsRemaining} login {attemptsRemaining === 1 ? 'attempt' : 'attempts'} remaining
                      </p>
                    )}
                  </form>

                  {/* Toggle Mode */}
                  <div className="mt-6 text-center">
                    <p className="text-muted-foreground text-sm">
                      {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                      <button
                        onClick={() => {
                          setMode(mode === 'login' ? 'signup' : 'login');
                          setErrors({});
                        }}
                        className="text-primary hover:underline font-medium"
                      >
                        {mode === 'login' ? 'Sign Up' : 'Sign In'}
                      </button>
                    </p>
                  </div>

                  {/* Terms */}
                  {mode === 'signup' && (
                    <p className="mt-4 text-xs text-muted-foreground text-center">
                      By signing up, you agree to our{' '}
                      <a href="#" className="text-primary hover:underline">Terms of Service</a>
                      {' '}&{' '}
                      <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Back to Store */}
          <motion.div 
            className="text-center mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground text-sm inline-flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Store
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
