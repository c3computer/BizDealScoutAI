import React, { createContext, useContext, useState, useEffect } from 'react';
import { InvestorProfile, User } from '../types';
import { auth, db, signInWithGoogle, logoutUser } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

import { Team } from '../types';

interface AuthContextType {
  user: User | null;
  team: Team | null;
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
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    let teamUnsubscribe: (() => void) | undefined;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      if (firebaseUser) {
        try {
          // Cleanup existing team listener if any
          if (teamUnsubscribe) {
            teamUnsubscribe();
            teamUnsubscribe = undefined;
          }

          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          let profile: InvestorProfile | undefined = undefined;
          let teamId: string | undefined = undefined;
          
          if (userDoc.exists()) {
            profile = userDoc.data().profile;
            teamId = userDoc.data().teamId;
          }

          if (!userDoc.exists() || !teamId) {
            // Auto-create a Solo team for the user if they don't have one
            teamId = firebaseUser.uid; // Use their UID as their personal team ID
            
            // Create user document
            const userData: any = {
              email: firebaseUser.email || 'no-email@example.com',
              name: firebaseUser.displayName || 'User',
              teamId,
              updatedAt: serverTimestamp()
            };
            
            if (firebaseUser.photoURL) {
              userData.picture = firebaseUser.photoURL;
            }
            
            if (!userDoc.exists()) {
              userData.createdAt = serverTimestamp();
            }

            await setDoc(doc(db, 'users', firebaseUser.uid), userData, { merge: true });

            // Create team document
            const teamData: any = {
              name: `${firebaseUser.displayName || 'User'}'s Team`,
              tier: 'SOLOPRENEUR',
              memberIds: [firebaseUser.uid],
              ownerId: firebaseUser.uid,
              updatedAt: serverTimestamp()
            };
            
            if (!userDoc.exists()) {
              teamData.createdAt = serverTimestamp();
            }

            await setDoc(doc(db, 'teams', teamId), teamData, { merge: true });
          }

          // Subscribe to the team document for realtime updates (like subscription fulfillment)
          const { onSnapshot } = await import('firebase/firestore');
          teamUnsubscribe = onSnapshot(doc(db, 'teams', teamId!), (docSnap) => {
            if (docSnap.exists()) {
              setTeam({ id: docSnap.id, ...docSnap.data() } as Team);
            }
          });

          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || 'User',
            picture: firebaseUser.photoURL || undefined,
            googleId: firebaseUser.uid,
            accessToken: 'firebase-active',
            teamId,
            profile
          });

          // Log Login action (delayed slightly to ensure user doc replication in rules evaluation)
          const { auditService } = await import('../services/auditService');
          setTimeout(() => {
            if (teamId) {
              auditService.logAction(teamId, 'LOGIN', undefined, undefined, { email: firebaseUser.email });
            }
          }, 2000);
          
        } catch (error: any) {
          console.error("Error fetching user profile", error);
          setSyncError(error.message);
        }
      } else {
        if (teamUnsubscribe) {
          teamUnsubscribe();
          teamUnsubscribe = undefined;
        }
        setUser(null);
        setTeam(null);
      }
      setIsLoading(false);
    });

    return () => {
      if (teamUnsubscribe) teamUnsubscribe();
      unsubscribe();
    };
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
          updatedAt: serverTimestamp()
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
        team,
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