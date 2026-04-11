import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from './contexts/AuthContext';
import { extractDealMetrics, analyzeDeal, generateGrowthStrategy, queryDealChat, generateChatPresentation } from './services/geminiService';
import { AuthModal } from './components/AuthModal';
import { ChatPresentationModal } from './components/ChatPresentationModal';
import { CreateLOIBox } from './components/CreateLOIBox';
import { CapitalRaisingBox } from './components/CapitalRaisingBox';
import { EmailModal } from './components/EmailModal';
import { dataService, defaultCrm } from './services/storageService';
import { 
  DealOpportunity, 
  AnalysisResult, 
  InvestorProfile, 
  PopulatedSavedDeal, 
  DealFile,
  CalculatedMetrics,
  ChatMessage,
  CrmData,
  LOITerms
} from './types';
import { Input } from './components/Input';
import { TextArea } from './components/TextArea';
import { ResultViewer } from './components/ResultViewer';
import { FileUploader } from './components/FileUploader';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { DashboardSidebar } from './components/DashboardSidebar';
import { CrmTracker } from './components/CrmTracker';
import { PlaybookGenerator } from './components/PlaybookGenerator';
import { OnboardingDeck } from './components/OnboardingDeck';
import { LOIViewer } from './components/LOIViewer';

const App: React.FC = () => {
  const { user, logout, updateUserProfile, syncData, isSyncing, syncError } = useAuth();
  
  const [deal, setDeal] = useState<DealOpportunity>({
    listingUrl: '',
    askingPrice: 0,
    revenue: 0,
    sde: 0,
    keywords: '',
    notes: '',
    growthContext: '',
    imageUrl: '',
    files: [],
    hasFinancials: false
  });

  const [profile, setProfile] = useState<InvestorProfile>({
    goals: '',
    mustHaves: '',
    superpowers: ''
  });

  const [crm, setCrm] = useState<CrmData>(defaultCrm());

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [growthResult, setGrowthResult] = useState<AnalysisResult | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [summarizingCall, setSummarizingCall] = useState(false);
  const [importing, setImporting] = useState(false);
  const [growthLoading, setGrowthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  
  const [currentCacheId, setCurrentCacheId] = useState<string | null>(null);
  
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [playbookModalOpen, setPlaybookModalOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true); // Assume true initially to avoid flicker

  // Check for LOI Viewer Route
  const urlParams = new URLSearchParams(window.location.search);
  const loiIdParam = urlParams.get('loi');
  
  if (loiIdParam) {
    return <LOIViewer loiId={loiIdParam} />;
  }

  // Check for API Key
  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    };
    checkApiKey();
  }, []);

  const handleSelectApiKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      await window.aistudio.openSelectKey();
      // Assume success to mitigate race conditions
      setHasApiKey(true);
    }
  };

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatPresentationLoading, setChatPresentationLoading] = useState(false);
  const [chatPresentationModalOpen, setChatPresentationModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [chatPresentationResult, setChatPresentationResult] = useState<AnalysisResult | null>(null);
  const [loiTerms, setLoiTerms] = useState<LOITerms | null>(null);
  const [isExtractingTerms, setIsExtractingTerms] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  
  // Profile File Input Ref
  const profileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, chatLoading]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Load Profile from User if available, otherwise from local storage
  useEffect(() => {
    if (user?.profile) {
      setProfile(user.profile);
    } else {
      const localProfile = localStorage.getItem('ds_local_profile');
      if (localProfile) {
        try {
          setProfile(JSON.parse(localProfile));
        } catch (e) {
          console.error("Failed to parse local profile", e);
        }
      }
    }
  }, [user]);

  // Check if profile is empty after a delay, to prompt the user
  useEffect(() => {
    const timer = setTimeout(() => {
      const hasCompletedOnboarding = localStorage.getItem('dealos_onboarding_complete');
      if (!hasCompletedOnboarding && !profile.goals && !profile.mustHaves && !profile.superpowers) {
        setShowOnboarding(true);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [profile.goals, profile.mustHaves, profile.superpowers]);

  // Auto-save extra data (files and chat) when they change
  useEffect(() => {
    if (currentCacheId && user) {
      dataService.saveDealExtraData(user.id, currentCacheId, deal.files, chatMessages)
        .then(updatedFiles => {
          if (updatedFiles && updatedFiles !== deal.files) {
            // Only update if files actually changed to avoid infinite loop
            const hasChanges = updatedFiles.some((f, i) => f.downloadUrl !== deal.files[i]?.downloadUrl);
            if (hasChanges) {
              setDeal(prev => ({ ...prev, files: updatedFiles }));
            }
          }
        })
        .catch(console.error);
    }
  }, [deal.files, chatMessages, currentCacheId, user]);

  // Calculated Metrics
  const metrics: CalculatedMetrics = useMemo(() => {
    let multiple = null;
    let margin = null;
    let status: CalculatedMetrics['status'] = 'UNKNOWN';

    if (deal.sde > 0 && deal.askingPrice > 0) {
      multiple = parseFloat((deal.askingPrice / deal.sde).toFixed(2));
    }

    if (deal.sde > 0 && deal.revenue > 0) {
        margin = parseFloat(((deal.sde / deal.revenue) * 100).toFixed(1));
    }

    if (multiple) {
        if (multiple < 2) status = 'SUSPICIOUS';
        else if (multiple > 4) status = 'PREMIUM';
        else status = 'MARKET';
    }

    return { multiple, margin, status };
  }, [deal.askingPrice, deal.sde, deal.revenue]);

  const handleImport = async (forceRefresh = false) => {
    if (!deal.listingUrl) {
      setError("Please enter a Listing URL to import.");
      return;
    }
    setImporting(true);
    setError(null);
    setCurrentCacheId(null); // Reset cache link on new import

    try {
      // 1. Check Cache First (Save Tokens)
      if (!forceRefresh) {
        const cached = dataService.checkCache(deal.listingUrl);
        if (cached) {
          console.log("Using cached data for import");
          
          let extraFiles: DealFile[] = [];
          let extraChat: ChatMessage[] = [];
          const extraData = user ? await dataService.getDealExtraData(user.id, cached.id) : undefined;
          if (extraData) {
            if (extraData.files) extraFiles = extraData.files;
            if (extraData.chatMessages) extraChat = extraData.chatMessages;
          }

          setDeal(prev => ({
            ...prev,
            ...cached.dealData,
            // Keep user notes if they started typing
            notes: prev.notes || cached.dealData.notes || '',
            growthContext: prev.growthContext || cached.dealData.growthContext || '',
            imageUrl: cached.dealData.imageUrl || '',
            files: extraFiles, // Load files from IndexedDB
            hasFinancials: cached.dealData.hasFinancials || false
          }));
          
          if (extraChat.length > 0) {
            setChatMessages(extraChat);
          }

          // If we have a full analysis in cache, load that too!
          if (cached.analysis) {
            setResult(cached.analysis);
            setCurrentCacheId(cached.id);
          }
          setImporting(false);
          return;
        }
      } else {
        // If forceRefresh, clear the cache entry and reset the analysis result
        dataService.clearCache(deal.listingUrl);
        setResult(null);
        setGrowthResult(null);
        setChatMessages([]);
      }

      // 2. Fetch Fresh Data if not cached
      const extracted = await extractDealMetrics(deal.listingUrl);
      setDeal(prev => ({
        ...prev,
        askingPrice: extracted.askingPrice || prev.askingPrice,
        revenue: extracted.revenue || prev.revenue,
        sde: extracted.sde || prev.sde,
        keywords: extracted.keywords || prev.keywords,
        imageUrl: extracted.imageUrl || prev.imageUrl,
      }));
    } catch (err) {
      setError(
        "Could not extract data from this URL. Make sure it's a valid business listing (like BizBuySell). TIP: You can also copy/paste the listing text directly into 'Notes'."
      );
    } finally {
      setImporting(false);
    }
  };

  const handleClear = () => {
    setDeal({
      listingUrl: '',
      askingPrice: 0,
      revenue: 0,
      sde: 0,
      keywords: '',
      notes: '',
      growthContext: '',
      imageUrl: '',
      files: [],
      hasFinancials: false
    });
    setResult(null);
    setGrowthResult(null);
    setChatMessages([]);
    setError(null);
    setCurrentCacheId(null);
    setSaveSuccess(false);
    setCrm(defaultCrm());
  };

  const handleAnalysis = async () => {
    const cached = dataService.checkCache(deal.listingUrl);
    const hasFiles = deal.files && deal.files.length > 0;
    const cacheIsStage1 = cached?.analysis?.initialScore === undefined;
    
    const forceFreshRun = hasFiles && cacheIsStage1;

    if (cached && cached.analysis && !forceFreshRun) {
      setResult(cached.analysis);
      setCurrentCacheId(cached.id);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setGrowthResult(null);
    try {
      const response = await analyzeDeal(
        profile, 
        deal, 
        { 
          multiple: metrics.multiple?.toString() || "N/A", 
          margin: metrics.margin?.toString() || "N/A" 
        }
      );
      
      // Preserve the initial score if this is a stage 2 run
      if (cached?.analysis?.score && forceFreshRun) {
        response.initialScore = cached.analysis.score;
      } else if (cached?.analysis?.initialScore) {
        // Or keep the existing initial score if we re-run again
        response.initialScore = cached.analysis.initialScore;
      }

      setResult(response);

      if (deal.listingUrl) {
        const entry = dataService.saveToGlobalCache(deal.listingUrl, deal, response, metrics, currentCacheId || undefined);
        setCurrentCacheId(entry.id);
        if (user) {
          const updatedFiles = await dataService.saveDealExtraData(user.id, entry.id, deal.files, chatMessages);
          if (updatedFiles) {
            setDeal(prev => ({ ...prev, files: updatedFiles }));
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGrowthAnalysis = async () => {
    let apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
        setError("API Key missing.");
        return;
    }
    setGrowthLoading(true);
    setError(null);
    try {
        const response = await generateGrowthStrategy(profile, deal);
        setGrowthResult(response);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred during growth analysis');
    } finally {
        setGrowthLoading(false);
    }
  };

  const handleDownloadChat = () => {
    if (chatMessages.length === 0) return;
    
    let chatText = `Acquisition Edge Chat Log - ${deal.keywords || 'Business Opportunity'}\n`;
    chatText += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    chatMessages.forEach(msg => {
      const role = msg.role === 'user' ? 'You' : 'Acquisition Edge';
      const time = new Date(msg.timestamp).toLocaleTimeString();
      chatText += `[${time}] ${role}:\n${msg.text}\n\n`;
    });
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deal-chat-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCreateChatPresentation = async () => {
    if (chatMessages.length === 0) return;
    
    setChatPresentationLoading(true);
    try {
      const markdown = await generateChatPresentation(chatMessages, {
        deal,
        analysis: result
      });
      
      setChatPresentationResult({
        markdown,
        groundingUrls: [],
        score: result?.score,
        initialScore: result?.initialScore
      });
      setChatPresentationModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred generating the presentation');
    } finally {
      setChatPresentationLoading(false);
    }
  };

  const handleSaveLOITerms = async () => {
    if (chatMessages.length === 0) return;
    setIsExtractingTerms(true);
    try {
      const { extractLOITerms } = await import('./services/geminiService');
      const terms = await extractLOITerms(chatMessages);
      setLoiTerms(terms);
      alert("Terms successfully saved for your LOI!");
    } catch (err) {
      alert("Failed to extract terms. Please make sure you've discussed terms in the chat.");
    } finally {
      setIsExtractingTerms(false);
    }
  };

  const handleChatSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;

    const newMessage: ChatMessage = {
      role: 'user',
      text: chatInput,
      timestamp: Date.now()
    };

    setChatMessages(prev => [...prev, newMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      const responseText = await queryDealChat(chatMessages, newMessage.text, {
        deal,
        analysis: result
      });

      const botMessage: ChatMessage = {
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, botMessage]);
    } catch (err) {
      setChatMessages(prev => [...prev, {
        role: 'model',
        text: "Sorry, I encountered an error connecting to the AI.",
        timestamp: Date.now()
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSummarizeCall = async () => {
    const audioFile = deal.files.find(f => f.mimeType.startsWith('audio/') || f.mimeType.startsWith('video/') || f.name.endsWith('.amr'));
    if (!audioFile) {
      setError("No audio/video file found to summarize.");
      return;
    }

    setSummarizingCall(true);
    setError(null);

    try {
      const { summarizeCall } = await import('./services/geminiService');
      const summary = await summarizeCall(audioFile, deal.callParticipants || '');
      setDeal(prev => {
        const updatedDeal = { ...prev, callSummary: summary };
        
        // Auto-save the summary to the cache if we have an active session
        if (currentCacheId) {
           dataService.saveToGlobalCache(
             updatedDeal.listingUrl || 'manual-' + Date.now(),
             updatedDeal,
             result || { markdown: '', groundingUrls: [] },
             metrics,
             currentCacheId
           );
        }
        
        return updatedDeal;
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to summarize call.");
    } finally {
      setSummarizingCall(false);
    }
  };

  const handleSaveDeal = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    
    // Always update global cache to ensure latest dealData (like callSummary) is saved
    const entry = dataService.saveToGlobalCache(
      deal.listingUrl || 'manual-' + Date.now(), 
      deal, 
      result || { markdown: '', groundingUrls: [] }, 
      metrics,
      currentCacheId || undefined
    );
    setCurrentCacheId(entry.id);

    const effectiveCacheId = entry.id;
    
    if (effectiveCacheId) {
      try {
        await dataService.saveUserDeal(user.id, effectiveCacheId, deal.notes, crm, deal, result || { markdown: '', groundingUrls: [] }, metrics);
        
        // Save extra data (files and chat messages) to Firestore
        const updatedFiles = await dataService.saveDealExtraData(user.id, effectiveCacheId, deal.files, chatMessages);
        if (updatedFiles) {
          setDeal(prev => ({ ...prev, files: updatedFiles }));
        }
        
        // Trigger Cloud Sync
        await syncData();

        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (err) {
        console.error("Failed to save deal:", err);
        alert("Failed to save deal. Please try again.");
      }
    }
  };

  const handleCrmChange = async (newCrm: CrmData) => {
    setCrm(newCrm);
    if (user && currentCacheId) {
      await dataService.saveUserDeal(user.id, currentCacheId, deal.notes, newCrm, deal, result || { markdown: '', groundingUrls: [] }, metrics);
      // Fire and forget sync to avoid UI blocking
      syncData().catch(console.error);
    }
  };

  const handleSaveProfile = async () => {
    localStorage.setItem('ds_local_profile', JSON.stringify(profile));
    if (!user) {
        setAuthModalOpen(true);
        return;
    }
    // updateUserProfile triggers cloud sync internally in AuthContext
    await updateUserProfile(profile);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleExportProfile = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profile, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `investor-profile-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportProfile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileObj = event.target.files && event.target.files[0];
    if (!fileObj) return;

    // Reset error state
    setError(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const rawContent = e.target?.result as string;
            if (!rawContent) throw new Error("Empty file");

            const json = JSON.parse(rawContent);
            const newProfile = {
                goals: json.goals || '',
                mustHaves: json.mustHaves || '',
                superpowers: json.superpowers || ''
            };
            setProfile(newProfile);
            localStorage.setItem('ds_local_profile', JSON.stringify(newProfile));
            
            // Auto-save if logged in
            if (user) {
                // We do NOT await this to prevent UI freezing if sync is slow
                // Errors in sync are handled by the AuthContext syncError state
                updateUserProfile(newProfile).catch(err => {
                    console.warn("Auto-save after import failed (likely network or auth issue)", err);
                });
            }
        } catch (err) {
            console.error("Failed to load profile", err);
            setError("Failed to import. Please ensure the file is a valid JSON profile.");
        }
    };
    reader.readAsText(fileObj);
    // Reset so same file can be loaded again if needed
    event.target.value = ''; 
  };

  const loadFromHistory = async (saved: PopulatedSavedDeal) => {
    setDeal({
      listingUrl: saved.cache.url,
      askingPrice: saved.cache.dealData.askingPrice || 0,
      revenue: saved.cache.dealData.revenue || 0,
      sde: saved.cache.dealData.sde || 0,
      keywords: saved.cache.dealData.keywords || '',
      notes: saved.personalNotes || saved.cache.dealData.notes || '', 
      growthContext: saved.cache.dealData.growthContext || '',
      imageUrl: saved.cache.dealData.imageUrl || '',
      files: [],
      hasFinancials: saved.cache.dealData.hasFinancials || false,
      callParticipants: saved.cache.dealData.callParticipants || '',
      callSummary: saved.cache.dealData.callSummary || ''
    });
    setResult(saved.cache.analysis);
    setGrowthResult(null);
    setCurrentCacheId(saved.cache.id);
    setChatMessages([]); // Reset chat on new deal load
    setCrm(saved.crm || defaultCrm());

    // Load extra data (files and chat messages)
    const extraData = user ? await dataService.getDealExtraData(user.id, saved.cache.id) : undefined;
    if (extraData) {
      if (extraData.files) {
        setDeal(prev => ({ ...prev, files: extraData.files }));
      }
      if (extraData.chatMessages) {
        setChatMessages(extraData.chatMessages);
      }
    }
  };

  // Load deal from URL if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dealId = params.get('dealId');
    
    if (dealId && user) {
      dataService.getUserDeals(user.id).then(userDeals => {
        const savedDeal = userDeals.find(d => d.id === dealId);
        
        if (savedDeal) {
          loadFromHistory(savedDeal);
          // Clear the URL parameter so it doesn't reload on refresh
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      });
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-4 md:p-8 font-sans selection:bg-amber-400 selection:text-slate-900">
      
      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      
      {/* Chat Presentation Modal */}
      <ChatPresentationModal 
        isOpen={chatPresentationModalOpen} 
        onClose={() => setChatPresentationModalOpen(false)} 
        result={chatPresentationResult}
        dealTitle={deal.keywords || 'Business Opportunity'}
        deal={deal}
      />
      
      {/* Email Modal */}
      <EmailModal 
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        defaultEmail={user?.email || ''}
        dealTitle={deal.keywords || 'Business Opportunity'}
        dealBody={result?.markdown || ''}
      />
      
      {/* Onboarding Deck */}
      {showOnboarding && (
        <OnboardingDeck 
          initialProfile={profile}
          onComplete={(updatedProfile, playbookAnswers) => {
            setProfile(updatedProfile);
            localStorage.setItem('ds_local_profile', JSON.stringify(updatedProfile));
            localStorage.setItem('dealos_onboarding_complete', 'true');
            // Save playbook answers to local storage so PlaybookGenerator can use them
            localStorage.setItem('dealos_playbook_answers', JSON.stringify(playbookAnswers));
            setShowOnboarding(false);
          }}
        />
      )}

      {/* API Key Selection Overlay */}
      {!hasApiKey && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900">
          <div className="relative w-full max-w-md bg-slate-800 rounded-xl shadow-2xl border border-slate-700 p-8 text-center">
            <div className="w-16 h-16 bg-amber-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wide mb-4">
              API Key Required
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              To use MAX mode (Gemini 3.1 Pro), you must provide your own API key from a paid Google Cloud project.
            </p>
            <p className="text-slate-500 text-xs mb-6">
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-amber-400 hover:underline">
                Learn more about billing
              </a>
            </p>
            <button 
              onClick={handleSelectApiKey}
              className="w-full bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold py-3 px-4 rounded-lg shadow-lg transition-all uppercase tracking-wider"
            >
              Select API Key
            </button>
          </div>
        </div>
      )}

      {/* History Sidebar */}
      <DashboardSidebar 
        isOpen={historyOpen} 
        onClose={() => setHistoryOpen(false)} 
        onSelectDeal={loadFromHistory}
      />

      {/* Header */}
      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 4L4 36H14L20 24L26 36H36L20 4Z" fill="currentColor" className="text-amber-400"/>
              <path d="M20 16L12 32H28L20 16Z" fill="currentColor" className="text-slate-900"/>
            </svg>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight flex items-baseline flex-wrap gap-x-3">
              <span>Acquisition <span className="italic text-amber-400">Edge</span></span>
            </h1>
            <p className="text-slate-500 text-sm font-medium tracking-wide mt-1 italic">
              "The acquisition intelligence tool built for buyers who think above the crowd."
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 mt-4 md:mt-0 w-full md:w-auto justify-start md:justify-end">
          <div className="px-4 py-2 bg-slate-800 rounded border border-slate-700 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gemini 3.1 Pro Active</span>
          </div>

          {user ? (
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
               {isSyncing ? (
                   <div className="text-xs font-bold text-amber-400 uppercase animate-pulse mr-2 flex items-center">
                        <svg className="w-3 h-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Syncing...
                   </div>
               ) : syncError ? (
                   <div className="text-xs font-bold text-red-400 uppercase mr-2 bg-red-900/20 px-2 py-1 rounded border border-red-900/50 max-w-[200px] truncate" title={syncError}>
                       {syncError}
                   </div>
               ) : user.accessToken ? (
                   <div className="text-xs font-bold text-green-500 uppercase mr-2 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Cloud Active
                   </div>
               ) : null}

               <button 
                onClick={() => setPlaybookModalOpen(true)}
                className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded transition-colors flex items-center"
               >
                 <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477-4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                 </svg>
                 Playbook
               </button>
               <button 
                onClick={() => setHistoryOpen(true)}
                className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded transition-colors flex items-center"
               >
                 {user.picture ? (
                   <img src={user.picture} alt="Profile" className="w-4 h-4 rounded-full mr-2" />
                 ) : (
                   <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                   </svg>
                 )}
                 My Deals
               </button>
               <button 
                onClick={logout}
                className="text-slate-500 hover:text-red-400 text-xs font-bold uppercase tracking-wider ml-auto sm:ml-0"
               >
                 Logout
               </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
               {syncError && (
                   <div className="text-xs font-bold text-red-400 uppercase mr-2 bg-red-900/20 px-2 py-1 rounded border border-red-900/50 max-w-[200px] truncate" title={syncError}>
                       {syncError}
                   </div>
               )}
               <button 
                 onClick={() => setAuthModalOpen(true)}
                 className="bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded shadow-lg shadow-amber-400/20 transition-all transform hover:-translate-y-0.5"
               >
                 Login
               </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Inputs & Chat */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card 1: Investor Profile */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl overflow-hidden relative group">
             <div className="absolute top-0 left-0 w-1 h-full bg-slate-600 group-hover:bg-amber-400 transition-colors"></div>
             <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-display font-bold text-white uppercase flex items-center">
                    <svg className="w-5 h-5 mr-2 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Investor Profile
                    </h2>
                    
                    <div className="flex items-center space-x-2">
                        {/* Import JSON */}
                        <button 
                            onClick={() => profileInputRef.current?.click()}
                            className="p-1.5 text-slate-400 hover:text-amber-400 border border-slate-700 hover:border-amber-400 rounded transition-colors"
                            title="Import Profile JSON"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                        </button>
                        <input 
                            type="file" 
                            ref={profileInputRef} 
                            onChange={handleImportProfile} 
                            className="hidden" 
                            accept=".json"
                        />

                        {/* Export JSON */}
                        <button 
                            onClick={handleExportProfile}
                            className="p-1.5 text-slate-400 hover:text-amber-400 border border-slate-700 hover:border-amber-400 rounded transition-colors"
                            title="Export Profile JSON"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </button>
                        
                        {/* Save to Account */}
                        <button 
                            onClick={handleSaveProfile}
                            className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1.5 rounded transition-colors border ml-2 ${
                            profileSaved 
                            ? 'bg-green-900/50 border-green-500 text-green-400' 
                            : 'bg-slate-900 border-slate-600 text-slate-400 hover:text-amber-400 hover:border-amber-400'
                            }`}
                        >
                            {profileSaved ? 'Saved' : 'Save Default'}
                        </button>
                    </div>
                </div>

                <Input 
                  label="Financial Goal" 
                  value={profile.goals} 
                  onChange={(e) => setProfile({...profile, goals: e.target.value})}
                  placeholder="e.g. $10k/mo cash flow"
                />
                <Input 
                  label="Must Haves" 
                  value={profile.mustHaves}
                  onChange={(e) => setProfile({...profile, mustHaves: e.target.value})}
                  placeholder="e.g. Low churn, recurring revenue"
                />
                <Input 
                  label="My Superpowers" 
                  value={profile.superpowers}
                  onChange={(e) => setProfile({...profile, superpowers: e.target.value})}
                  placeholder="e.g. Operations, SEO, Sales"
                />
                
                <div className="mt-4 pt-4 border-t border-slate-700 flex justify-end">
                  <a href="/dashboard" className="text-sm font-bold text-cyan-500 hover:text-cyan-400 uppercase tracking-wider flex items-center transition-colors">
                    View My Deal Dashboard
                    <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
             </div>
          </div>

          {/* Card 2: Deal Metrics */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-1 h-full bg-slate-600 group-hover:bg-amber-400 transition-colors"></div>
            <div className="p-6">
              <h2 className="text-lg font-display font-bold text-white uppercase mb-4 flex items-center justify-between">
                <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    $ The Deal
                </div>
                {metrics.status !== 'UNKNOWN' && (
                    <span className={`text-[10px] px-2 py-1 rounded font-bold tracking-wider ${
                        metrics.status === 'SUSPICIOUS' ? 'bg-red-900/50 text-red-400 border border-red-700' :
                        metrics.status === 'PREMIUM' ? 'bg-blue-900/50 text-blue-400 border border-blue-700' :
                        'bg-green-900/50 text-green-400 border border-green-700'
                    }`}>
                        {metrics.status}
                    </span>
                )}
              </h2>

              <div className="mb-6">
                 <Input 
                    label="Listing URL" 
                    type="url"
                    placeholder="https://bizbuysell.com/..."
                    value={deal.listingUrl}
                    onChange={(e) => setDeal({...deal, listingUrl: e.target.value})}
                    onAction={() => handleImport(false)}
                    actionLabel="Import Data"
                    actionLoading={importing}
                    onSecondaryAction={handleClear}
                    secondaryActionLabel="Clear Data"
                    onTertiaryAction={() => handleImport(true)}
                    tertiaryActionLabel="Refresh"
                  />
                  {currentCacheId && !importing && (
                    <div className="text-[10px] text-green-400 flex items-center -mt-2 mb-2">
                       <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                       </svg>
                       Loaded from cache (Tokens Saved)
                    </div>
                  )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="Asking Price" 
                    type="number"
                    prefix="$"
                    value={deal.askingPrice || ''}
                    onChange={(e) => setDeal({...deal, askingPrice: parseFloat(e.target.value) || 0})}
                  />
                  <Input 
                    label="Revenue (TTM)" 
                    type="number"
                    prefix="$"
                    value={deal.revenue || ''}
                    onChange={(e) => setDeal({...deal, revenue: parseFloat(e.target.value) || 0})}
                  />
                  <Input 
                    label="SDE (Cash Flow)" 
                    type="number"
                    prefix="$"
                    value={deal.sde || ''}
                    onChange={(e) => setDeal({...deal, sde: parseFloat(e.target.value) || 0})}
                  />
                  
                  {/* Real-time Calculator Display */}
                  <div className="bg-slate-900 rounded border border-slate-700 p-2 flex flex-col justify-center mb-4">
                      <span className="text-slate-500 text-[10px] font-bold uppercase">Valuation Multiple</span>
                      <div className="flex items-baseline space-x-1">
                        <span className="text-xl font-display font-bold text-amber-400">
                            {metrics.multiple ? `${metrics.multiple}x` : '-'}
                        </span>
                        <span className="text-xs text-slate-400">SDE</span>
                      </div>
                  </div>
              </div>

              <div className="mt-2">
                 <Input 
                    label="Keywords (For Comps)" 
                    placeholder="e.g. Subway Franchise, Gym, Laundromat"
                    value={deal.keywords}
                    onChange={(e) => setDeal({...deal, keywords: e.target.value})}
                  />
              </div>

              <div className="mt-4 pt-4 border-t border-slate-700">
                  <FileUploader 
                    files={deal.files} 
                    onFilesChange={(files) => setDeal({...deal, files})} 
                  />
                  
                  {deal.files.some(f => f.mimeType.startsWith('audio/') || f.mimeType.startsWith('video/') || f.name.endsWith('.amr')) && (
                    <div className="mt-4 p-4 bg-slate-900 border border-slate-700 rounded-lg">
                      <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        Broker Call Notes
                      </h3>
                      <Input 
                        label="Call Participants (Optional)" 
                        placeholder="e.g. John Doe (Broker), Jane Smith (Seller)"
                        value={deal.callParticipants || ''}
                        onChange={(e) => setDeal({...deal, callParticipants: e.target.value})}
                      />
                      <button
                        onClick={handleSummarizeCall}
                        disabled={summarizingCall}
                        className={`w-full mt-3 py-2 text-xs uppercase font-bold tracking-widest text-slate-900 transition-all rounded
                            ${summarizingCall ? 'bg-slate-600' : 'bg-cyan-500 hover:bg-cyan-400'}
                        `}
                      >
                        {summarizingCall ? 'Summarizing Call...' : 'Generate Call Summary'}
                      </button>
                      
                      {deal.callSummary && (
                        <div className="mt-3">
                          <TextArea 
                            label="Call Summary"
                            value={deal.callSummary}
                            onChange={(e) => setDeal({...deal, callSummary: e.target.value})}
                            className="min-h-[150px] text-sm"
                          />
                          <button
                            onClick={() => {
                              const blob = new Blob([deal.callSummary || ''], { type: 'text/plain' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = 'broker_call_summary.txt';
                              a.click();
                              URL.revokeObjectURL(url);
                            }}
                            className="mt-2 text-xs text-amber-400 hover:text-amber-300 flex items-center"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download Summary (.txt)
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <TextArea 
                    label="Additional Notes / Text Paste"
                    placeholder="Paste CIM content, financial details, or specific questions here..."
                    value={deal.notes}
                    onChange={(e) => setDeal({...deal, notes: e.target.value})}
                    className="mt-2 min-h-[120px]"
                  />
              </div>

              <button
                onClick={handleAnalysis}
                disabled={loading}
                className={`w-full mt-2 py-4 uppercase font-display font-bold tracking-widest text-slate-900 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 rounded
                    ${loading ? 'bg-slate-600' : 'bg-amber-400 hover:bg-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.3)]'}
                `}
              >
                {loading ? 'Analyzing Deal...' : 'Run Contrarian Analysis'}
              </button>
            </div>
          </div>

          {/* Card 2.5: CRM Tracker */}
          <CrmTracker 
            crm={crm} 
            onChange={handleCrmChange} 
            disabled={!currentCacheId || !user} 
          />

          {/* Card 3: Deal Chat (Replaced Growth Context) */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl overflow-hidden relative group flex flex-col h-[500px]">
             <div className="absolute top-0 left-0 w-1 h-full bg-slate-600 group-hover:bg-cyan-400 transition-colors"></div>
             <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                 <h2 className="text-lg font-display font-bold text-white uppercase flex items-center">
                    <svg className="w-5 h-5 mr-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    Acquisition Edge Chat
                 </h2>
                 <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-1 rounded uppercase tracking-wider">
                     Documents Active
                 </span>
             </div>

             {/* Chat Messages Area */}
             <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50" ref={chatScrollRef}>
                {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
                        <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        <p className="text-sm text-center max-w-[200px]">
                           Ask questions about the uploaded documents, financials, or analysis.
                        </p>
                    </div>
                ) : (
                    chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
                                msg.role === 'user' 
                                ? 'bg-cyan-600 text-white rounded-br-none' 
                                : 'bg-slate-700 text-slate-200 rounded-bl-none border border-slate-600'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))
                )}
                {chatLoading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-700 text-slate-400 rounded-lg rounded-bl-none p-3 text-sm flex space-x-1">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                        </div>
                    </div>
                )}
             </div>

             {/* Chat Input Area */}
             <div className="p-4 border-t border-slate-700 bg-slate-800">
                 <form onSubmit={handleChatSubmit} className="flex space-x-2">
                     <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Ask about this deal...or create terms to offer the seller"
                        className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 transition-colors"
                     />
                     <button 
                        type="submit" 
                        disabled={chatLoading || !chatInput.trim()}
                        className="bg-cyan-500 hover:bg-cyan-400 text-white px-3 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                     >
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                         </svg>
                     </button>
                 </form>
                 <div className="mt-3 flex justify-between items-center">
                     <button
                        onClick={handleDownloadChat}
                        disabled={chatMessages.length === 0}
                        className="text-xs flex items-center space-x-1 text-slate-400 hover:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                     >
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                         </svg>
                         <span>Export Chat Log</span>
                     </button>
                     <div className="flex space-x-4">
                       <button
                          onClick={handleSaveLOITerms}
                          disabled={chatMessages.length === 0 || isExtractingTerms}
                          className="text-xs flex items-center space-x-1 text-emerald-400 hover:text-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                       >
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                           </svg>
                           <span>{isExtractingTerms ? 'Saving Terms...' : 'Save Terms for LOI'}</span>
                       </button>
                       <button
                          onClick={handleCreateChatPresentation}
                          disabled={chatMessages.length === 0 || chatPresentationLoading}
                          className="text-xs flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                       >
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                           </svg>
                           <span>{chatPresentationLoading ? 'Generating Presentation...' : 'Create Chat Presentation'}</span>
                       </button>
                     </div>
                 </div>
             </div>
          </div>

          {/* Card 4: Create LOI & Send to Broker */}
          <CreateLOIBox loiTerms={loiTerms} userId={user?.id} dealId={currentCacheId || undefined} />

          {/* Card 5: Capital Raising & Deal Terms */}
          <CapitalRaisingBox profile={profile} deal={deal} analysis={result} />

          {/* 2. Growth & Scaling Context (MOVED HERE) */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl overflow-hidden relative group">
             <div className="absolute top-0 left-0 w-1 h-full bg-slate-600 group-hover:bg-green-400 transition-colors"></div>
             <div className="p-6">
                <h2 className="text-lg font-display font-bold text-white uppercase mb-4 flex items-center">
                   <svg className="w-5 h-5 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                   </svg>
                   Growth & Scaling Context
                </h2>
                
                <TextArea 
                    label="Social Media Links / Ad URLs / Marketing Context"
                    placeholder="Paste Facebook/IG links, YouTube channels, descriptions of current ads, or any known marketing efforts here..."
                    value={deal.growthContext || ''}
                    onChange={(e) => setDeal({...deal, growthContext: e.target.value})}
                    className="min-h-[100px] text-sm"
                />
                
                <p className="text-[10px] text-slate-500 italic mb-4">
                   * Documents uploaded above (P&Ls, etc.) will also be analyzed for growth opportunities.
                </p>

                <button
                    onClick={handleGrowthAnalysis}
                    disabled={growthLoading}
                    className={`w-full py-3 uppercase font-display font-bold tracking-widest text-slate-900 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 rounded
                        ${growthLoading ? 'bg-slate-600' : 'bg-green-400 hover:bg-green-300 shadow-[0_0_15px_rgba(74,222,128,0.3)]'}
                    `}
                >
                    {growthLoading ? 'Generating Playbook...' : 'Generate Growth & Exit Strategy'}
                </button>
             </div>
          </div>

          {/* 3. Growth Playbook Result Box */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl min-h-[400px] p-8 relative overflow-hidden flex flex-col">
             {/* Decorative Background Element */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-green-400 opacity-[0.03] rounded-bl-full pointer-events-none"></div>
             
             <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                <h3 className="font-display font-bold text-xl uppercase tracking-wider text-slate-200">
                    Exit Strategy & Growth Playbook
                </h3>
                {growthResult && (
                    <button 
                        onClick={() => setGrowthResult(null)}
                        className="text-xs text-slate-500 hover:text-green-400 uppercase font-bold transition-colors"
                    >
                        Clear
                    </button>
                )}
             </div>

             <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                <ResultViewer 
                    result={growthResult} 
                    loading={growthLoading} 
                    dealTitle={`Growth Plan: ${deal.keywords || 'Business'}`} 
                    loadingMessage="Analyzing Scaling Stages and Money Models..."
                    deal={deal}
                />
             </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Results & Growth Input */}
        <div className="lg:col-span-7 h-full space-y-8">
          
          {/* 1. Deal Memorandum (Result) */}
          <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl min-h-[400px] p-8 relative overflow-hidden flex flex-col">
             {/* Decorative Background Element */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400 opacity-[0.03] rounded-bl-full pointer-events-none"></div>
             
             <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                <h3 className="font-display font-bold text-xl uppercase tracking-wider text-slate-200">
                    Deal Memorandum
                </h3>
                <div className="flex space-x-3">
                   {result && (
                     <button
                        onClick={handleSaveDeal}
                        className={`text-xs uppercase font-bold tracking-wider px-3 py-1 rounded transition-colors border ${
                           saveSuccess 
                            ? 'bg-green-900/50 border-green-500 text-green-400' 
                            : 'bg-slate-900 border-slate-600 text-slate-300 hover:border-amber-400 hover:text-amber-400'
                        }`}
                     >
                       {saveSuccess ? 'Saved!' : user ? 'Save to History' : 'Login to Save'}
                     </button>
                   )}
                   {result && (
                     <button
                        onClick={() => setEmailModalOpen(true)}
                        className="text-xs uppercase font-bold tracking-wider px-3 py-1 rounded transition-colors border bg-slate-900 border-slate-600 text-slate-300 hover:border-amber-400 hover:text-amber-400 flex items-center"
                     >
                       <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                       </svg>
                       Email
                     </button>
                   )}
                   {result && (
                      <button 
                          onClick={() => setResult(null)}
                          className="text-xs text-slate-500 hover:text-amber-400 uppercase font-bold transition-colors"
                      >
                          Clear
                      </button>
                   )}
                </div>
             </div>

             <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                {error && !growthLoading && (
                    <div className="p-4 bg-red-900/20 border border-red-800 rounded text-red-300 mb-4 text-sm">
                        {error}
                    </div>
                )}
                <ResultViewer 
                    result={result} 
                    loading={loading} 
                    dealTitle={deal.keywords || 'Business Opportunity'} 
                    loadingMessage={`Benchmarking ${deal.keywords || 'industry'} metrics against SOWS & BRIT frameworks...`}
                    deal={deal}
                    showReferences={true}
                />
             </div>
          </div>
        </div>

      </main>

      <PlaybookGenerator 
        isOpen={playbookModalOpen} 
        onClose={() => setPlaybookModalOpen(false)} 
        investorProfile={profile} 
      />
      <Footer />
    </div>
  );
};

export default App;