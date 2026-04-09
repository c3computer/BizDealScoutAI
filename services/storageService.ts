import { User, CachedDealEntry, SavedDealReference, DealOpportunity, AnalysisResult, CalculatedMetrics, PopulatedSavedDeal, CrmData, DealFile, ChatMessage } from "../types";
import { db, storage } from '../firebase';
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';

// --- HELPERS ---
const generateId = () => Math.random().toString(36).substr(2, 9);
const normalizeUrl = (url: string) => url.trim().toLowerCase().replace(/\/$/, "");

// Helper to remove undefined values recursively as Firestore doesn't support them
const removeUndefined = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null;
  }
  if (obj instanceof Date) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  }
  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      if (obj[key] !== undefined) {
        newObj[key] = removeUndefined(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
};

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

// --- DATA SERVICE ---
export const dataService = {
  // Extra Data (Files and Chat Messages) via Firestore
  saveDealExtraData: async (userId: string, dealId: string, files: DealFile[], chatMessages: ChatMessage[]) => {
    try {
      // 0. Get existing files to find deletions
      const dealRef = doc(db, `users/${userId}/deals/${dealId}`);
      const dealSnap = await getDoc(dealRef);
      const existingFiles: DealFile[] = dealSnap.exists() ? (dealSnap.data().files || []) : [];
      
      // Find files that exist in DB but not in the new array
      const filesToDelete = existingFiles.filter(oldFile => 
        !files.some(newFile => newFile.name === oldFile.name)
      );

      // Delete removed files from Storage
      await Promise.all(filesToDelete.map(async (file) => {
        if (file.storagePath) {
          try {
            const storageRef = ref(storage, file.storagePath);
            await deleteObject(storageRef);
          } catch (err) {
            console.error(`Failed to delete file ${file.name} from storage`, err);
          }
        }
      }));

      // 1. Upload files to Firebase Storage if they have base64 data
      const updatedFiles = await Promise.all(files.map(async (file) => {
        if (file.data && !file.downloadUrl) {
          const storagePath = `users/${userId}/deals/${dealId}/files/${file.name}`;
          const storageRef = ref(storage, storagePath);
          
          // Upload base64 string
          const base64Data = file.data.split(',')[1] || file.data;
          await uploadString(storageRef, base64Data, 'base64', { contentType: file.mimeType });
          
          const downloadUrl = await getDownloadURL(storageRef);
          
          const { data, ...fileWithoutData } = file;
          return {
            ...fileWithoutData,
            storagePath,
            downloadUrl
          };
        }
        return file;
      }));

      // 2. Save chat messages to Firestore subcollection
      const chatsRef = collection(db, `users/${userId}/deals/${dealId}/chats`);
      
      // Delete existing chats to replace them (simple approach)
      const existingChats = await getDocs(chatsRef);
      await Promise.all(existingChats.docs.map(d => deleteDoc(d.ref)));

      // Add new chats
      await Promise.all(chatMessages.map(async (chat) => {
        const chatDocRef = doc(chatsRef);
        await setDoc(chatDocRef, {
          userId,
          dealId,
          role: chat.role,
          text: chat.text,
          timestamp: new Date(chat.timestamp)
        });
      }));

      // 3. Update deal with files metadata
      await setDoc(dealRef, { files: updatedFiles }, { merge: true });

      return updatedFiles;
    } catch (e) {
      console.error("Failed to save extra data to Firestore/Storage", e);
      return files;
    }
  },

  getDealExtraData: async (userId: string, dealId: string): Promise<{ files: DealFile[], chatMessages: ChatMessage[] } | undefined> => {
    try {
      // 1. Get files from deal document
      const dealRef = doc(db, `users/${userId}/deals/${dealId}`);
      const dealSnap = await getDoc(dealRef);
      const files = dealSnap.exists() ? (dealSnap.data().files || []) : [];

      // 2. Get chats from subcollection
      const chatsRef = collection(db, `users/${userId}/deals/${dealId}/chats`);
      const q = query(chatsRef, orderBy('timestamp', 'asc'));
      const chatsSnap = await getDocs(q);
      
      const chatMessages: ChatMessage[] = chatsSnap.docs.map(doc => {
        const data = doc.data();
        return {
          role: data.role as 'user' | 'model',
          text: data.text,
          timestamp: data.timestamp.toMillis()
        };
      });

      return { files, chatMessages };
    } catch (e) {
      console.error("Failed to get extra data from Firestore", e);
      return undefined;
    }
  },

  // 1. Check Global Cache (Save AI Tokens)
  // We'll keep this local for anonymous users, but for logged-in users, we'll check their saved deals.
  checkCache: (url: string): CachedDealEntry | null => {
    if (!url) return null;
    const cacheRaw = localStorage.getItem('ds_global_cache');
    const cache: CachedDealEntry[] = cacheRaw ? JSON.parse(cacheRaw) : [];
    
    const normalized = normalizeUrl(url);
    const found = cache.find(c => normalizeUrl(c.url) === normalized);
    
    if (found) {
      console.log(`💰 CACHE HIT: Found existing analysis for ${url}`);
      return found;
    }
    return null;
  },

  clearCache: (url: string): void => {
    if (!url) return;
    try {
      const cacheRaw = localStorage.getItem('ds_global_cache');
      if (!cacheRaw) return;
      
      const cache: CachedDealEntry[] = JSON.parse(cacheRaw);
      const normalized = normalizeUrl(url);
      const filtered = cache.filter(c => normalizeUrl(c.url) !== normalized);
      
      localStorage.setItem('ds_global_cache', JSON.stringify(filtered));
      console.log(`🗑️ CACHE CLEARED: Removed analysis for ${url}`);
    } catch (e) {
      console.warn("Could not clear cache", e);
    }
  },

  // 2. Save Analysis to Global Cache (Local fallback)
  saveToGlobalCache: (
    url: string, 
    dealData: Partial<DealOpportunity>, 
    analysis: AnalysisResult,
    metrics: CalculatedMetrics,
    cacheId?: string
  ): CachedDealEntry => {
    const { files, ...cleanDealData } = dealData;
    
    if (files && files.length > 0) {
      cleanDealData.hasFinancials = true;
    }

    let cacheRaw: string | null = null;
    try {
        cacheRaw = localStorage.getItem('ds_global_cache');
    } catch (e) {
        console.warn("Could not read cache", e);
    }

    let cache: CachedDealEntry[] = cacheRaw ? JSON.parse(cacheRaw) : [];
    
    cache = cache.map(entry => {
        if (entry.dealData && (entry.dealData as any).files) {
             const { files: oldFiles, ...rest } = entry.dealData as any;
             return { ...entry, dealData: rest };
        }
        return entry;
    });

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
      dealData: cleanDealData,
      analysis,
      metrics,
      lastUpdated: Date.now()
    };

    if (existingIndex > -1) {
      cache[existingIndex] = entry;
    } else {
      cache.push(entry);
    }

    try {
      localStorage.setItem('ds_global_cache', JSON.stringify(cache));
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
         cache.sort((a, b) => b.lastUpdated - a.lastUpdated);
         const keepCount = Math.min(10, Math.floor(cache.length / 2));
         const pruned = cache.slice(0, keepCount);
         if (!pruned.find(c => c.id === entry.id)) pruned.unshift(entry);
         try {
            localStorage.setItem('ds_global_cache', JSON.stringify(pruned));
         } catch (retryErr) {
            console.error("Unable to save to cache even after pruning.", retryErr);
         }
      }
    }
    return entry;
  },

  // 3. User Save Deal (Firestore)
  saveUserDeal: async (userId: string, cacheId: string, personalNotes?: string, crm?: CrmData, dealData?: Partial<DealOpportunity>, analysis?: AnalysisResult, metrics?: CalculatedMetrics) => {
    try {
      // If we don't have the data passed in, try to get it from local cache
      let finalDealData = dealData;
      let finalAnalysis = analysis;
      let finalMetrics = metrics;
      let url = dealData?.listingUrl || '';

      if (!finalDealData || !finalAnalysis || !finalMetrics) {
        const cacheRaw = localStorage.getItem('ds_global_cache');
        const cache: CachedDealEntry[] = cacheRaw ? JSON.parse(cacheRaw) : [];
        const cacheEntry = cache.find(c => c.id === cacheId);
        if (cacheEntry) {
          finalDealData = cacheEntry.dealData;
          finalAnalysis = cacheEntry.analysis;
          finalMetrics = cacheEntry.metrics;
          url = cacheEntry.url;
        }
      }

      if (!finalDealData || !finalAnalysis || !finalMetrics) {
        throw new Error("Missing deal data to save");
      }

      // Strip files from dealData to prevent exceeding Firestore 1MB limit
      // Files are handled separately by saveDealExtraData
      const { files, ...cleanDealData } = finalDealData;

      const dealRef = doc(db, `users/${userId}/deals/${cacheId}`);
      
      const dealPayload = removeUndefined({
        userId,
        url,
        dealData: cleanDealData,
        analysis: finalAnalysis,
        metrics: finalMetrics,
        crm: crm || defaultCrm(),
        personalNotes: personalNotes || '',
        savedAt: new Date(),
        updatedAt: new Date()
      });

      await setDoc(dealRef, dealPayload, { merge: true });

      return {
        id: cacheId,
        userId,
        dealCacheId: cacheId,
        savedAt: Date.now(),
        personalNotes,
        crm: crm || defaultCrm()
      } as SavedDealReference;

    } catch (e) {
      console.error("Error saving deal to Firestore", e);
      throw e;
    }
  },

  // 4. Get User's History (Firestore)
  getUserDeals: async (userId: string): Promise<PopulatedSavedDeal[]> => {
    try {
      const dealsRef = collection(db, `users/${userId}/deals`);
      const q = query(dealsRef, orderBy('savedAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const deals: PopulatedSavedDeal[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          dealCacheId: doc.id,
          savedAt: data.savedAt?.toMillis() || Date.now(),
          personalNotes: data.personalNotes,
          crm: data.crm,
          cache: {
            id: doc.id,
            url: data.url,
            dealData: data.dealData,
            analysis: data.analysis,
            metrics: data.metrics,
            lastUpdated: data.updatedAt?.toMillis() || Date.now()
          }
        };
      });

      // Sort by Score (High to Low)
      return deals.sort((a, b) => {
        const scoreA = a.cache.analysis.score || 0;
        const scoreB = b.cache.analysis.score || 0;
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
        return b.savedAt - a.savedAt;
      });
    } catch (e) {
      console.error("Error fetching user deals from Firestore", e);
      return [];
    }
  },

  // 4.5 Sync All Deals to Admin Backend
  syncAllDealsToAdmin: async (userId: string) => {
    // This could be kept if there's a separate admin backend, but for now we'll just log it
    console.log("Syncing deals to admin backend is disabled as we use Firestore now.");
  },

  // 5. Get Cache Entries for Sync
  getCacheEntries: (ids: string[]): CachedDealEntry[] => {
    const cacheRaw = localStorage.getItem('ds_global_cache');
    const cache: CachedDealEntry[] = cacheRaw ? JSON.parse(cacheRaw) : [];
    return cache.filter(c => ids.includes(c.id));
  },

  // 6. Merge Synced Cache
  mergeCache: (syncedCache: CachedDealEntry[]) => {
    const cacheRaw = localStorage.getItem('ds_global_cache');
    const localCache: CachedDealEntry[] = cacheRaw ? JSON.parse(cacheRaw) : [];
    
    let changed = false;
    syncedCache.forEach(synced => {
        const existingIdx = localCache.findIndex(c => c.id === synced.id);
        if (existingIdx === -1) {
            localCache.push(synced);
            changed = true;
        } else {
            if (synced.lastUpdated > localCache[existingIdx].lastUpdated) {
                localCache[existingIdx] = synced;
                changed = true;
            }
        }
    });

    if (changed) {
        localStorage.setItem('ds_global_cache', JSON.stringify(localCache));
    }
  }
};
