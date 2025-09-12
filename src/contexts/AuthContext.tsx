import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth0, User as Auth0User } from '@auth0/auth0-react';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  organization?: string;
  avatar?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<{ error?: string }>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Helper function to map Auth0 user to our AuthUser interface
const mapAuth0UserToAuthUser = (auth0User: Auth0User): AuthUser => {
  return {
    id: auth0User.sub || '',
    email: auth0User.email || '',
    name: auth0User.name || auth0User.nickname || 'Unknown User',
    role: auth0User['https://supplychain.app/role'] || 'consumer', // Custom claim for role
    organization: auth0User['https://supplychain.app/organization'], // Custom claim for organization
    avatar: auth0User.picture
  };
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const isDevelopment = import.meta.env.DEV;
  const domain = import.meta.env.VITE_AUTH0_DOMAIN;
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
  const isAuth0Configured = domain && clientId && !domain.includes('dev-example') && !clientId.includes('your-auth0');
  
  // Mock user for development when Auth0 is not configured
  const mockUser: AuthUser = {
    id: 'dev-user-1',
    email: 'developer@localhost.com',
    name: 'Development User',
    role: 'admin',
    organization: 'Development Org',
    avatar: undefined
  };

  // Conditionally use Auth0 hooks only if Auth0 is configured
  let auth0User, isAuthenticated, auth0Loading, loginWithRedirect, auth0Logout;
  
  if (isAuth0Configured) {
    const auth0Data = useAuth0();
    auth0User = auth0Data.user;
    isAuthenticated = auth0Data.isAuthenticated;
    auth0Loading = auth0Data.isLoading;
    loginWithRedirect = auth0Data.loginWithRedirect;
    auth0Logout = auth0Data.logout;
  } else {
    // Mock Auth0 data for development
    auth0User = null;
    isAuthenticated = true; // Always authenticated in dev mode
    auth0Loading = false;
    loginWithRedirect = async () => {};
    auth0Logout = async () => {};
  }

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeUser = async () => {
      if (isDevelopment && !isAuth0Configured) {
        // Use mock user in development
        setUser(mockUser);
        setLoading(false);
      } else if (isAuthenticated && auth0User) {
        const mappedUser = mapAuth0UserToAuthUser(auth0User);
        setUser(mappedUser);
        setLoading(auth0Loading);
      } else {
        setUser(null);
        setLoading(auth0Loading);
      }
    };

    initializeUser();
  }, [isAuthenticated, auth0User, auth0Loading, isDevelopment, isAuth0Configured]);

  const login = async () => {
    if (isDevelopment && !isAuth0Configured) {
      // Mock login in development
      setUser(mockUser);
      return;
    }
    await loginWithRedirect({
      appState: {
        returnTo: window.location.pathname
      }
    });
  };

  const logout = async () => {
    setUser(null);
    if (isDevelopment && !isAuth0Configured) {
      // Mock logout in development
      return;
    }
    await auth0Logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  };

  const updateProfile = async (updates: Partial<AuthUser>) => {
    if (!user) return { error: 'No user logged in' };

    try {
      // Update local state
      setUser({ ...user, ...updates });
      // TODO: In production, sync with backend database
      return {};
    } catch (error: any) {
      return { error: error.message || 'Profile update failed' };
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateProfile,
    isAuthenticated: isDevelopment && !isAuth0Configured ? !!user : (isAuthenticated && !!user)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;