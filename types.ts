export interface InvestorProfile {
  goals: string;
  mustHaves: string;
  superpowers: string;
  name?: string;
  entityName?: string;
}

export interface DealFile {
  name: string;
  mimeType: string;
  data?: string; // Base64 string (optional now, used for temporary upload)
  downloadUrl?: string; // URL from Firebase Storage
  storagePath?: string; // Path in Firebase Storage
  geminiFileUri?: string; // Cached URI from Gemini File API
  extractedText?: string; // Cached text extraction
  lastModified?: number; // Added: Timestamp of last modification
}

export interface LOITerms {
  purchasePrice: string;
  purchaseTerms: string;
  earnestMoney: string;
  dueDiligenceDays: string;
  closingDate: string;
  trainingPeriod: string;
  nonCompetePeriod: string;
}

export interface DealOpportunity {
  listingUrl: string;
  askingPrice: number;
  revenue: number;
  sde: number; // Seller Discretionary Earnings
  keywords: string;
  notes: string;
  growthContext: string; // New field for Socials, Ads, Growth ideas
  imageUrl?: string; // URL of the listing image
  files: DealFile[];
  hasFinancials?: boolean; // Indicates if files were uploaded for analysis
  callParticipants?: string;
  callSummary?: string;
}

export interface AnalysisResult {
  markdown: string;
  groundingUrls: Array<{ title: string; uri: string }>;
  score?: number; // Current/Final Score (0-100)
  initialScore?: number; // Stage 1 Score (before financials)
}

export interface CalculatedMetrics {
  multiple: number | null;
  margin: number | null;
  status: 'SUSPICIOUS' | 'MARKET' | 'PREMIUM' | 'UNKNOWN';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

// --- NEW TYPES FOR AUTH & CACHING ---
export type SubscriptionTier = 'SOLOPRENEUR' | 'FAMILY_OFFICE' | 'M_AND_A';

export interface Team {
  id: string;
  name: string;
  tier: SubscriptionTier;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  // If true, user got lifetime access via promo code
  lifetimeAccess?: boolean;
  memberIds: string[];
  ownerId: string;
  createdAt: number;
  updatedAt: number;
}

export interface AuditLog {
  id: string;
  teamId: string;
  userId: string;
  userName: string;
  action: 'LOGIN' | 'VIEW_DEAL' | 'CREATE_DEAL' | 'UPDATE_DEAL' | 'GENERATE_PITCH_DECK' | 'CREATE_LOI';
  dealId?: string;
  dealName?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string; // URL to avatar
  googleId?: string;
  accessToken?: string; // OAuth Access Token for Drive API
  profile?: InvestorProfile; // Persisted investor profile
  teamId?: string; // ID of the team they belong to
}

// Represents a global cache entry (shared knowledge base to save tokens)
export interface CachedDealEntry {
  id: string;
  url: string;
  dealData: Partial<DealOpportunity>; // Extracted metrics
  analysis: AnalysisResult;
  metrics: CalculatedMetrics;
  lastUpdated: number; // Timestamp
}

export type DealStatus = 'Lead' | 'Engaged' | 'Offer Made' | 'LOI Sent' | 'Due Diligence' | 'Accepted' | 'Rejected';

export interface LOITrackingData {
  id: string;
  dealId: string;
  userId: string;
  pdfUrl: string;
  sellerName: string;
  sentAt: number;
  opens: number;
  views: number;
  lastOpenedAt?: number;
  lastViewedAt?: number;
  followUp1Sent?: boolean;
  followUp3Sent?: boolean;
  followUp7Sent?: boolean;
}

export interface CrmData {
  status: DealStatus;
  financialsRequested: boolean;
  ndaSigned: boolean;
  pofSent: boolean;
  cimReceived: boolean;
  brokerCall: boolean;
  sellerCall: boolean;
  offerMade: boolean;
  loiSent: boolean;
  dueDiligence: boolean;
}

// Represents a user's specific saved reference
export interface SavedDealReference {
  id: string;
  userId: string;
  dealCacheId: string; // References the global cache
  savedAt: number;
  personalNotes?: string;
  crm?: CrmData;
}

export interface PopulatedSavedDeal extends SavedDealReference {
  cache: CachedDealEntry;
}

// Data structure for the JSON file stored in Drive
export interface DriveDataFile {
  lastModified: number;
  profile: InvestorProfile;
  savedDeals: SavedDealReference[];
  cache?: CachedDealEntry[]; // Synced cache entries for the saved deals
}

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}