import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import { getCurrentUser, signInWithEmail, signUpWithEmail, signOut as authSignOut } from '@/utils/firebase-auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/utils/firebase/config';

interface User {
  id: string; // Changed from number to string for Firebase UID
  name: string;
  email: string;
  clerkId: string | null;
  imageUrl: string | null;
  xp: number;
  coins: number;
  level: number;
  rank: string;
  nextLevelXp: number;
  nextLevelCoins: number;
  dailyStreak: number;
  lastCheckIn: Date | null;
  subscriptionStatus: 'free' | 'pro';
  bio: string;
  guild: string;
  createdAt: Date;
  passwordHash?: string;
  sessionToken?: string;
  lastBountyUpdate?: Date | null;
}

interface AuthContextType {
  user: User | null;
  isSignedIn: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialized = useRef(false);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isInitialized.current) {
        isInitialized.current = true;
      }
      if (firebaseUser) {
        // User is signed in, get the full user data
        await refreshUser();
      } else {
        // User is signed out
        setUser(null);
        setIsLoading(false);
      }
    });

    // Initial load
    refreshUser();

    return () => unsubscribe();
  }, [refreshUser]);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    setIsLoading(true);
    try {
      const { user: signedInUser, error } = await signInWithEmail(email, password);
      if (error) {
        setIsLoading(false);
        return { error };
      }
      setUser(signedInUser);
      setIsLoading(false);
      return { error: null };
    } catch (error: any) {
      setIsLoading(false);
      return { error: error.message || 'Failed to sign in' };
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<{ error: string | null }> => {
    setIsLoading(true);
    try {
      const { user: newUser, error } = await signUpWithEmail(email, password, name);
      if (error) {
        setIsLoading(false);
        return { error };
      }
      setUser(newUser);
      setIsLoading(false);
      return { error: null };
    } catch (error: any) {
      setIsLoading(false);
      return { error: error.message || 'Failed to create account' };
    }
  };

  const signOut = async () => {
    try {
      await authSignOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isSignedIn: !!user,
      isLoading,
      signIn,
      signUp,
      signOut,
      refreshUser,
    }}>
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
