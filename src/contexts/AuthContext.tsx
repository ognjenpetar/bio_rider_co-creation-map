import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: UserRole;
  isLoading: boolean;
  isAuthenticated: boolean;
  canEdit: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile from database
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data as Profile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }, []);

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  }, [user, fetchProfile]);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        // Get current session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
        }

        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);

          // Fetch profile if user exists
          if (currentSession?.user) {
            const profileData = await fetchProfile(currentSession.user.id);
            if (mounted) {
              setProfile(profileData);
            }
          }

          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (mounted) {
          setSession(newSession);
          setUser(newSession?.user ?? null);

          if (newSession?.user) {
            // Small delay to allow trigger to create profile
            if (event === 'SIGNED_IN') {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
            const profileData = await fetchProfile(newSession.user.id);
            if (mounted) {
              setProfile(profileData);
            }
          } else {
            setProfile(null);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Sign in with Google OAuth
  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${import.meta.env.VITE_BASE_PATH || '/'}`,
      },
    });

    if (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }

    setUser(null);
    setSession(null);
    setProfile(null);
  }, []);

  // Derived role values
  const role: UserRole = profile?.role ?? 'viewer';
  const isAuthenticated = !!user && !!session;
  const canEdit = role === 'superadmin' || role === 'admin' || role === 'editor';
  const isAdmin = role === 'superadmin' || role === 'admin';
  const isSuperAdmin = role === 'superadmin';

  const value: AuthContextType = {
    user,
    session,
    profile,
    role,
    isLoading,
    isAuthenticated,
    canEdit,
    isAdmin,
    isSuperAdmin,
    signInWithGoogle,
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
