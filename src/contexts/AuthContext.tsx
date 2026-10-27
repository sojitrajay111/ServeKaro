import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/services/apiService';
import { authService, ApiError } from '@/services/api';


interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager';
  restaurantId: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  fetchUserProfile: () => Promise<void>;
  updateUserProfile: (profileData: { name: string; email: string; password?: string }) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = () => {
      try {
        const savedUser = localStorage.getItem('restaurantUser');
        const loginTime = localStorage.getItem('loginTime');
        
        if (savedUser && loginTime) {
          const now = Date.now();
          const loginTimestamp = parseInt(loginTime);
          const EIGHT_HOURS = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
          
          // Check if session is still valid (8 hours)
          if (now - loginTimestamp < EIGHT_HOURS) {
            setUser(JSON.parse(savedUser));
          } else {
            // Session expired
            localStorage.removeItem('restaurantUser');
            localStorage.removeItem('loginTime');
          }
        }
      } catch (error) {
        console.error('Error checking existing session:', error);
        localStorage.removeItem('restaurantUser');
        localStorage.removeItem('loginTime');
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingSession();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await authApi.login({ username, password });
      
      if (response && response.token) {
        const dummyUser: User = {
          id: response.user.id,
          email: response.user.email ,
          name: response.user.name,
          role: response.user.role,
          restaurantId: response.user.restaurantId,
          username: response.user.username
        };
        setUser(dummyUser);
        
        // Save to localStorage for persistence
        localStorage.setItem('restaurantUser', JSON.stringify(dummyUser));
        localStorage.setItem('loginTime', Date.now().toString());
        
        console.log('✅ Login successful:', dummyUser);
        return true;
      } else {
        throw new Error('Invalid credentials or empty token');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
    localStorage.removeItem('restaurantUser');
    localStorage.removeItem('loginTime');
    console.log('✅ Logged out successfully');
  };

  const fetchUserProfile = async () => {
    try {
      const profile = await authApi.getProfile();
      const updatedUser: User = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        restaurantId: profile.restaurantId,
        username: profile.username
      };
      setUser(updatedUser);
      localStorage.setItem('restaurantUser', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('fetchUserProfile error:', error);
    }
  };

  const updateUserProfile = async (profileData: { username: string; name: string; email: string; password?: string }): Promise<boolean> => {
    try {
      const profile = await authApi.updateProfile(profileData);
      const updatedUser: User = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        restaurantId: profile.restaurantId,
        username: profile.username
      };
      setUser(updatedUser);
      localStorage.setItem('restaurantUser', JSON.stringify(updatedUser));
      return true;
    } catch (error) {
      console.error('updateUserProfile error:', error);
      throw error;
    }
  };

  const isAuthenticated = !!user;

  const value = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated,
    fetchUserProfile,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
