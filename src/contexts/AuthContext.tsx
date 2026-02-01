import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

const ADMIN_PASSWORD = 'greenmobility';
const STORAGE_KEY = 'bio_rider_user';

interface User {
  username: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password?: string) => { success: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const userData = JSON.parse(stored) as User;
        setUser(userData);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
    setIsLoading(false);
  }, []);

  // Login function
  const login = useCallback((username: string, password?: string): { success: boolean; error?: string } => {
    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      return { success: false, error: 'Unesite korisničko ime' };
    }

    if (trimmedUsername.length < 2) {
      return { success: false, error: 'Korisničko ime mora imati bar 2 karaktera' };
    }

    // Check if trying to login as admin
    if (trimmedUsername.toLowerCase() === 'admin') {
      if (!password || password !== ADMIN_PASSWORD) {
        return { success: false, error: 'Pogrešna šifra za admin nalog' };
      }

      const adminUser: User = {
        username: 'admin',
        isAdmin: true,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(adminUser));
      setUser(adminUser);
      return { success: true };
    }

    // Regular user login (no password needed)
    const regularUser: User = {
      username: trimmedUsername,
      isAdmin: false,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(regularUser));
    setUser(regularUser);
    return { success: true };
  }, []);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const isAuthenticated = !!user;
  const isAdmin = user?.isAdmin ?? false;

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    login,
    logout,
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
