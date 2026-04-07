import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DriveDataFile, InvestorProfile, User } from '../types';
import { authService, dataService } from '../services/storageService';
import { googleDriveService } from '../services/googleDriveService';

interface AuthContextType {
  user: User | null;
  login: () => void; // Trigger Google Auth
  logout: () => void;
  updateUserProfile: (profile: InvestorProfile) => Promise<void>;
  syncData: () => Promise<void>; // Manually trigger sync
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
  const [isGoogleReady, setIsGoogleReady] = useState(false);

  // 1. Initialize Local Auth State & Check Google Script
  useEffect(() => {
    const initAuth = () => {
      const savedUser = authService.getCurrentUser();
      if (savedUser) {
        setUser(savedUser);
        dataService.syncAllDealsToAdmin(savedUser.id);
      }
      setIsLoading(false);
    };
    initAuth();

    // Check if Google Identity Services script is loaded
    const checkGoogle = setInterval(() => {
      if (window.google && window.google.accounts && window.google.accounts.oauth2) {
        setIsGoogleReady(true);
        clearInterval(checkGoogle);
      }
    }, 100);

    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkGoogle);
      if (!window.google || !window.google.accounts) {
        console.warn("Google Identity Services script failed to load.");
      }
    }, 10000);

    return () => clearInterval(checkGoogle);
  }, []);

  // 2. Define Token Callback (Memoized)
  const handleTokenResponse = useCallback(async (tokens: any) => {
    if (tokens.error) {
      console.error("Google Auth Error:", tokens);
      setSyncError(`Auth Error: ${tokens.error}`);
      return;
    }
    
    const accessToken = tokens.access_token;
    
    try {
      setIsLoading(true);
      // Fetch User Profile Info from Google
      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (!userInfoRes.ok) throw new Error("Failed to fetch user profile");
      
      const userInfo = await userInfoRes.json();

      const newUser: User = {
        id: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        googleId: userInfo.sub,
        accessToken: accessToken,
        profile: undefined // Will load from drive
      };

      // Update Local Storage
      localStorage.setItem('ds_current_user', JSON.stringify(newUser));
      setUser(newUser);
      
      // Trigger Drive Sync (Load)
      await loadFromDrive(newUser);

    } catch (err: any) {
      console.error("Failed to process login", err);
      setSyncError(`Login failed during profile fetch: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 3. (Removed: GIS handles popup and callback directly)

  const loadFromDrive = async (currentUser: User) => {
    if (!currentUser.accessToken) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      const fileId = await googleDriveService.findFile(currentUser.accessToken);
      
      if (fileId) {
        const cloudData = await googleDriveService.readFile(currentUser.accessToken, fileId);
        console.log("Cloud Data Loaded:", cloudData);

        // Merge Profile
        if (cloudData.profile) {
          const updatedUser = { ...currentUser, profile: cloudData.profile };
          authService.updateUserProfile(currentUser.id, cloudData.profile);
          setUser(updatedUser);
        }

        // Merge Deals (Simple Union based on ID)
        if (cloudData.savedDeals && cloudData.savedDeals.length > 0) {
           const savesRaw = localStorage.getItem('ds_user_saves');
           const localSaves: any[] = savesRaw ? JSON.parse(savesRaw) : [];
           
           const newSaves = [...localSaves];
           cloudData.savedDeals.forEach(cloudSave => {
               if (!newSaves.find(ls => ls.id === cloudSave.id)) {
                   newSaves.push(cloudSave);
               }
           });
           
           localStorage.setItem('ds_user_saves', JSON.stringify(newSaves));
        }

        // Merge Cache
        if (cloudData.cache && cloudData.cache.length > 0) {
            dataService.mergeCache(cloudData.cache);
        }
        
        // Sync all loaded deals to the Admin Dashboard backend
        dataService.syncAllDealsToAdmin(currentUser.id);
      } else {
        console.log("No existing data file found. Waiting for first save.");
      }
    } catch (err: any) {
      console.error("Sync Load Error:", err);
      if (err.message && err.message.includes('Drive API is not enabled')) {
          setSyncError("Google Drive API is not enabled in your Google Cloud Console.");
      } else if (err.message && err.message.includes('Insufficient permissions')) {
          setSyncError("Permission denied. Please log out, log back in, and check the box to grant Google Drive access.");
      } else if (err.message && (err.message.includes('401') || err.message.includes('403'))) {
          setSyncError("Session Expired: Please login again.");
          // We do not logout automatically to preserve local work, but we mark sync as failed
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const saveToDrive = async (currentUser: User) => {
    if (!currentUser.accessToken) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      const savesRaw = localStorage.getItem('ds_user_saves');
      const savedDeals = savesRaw ? JSON.parse(savesRaw).filter((s: any) => s.userId === currentUser.id) : [];
      
      const cacheIds = savedDeals.map((s: any) => s.dealCacheId);
      const cacheEntries = dataService.getCacheEntries(cacheIds);

      const payload: DriveDataFile = {
        lastModified: Date.now(),
        profile: currentUser.profile || { goals: '', mustHaves: '', superpowers: '' },
        savedDeals: savedDeals,
        cache: cacheEntries
      };

      let fileId = await googleDriveService.findFile(currentUser.accessToken);
      
      if (!fileId) {
        fileId = await googleDriveService.createFile(currentUser.accessToken, payload);
      } else {
        await googleDriveService.updateFile(currentUser.accessToken, fileId, payload);
      }
      
      console.log("Data synced to Drive successfully.");
    } catch (err: any) {
      console.error("Sync Save Error:", err);
      if (err.message && err.message.includes('Drive API is not enabled')) {
         setSyncError("Google Drive API is not enabled in your Google Cloud Console.");
      } else if (err.message && err.message.includes('Insufficient permissions')) {
         setSyncError("Permission denied. Please log out, log back in, and check the box to grant Google Drive access.");
      } else if (err.message && (err.message.includes('401') || err.message.includes('403'))) {
         setSyncError("Session Expired: Please login again to save.");
      } else {
         setSyncError("Failed to save to Cloud.");
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const login = async () => {
    try {
      // 1. Check if GIS is loaded
      if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
        setSyncError('Google Identity Services script not loaded. Please refresh the page.');
        return;
      }

      // 2. Get Client ID from environment variables
      // We check VITE_GOOGLE_CLIENT_ID first (for Netlify), then fallback to process.env
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || (typeof process !== 'undefined' && process.env ? process.env.GOOGLE_CLIENT_ID : null);
      
      if (!clientId) {
        setSyncError('Configuration Missing: Please set VITE_GOOGLE_CLIENT_ID in your Netlify Environment Variables.');
        return;
      }

      setSyncError(null);
      
      // 3. Initialize the Token Client
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets email profile openid',
        callback: (response: any) => {
          if (response.error) {
            console.error('GIS Auth Error:', response);
            setSyncError(`Sign-in failed: ${response.error_description || response.error}`);
            setIsSyncing(false);
            return;
          }
          // GIS returns access_token directly!
          handleTokenResponse(response);
        },
      });

      // 4. Request the token (opens popup)
      client.requestAccessToken();

    } catch (error) {
      console.error('OAuth error:', error);
      setSyncError('Failed to initialize Google Sign-In.');
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateUserProfile = async (profile: InvestorProfile) => {
    if (user) {
        authService.updateUserProfile(user.id, profile);
        const updatedUser = { ...user, profile };
        setUser(updatedUser);
        
        if (user.accessToken) {
            await saveToDrive(updatedUser);
        }
    }
  };

  const syncData = async () => {
      if (user && user.accessToken) {
          await saveToDrive(user);
      }
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
        isGoogleReady
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