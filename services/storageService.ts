import { get, set } from 'idb-keyval';
import { User, CachedDealEntry, SavedDealReference, DealOpportunity, AnalysisResult, CalculatedMetrics, PopulatedSavedDeal, InvestorProfile, CrmData, DealFile, ChatMessage } from "../types";

// KEYS
const USERS_KEY = 'ds_users';
const GLOBAL_CACHE_KEY = 'ds_global_cache';
const USER_SAVES_KEY = 'ds_user_saves';
const CURRENT_USER_KEY = 'ds_current_user';

// --- HELPERS ---
const generateId = () => Math.random().toString(36).substr(2, 9);
const normalizeUrl = (url: string) => url.trim().toLowerCase().replace(/\/$/, "");

export const defaultCrm = (): CrmData => ({
  status: 'Lead',
  financialsRequested: false,
  ndaSigned: false,
  pofSent: false,
  cimReceived: false,
  brokerCall: false,
  sellerCall: false,
  offerMade: false,
  loiSent: false,
  dueDiligence: false,
});

// --- AUTH SERVICE ---
export const authService = {
  login: async (email: string): Promise<User> => {
    // Simulating API delay
    await new Promise(r => setTimeout(r, 500));
    
    const usersRaw = localStorage.getItem(USERS_KEY);
    const users: User[] = usersRaw ? JSON.parse(usersRaw) : [];
    
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      // Auto-register for demo purposes if not found
      user = {
        id: generateId(),
        email: email,
        name: email.split('@')[0],
      };
      users.push(user);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
    
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user;
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  getCurrentUser: (): User | null => {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  updateUserProfile: (userId: string, profile: InvestorProfile) => {
    const usersRaw = localStorage.getItem(USERS_KEY);
    const users: User[] = usersRaw ? JSON.parse(usersRaw) : [];
    
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      users[idx].profile = profile;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      
      // Update session if active and matches user
      const currentRaw = localStorage.getItem(CURRENT_USER_KEY);
      if (currentRaw) {
        const current = JSON.parse(currentRaw);
        if (current.id === userId) {
          current.profile = profile;
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(current));
        }
      }
    }
  }
};

