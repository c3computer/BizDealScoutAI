import React, { createContext, useContext, useState, useEffect } from 'react';
import { InvestorProfile, User } from '../types';
import { auth, db, signInWithGoogle, logoutUser } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (profile: InvestorProfile) => Promise<void>;
  syncData: () => Promise<void>;
  isLoading: boolean;
  isSyncing: boolean;
  syncError: string | null;
  isGoogleReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          let profile: InvestorProfile | undefined = undefined;
          
          if (userDoc.exists()) {
            profile = userDoc.data().profile;
          } else {
            // Create user document
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              email: firebaseUser.email,
              name: firebaseUser.displayName || 'User',
              picture: firebaseUser.photoURL,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }

          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || 'User',
            picture: firebaseUser.photoURL || undefined,
            googleId: firebaseUser.uid,
            accessToken: 'firebase-active',
            profile
          });
        } catch (error: any) {
          console.error("Error fetching user profile", error);
          setSyncError(error.message);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      setSyncError(null);
      await signInWithGoogle();
    } catch (error: any) {
      console.error('Login error:', error);
      setSyncError(error.message);
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (error: any) {
      console.error('Logout error:', error);
    }
  };

  const updateUserProfile = async (profile: InvestorProfile) => {
    if (user) {
      setIsSyncing(true);
      try {
        await setDoc(doc(db, 'users', user.id), {
          profile,
          updatedAt: new Date()
        }, { merge: true });
        
        setUser({ ...user, profile });
        setSyncError(null);
      } catch (error: any) {
        console.error("Error updating profile", error);
        setSyncError(error.message);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const syncData = async () => {
    // No-op for Firebase as it's real-time, but keeping for compatibility
  };

  return (
    <AuthContext.Provider value={{ 
        user, 
        login, 
        logout, 
        updateUserProfile, 
        syncData,
        isLoading, 
        isSyncing,
        syncError,
        isGoogleReady: true
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};