import { useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Top 100 most common passwords to block
const COMMON_PASSWORDS = [
  'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', 'master',
  'dragon', '111111', 'baseball', 'iloveyou', 'trustno1', 'sunshine', 'letmein',
  'welcome', 'shadow', 'ashley', 'football', 'jesus', 'michael', 'ninja',
  'mustang', 'password1', '123456789', 'adobe123', 'admin', '1234567890',
  'photoshop', '1234567', '000000', '654321', 'qwertyuiop', 'superman',
  'princess', 'computer', 'starwars', 'summer', 'hottie', 'lovely', 'whatever',
  'password123', 'qwerty123', 'hunter', 'charlie', 'donald', 'aa123456',
  'killer', 'solo', 'qazwsx', 'batman', 'jennifer', 'jordan', 'login',
  'passw0rd', 'password!', 'zaq12wsx', 'george', 'pepper', 'buster', 'joshua',
  'tigger', 'andrew', 'harley', 'soccer', 'ranger', 'asshole', 'hockey',
  'thomas', 'klaster', 'andrea', 'michelle', 'daniel', 'corvette', 'access',
  'matrix', '1qaz2wsx', 'maggie', 'robert', 'taylor', 'flower', 'secret',
  'merlin', 'ginger', 'matthew', 'cheese', 'amanda', '121212', 'austin',
  'chicken', 'thunder', 'love', 'hello', 'letmein1', '123123', 'password2',
  'bailey', 'lakers'
];

export const isCommonPassword = (password: string): boolean => {
  return COMMON_PASSWORDS.includes(password.toLowerCase());
};

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter (a-z)', test: (p) => /[a-z]/.test(p) },
  { label: 'One number (0-9)', test: (p) => /[0-9]/.test(p) },
  { label: 'One special character (!@#$%^&*)', test: (p) => /[!@#$%^&*()_+\-=\[\]{}|;':",.\/<>?]/.test(p) },
  { label: 'Not a common password', test: (p) => p.length > 0 && !isCommonPassword(p) },
];

interface PasswordStrengthIndicatorProps {
  password: string;
  show?: boolean;
}

export function PasswordStrengthIndicator({ password, show = true }: PasswordStrengthIndicatorProps) {
  const { strength, passedCount } = useMemo(() => {
    const passed = PASSWORD_REQUIREMENTS.filter((req) => req.test(password));
    const count = passed.length;
    
    let strengthLevel: 'weak' | 'medium' | 'strong' = 'weak';
    if (count >= 6) strengthLevel = 'strong';
    else if (count >= 4) strengthLevel = 'medium';
    
    return { strength: strengthLevel, passedCount: count };
  }, [password]);

  if (!show || password.length === 0) return null;

  const strengthColors = {
    weak: 'bg-destructive',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500',
  };

  const strengthLabels = {
    weak: 'Weak',
    medium: 'Medium',
    strong: 'Strong',
  };

  return (
    <div className="space-y-3 mt-2">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span className={cn(
            'font-medium',
            strength === 'weak' && 'text-destructive',
            strength === 'medium' && 'text-yellow-600',
            strength === 'strong' && 'text-green-600'
          )}>
            {strengthLabels[strength]}
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full transition-all duration-300', strengthColors[strength])}
            style={{ width: `${(passedCount / PASSWORD_REQUIREMENTS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="grid gap-1">
        {PASSWORD_REQUIREMENTS.map((req, index) => {
          const passed = req.test(password);
          return (
            <div
              key={index}
              className={cn(
                'flex items-center gap-2 text-xs transition-colors',
                passed ? 'text-green-600' : 'text-muted-foreground'
              )}
            >
              {passed ? (
                <Check className="h-3 w-3 flex-shrink-0" />
              ) : (
                <X className="h-3 w-3 flex-shrink-0" />
              )}
              <span>{req.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Strong password schema for Zod validation
export const passwordRequirements = {
  minLength: 8,
  hasUppercase: /[A-Z]/,
  hasLowercase: /[a-z]/,
  hasNumber: /[0-9]/,
  hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{}|;':",.\/<>?]/,
  isNotCommon: (password: string) => !isCommonPassword(password),
};