// --- DATA SERVICE ---
export const dataService = {
  // Extra Data (Files and Chat Messages) via IndexedDB
  saveDealExtraData: async (cacheId: string, files: DealFile[], chatMessages: ChatMessage[]) => {
    try {
      await set(`deal_extra_${cacheId}`, { files, chatMessages });
    } catch (e) {
      console.error("Failed to save extra data to IndexedDB", e);
    }
  },

  getDealExtraData: async (cacheId: string): Promise<{ files: DealFile[], chatMessages: ChatMessage[] } | undefined> => {
    try {
      return await get(`deal_extra_${cacheId}`);
    } catch (e) {
      console.error("Failed to get extra data from IndexedDB", e);
      return undefined;
    }
  },

  // 1. Check Global Cache (Save AI Tokens)
  checkCache: (url: string): CachedDealEntry | null => {
    if (!url) return null;
    const cacheRaw = localStorage.getItem(GLOBAL_CACHE_KEY);
    const cache: CachedDealEntry[] = cacheRaw ? JSON.parse(cacheRaw) : [];
    
    const normalized = normalizeUrl(url);
    const found = cache.find(c => normalizeUrl(c.url) === normalized);
    
    if (found) {
      console.log(`💰 CACHE HIT: Found existing analysis for ${url}`);
      return found;
    }
    return null;
  },

  // Clear specific cache entry
  clearCache: (url: string): void => {
    if (!url) return;
    try {
      const cacheRaw = localStorage.getItem(GLOBAL_CACHE_KEY);
      if (!cacheRaw) return;
      
      const cache: CachedDealEntry[] = JSON.parse(cacheRaw);
      const normalized = normalizeUrl(url);
      const filtered = cache.filter(c => normalizeUrl(c.url) !== normalized);
      
      localStorage.setItem(GLOBAL_CACHE_KEY, JSON.stringify(filtered));
      console.log(`🗑️ CACHE CLEARED: Removed analysis for ${url}`);
    } catch (e) {
      console.warn("Could not clear cache", e);
    }
  },

  // 2. Save Analysis to Global Cache
  saveToGlobalCache: (
    url: string, 
    dealData: Partial<DealOpportunity>, 
    analysis: AnalysisResult,
    metrics: CalculatedMetrics,
    cacheId?: string
  ): CachedDealEntry => {
    // CRITICAL: Remove files (Base64) before saving to prevent LocalStorage Quota Exceeded
    // We explicitly destructure to ensure 'files' is excluded from the saved object
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { files, ...cleanDealData } = dealData;
    
    // Set a flag so we know financials were uploaded even after files are stripped
    if (files && files.length > 0) {
      cleanDealData.hasFinancials = true;
    }

    let cacheRaw: string | null = null;
    try {
        cacheRaw = localStorage.getItem(GLOBAL_CACHE_KEY);
    } catch (e) {
        console.warn("Could not read cache", e);
    }

    let cache: CachedDealEntry[] = cacheRaw ? JSON.parse(cacheRaw) : [];
    
    // RETROACTIVE CLEANUP:
    // Iterate through existing cache to strip any 'files' that might have been saved 
    // in previous versions of the app. This recovers space.
    cache = cache.map(entry => {
        if (entry.dealData && (entry.dealData as any).files) {
             // eslint-disable-next-line @typescript-eslint/no-unused-vars
             const { files: oldFiles, ...rest } = entry.dealData as any;
             return { ...entry, dealData: rest };
        }
        return entry;
    });

    // Check if update or new
    const normalized = normalizeUrl(url);
    let existingIndex = -1;
    
    if (cacheId) {
      existingIndex = cache.findIndex(c => c.id === cacheId);
    } else {
      existingIndex = cache.findIndex(c => normalizeUrl(c.url) === normalized);
    }
    
    const entry: CachedDealEntry = {
      id: existingIndex > -1 ? cache[existingIndex].id : (cacheId || generateId()),
      url: existingIndex > -1 ? cache[existingIndex].url : url,
      dealData: cleanDealData, // Use sanitized data without files
      analysis,
      metrics,
      lastUpdated: Date.now()
    };

    if (existingIndex > -1) {
      cache[existingIndex] = entry;
    } else {
      cache.push(entry);
    }

    // Robust Save with Pruning
    try {
      localStorage.setItem(GLOBAL_CACHE_KEY, JSON.stringify(cache));
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
         console.warn("Storage quota exceeded. Pruning old cache entries...");
         
         // Sort by date desc (newest first)
         cache.sort((a, b) => b.lastUpdated - a.lastUpdated);
         
         // Pruning Strategy: Aggressively cut to the newest 10 items or 50%, whichever is smaller
         const keepCount = Math.min(10, Math.floor(cache.length / 2));
         const pruned = cache.slice(0, keepCount);
         
         // Ensure our current entry is preserved
         if (!pruned.find(c => c.id === entry.id)) {
            pruned.unshift(entry);
         }

         try {
            localStorage.setItem(GLOBAL_CACHE_KEY, JSON.stringify(pruned));
            console.log("Cache pruned successfully.");
         } catch (retryErr) {
            console.error("Unable to save to cache even after pruning. Storage is extremely full.", retryErr);
         }
      } else {
        console.error("LocalStorage error:", e);
      }
    }
    return entry;
  },

  // 3. User Save Deal (Link to Cache)
  saveUserDeal: (userId: string, cacheId: string, personalNotes?: string, crm?: CrmData) => {
    const savesRaw = localStorage.getItem(USER_SAVES_KEY);
    const saves: SavedDealReference[] = savesRaw ? JSON.parse(savesRaw) : [];

    // Check if already saved
    const exists = saves.find(s => s.userId === userId && s.dealCacheId === cacheId);
    let savedDeal = exists;
    if (exists) {
      // Update
      exists.savedAt = Date.now();
      if (personalNotes !== undefined) exists.personalNotes = personalNotes;
      if (crm !== undefined) exists.crm = crm;
      localStorage.setItem(USER_SAVES_KEY, JSON.stringify(saves));
    } else {
      const newSave: SavedDealReference = {
        id: generateId(),
        userId,
        dealCacheId: cacheId,
        savedAt: Date.now(),
        personalNotes,
        crm: crm || defaultCrm()
      };
      saves.push(newSave);
      localStorage.setItem(USER_SAVES_KEY, JSON.stringify(saves));
      savedDeal = newSave;
    }

    // Also send to admin backend
    try {
      const cacheRaw = localStorage.getItem(GLOBAL_CACHE_KEY);
      const cache: CachedDealEntry[] = cacheRaw ? JSON.parse(cacheRaw) : [];
      const cacheEntry = cache.find(c => c.id === cacheId);
      
      const currentRaw = localStorage.getItem(CURRENT_USER_KEY);
      const currentUser = currentRaw ? JSON.parse(currentRaw) : null;
      
      let userEmail = '';
      if (currentUser && currentUser.id === userId) {
        userEmail = currentUser.email;
      } else {
        const usersRaw = localStorage.getItem(USERS_KEY);
        const users: User[] = usersRaw ? JSON.parse(usersRaw) : [];
        const user = users.find(u => u.id === userId);
        if (user) userEmail = user.email;
      }

      if (cacheEntry && userEmail) {
        fetch('/api/deals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: cacheEntry.url,
            userEmail: userEmail,
            score: cacheEntry.analysis.score || 0,
            askingPrice: cacheEntry.dealData.askingPrice || 0,
            revenue: cacheEntry.dealData.revenue || 0,
            sde: cacheEntry.dealData.sde || 0,
            multiple: cacheEntry.metrics.multiple || 0,
            keywords: cacheEntry.dealData.keywords || '',
            crm: savedDeal?.crm
          })
        }).catch(e => console.error("Failed to sync to admin backend", e));
      }
    } catch (e) {
      console.error("Error sending to admin backend", e);
    }

    return savedDeal!;
  },

  // 4. Get User's History (Sorted by SCORE then DATE)
  getUserDeals: (userId: string): PopulatedSavedDeal[] => {
    const savesRaw = localStorage.getItem(USER_SAVES_KEY);
    const saves: SavedDealReference[] = savesRaw ? JSON.parse(savesRaw) : [];
    
    const cacheRaw = localStorage.getItem(GLOBAL_CACHE_KEY);
    const cache: CachedDealEntry[] = cacheRaw ? JSON.parse(cacheRaw) : [];

    const userSaves = saves.filter(s => s.userId === userId);

    // Join with cache data
    return userSaves
      .map(save => {
        const cacheEntry = cache.find(c => c.id === save.dealCacheId);
        if (!cacheEntry) return null;
        return {
          ...save,
          cache: cacheEntry
        };
      })
      .filter((item): item is PopulatedSavedDeal => item !== null)
      .sort((a, b) => {
        // Sort by Score (High to Low)
        const scoreA = a.cache.analysis.score || 0;
        const scoreB = b.cache.analysis.score || 0;
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
        // Then by Date (Newest first)
        return b.savedAt - a.savedAt;
      });
  },

  // 4.5 Sync All Deals to Admin Backend
  syncAllDealsToAdmin: (userId: string) => {
    try {
      const currentRaw = localStorage.getItem(CURRENT_USER_KEY);
      const currentUser = currentRaw ? JSON.parse(currentRaw) : null;
      
      let userEmail = '';
      if (currentUser && currentUser.id === userId) {
        userEmail = currentUser.email;
      } else {
        const usersRaw = localStorage.getItem(USERS_KEY);
        const users: User[] = usersRaw ? JSON.parse(usersRaw) : [];
        const user = users.find(u => u.id === userId);
        if (user) userEmail = user.email;
      }
      
      if (!userEmail) return;

      const deals = dataService.getUserDeals(userId);
      
      deals.forEach(deal => {
        fetch('/api/deals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: deal.cache.url,
            userEmail: userEmail,
            score: deal.cache.analysis.score || 0,
            askingPrice: deal.cache.dealData.askingPrice || 0,
            revenue: deal.cache.dealData.revenue || 0,
            sde: deal.cache.dealData.sde || 0,
            multiple: deal.cache.metrics.multiple || 0,
            keywords: deal.cache.dealData.keywords || '',
            crm: deal.crm
          })
        }).catch(e => console.error("Failed to sync deal to admin backend", e));
      });
    } catch (e) {
      console.error("Error syncing all deals to admin backend", e);
    }
  },

  // 5. Get Cache Entries for Sync
  getCacheEntries: (ids: string[]): CachedDealEntry[] => {
    const cacheRaw = localStorage.getItem(GLOBAL_CACHE_KEY);
    const cache: CachedDealEntry[] = cacheRaw ? JSON.parse(cacheRaw) : [];
    return cache.filter(c => ids.includes(c.id));
  },

  // 6. Merge Synced Cache
  mergeCache: (syncedCache: CachedDealEntry[]) => {
    const cacheRaw = localStorage.getItem(GLOBAL_CACHE_KEY);
    const localCache: CachedDealEntry[] = cacheRaw ? JSON.parse(cacheRaw) : [];
    
    let changed = false;
    syncedCache.forEach(synced => {
        const existingIdx = localCache.findIndex(c => c.id === synced.id);
        if (existingIdx === -1) {
            localCache.push(synced);
            changed = true;
        } else {
            // Update if newer
            if (synced.lastUpdated > localCache[existingIdx].lastUpdated) {
                localCache[existingIdx] = synced;
                changed = true;
            }
        }
    });

    if (changed) {
        localStorage.setItem(GLOBAL_CACHE_KEY, JSON.stringify(localCache));
    }
  }
};