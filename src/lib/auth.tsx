import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AdminRole = 'super_admin' | 'admin' | 'moderator' | 'officer' | null;

export type UserProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  avatarCacheKey: number;
  loading: boolean;
  isAdmin: boolean;
  userRole: AdminRole;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<UserProfile, 'full_name' | 'avatar_url'>>) => void;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [avatarCacheKey, setAvatarCacheKey] = useState<number>(Date.now());
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<AdminRole>(null);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      setProfile((prev) => {
        const next = (data as UserProfile | null) ?? null;
        if ((prev?.avatar_url ?? null) !== (next?.avatar_url ?? null)) {
          setAvatarCacheKey(Date.now());
        }
        return next;
      });
    } catch {
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (!user?.id) return;
    await fetchProfile(user.id);
  };

  const updateProfile = (patch: Partial<Pick<UserProfile, 'full_name' | 'avatar_url'>>) => {
    if (!user?.id) return;

    if (patch.avatar_url !== undefined) {
      setAvatarCacheKey(Date.now());
    }

    setProfile((prev) => ({
      id: user.id,
      full_name: prev?.full_name ?? null,
      avatar_url: prev?.avatar_url ?? null,
      ...patch,
    }));
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Defer Supabase calls to avoid deadlock
      if (session?.user) {
        setTimeout(() => {
          checkAdminRole(session.user.id);
          fetchProfile(session.user.id);
        }, 0);
      } else {
        setIsAdmin(false);
        setUserRole(null);
        setProfile(null);
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        checkAdminRole(session.user.id);
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (userId: string) => {
    try {
      // Check for any admin-level role
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .in('role', ['super_admin', 'admin', 'moderator', 'officer'])
        .maybeSingle();

      if (!error && data) {
        setIsAdmin(true);
        setUserRole(data.role as AdminRole);
      } else {
        setIsAdmin(false);
        setUserRole(null);
      }
    } catch {
      setIsAdmin(false);
      setUserRole(null);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error: error as Error | null };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        avatarCacheKey,
        loading,
        isAdmin,
        userRole,
        refreshProfile,
        updateProfile,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
