import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/storageService';
import { PopulatedSavedDeal } from '../types';
import { analyzeDeal } from '../services/geminiService';

export const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [deals, setDeals] = useState<PopulatedSavedDeal[]>([]);
  
  type SortField = 'keywords' | 'score' | 'askingPrice' | 'revenue' | 'sde' | 'multiple' | 'crm' | 'savedAt';
  const [sortField, setSortField] = useState<SortField>('savedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedDeals = [...deals].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'keywords':
        aValue = a.cache.dealData.keywords || a.cache.url;
        bValue = b.cache.dealData.keywords || b.cache.url;
        break;
      case 'score':
        aValue = a.cache.analysis.score || 0;
        bValue = b.cache.analysis.score || 0;
        break;
      case 'askingPrice':
        aValue = a.cache.dealData.askingPrice || 0;
        bValue = b.cache.dealData.askingPrice || 0;
        break;
      case 'revenue':
        aValue = a.cache.dealData.revenue || 0;
        bValue = b.cache.dealData.revenue || 0;
        break;
      case 'sde':
        aValue = a.cache.dealData.sde || 0;
        bValue = b.cache.dealData.sde || 0;
        break;
      case 'multiple':
        aValue = a.cache.metrics.multiple || 0;
        bValue = b.cache.metrics.multiple || 0;
        break;
      case 'crm':
        aValue = a.crm?.status || '';
        bValue = b.crm?.status || '';
        break;
      case 'savedAt':
        aValue = a.savedAt;
        bValue = b.savedAt;
        break;
    }

    if (aValue === bValue) return 0;
    
    if (aValue === undefined || aValue === null) return sortDirection === 'desc' ? 1 : -1;
    if (bValue === undefined || bValue === null) return sortDirection === 'desc' ? -1 : 1;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'desc' 
        ? bValue.localeCompare(aValue)
        : aValue.localeCompare(bValue);
    }

    return sortDirection === 'desc' ? bValue - aValue : aValue - bValue;
  });

  const [importingBatch, setImportingBatch] = useState(false);
  const [importProgress, setImportProgress] = useState<string | null>(null);

  const fetchDeals = () => {
    if (user) {
      const userDeals = dataService.getUserDeals(user.id);
      setDeals(userDeals);
    }
  };

  const handleImportBatch = async () => {
    if (!user) return;
    setImportingBatch(true);
    setImportProgress("Fetching deals...");
    try {
      const res = await fetch('/api/extension/deals');
      if (res.ok) {
        const extensionDeals = await res.json();
        const profile = user.profile || { goals: '', mustHaves: '', superpowers: '' };
        
        const parseDealNumber = (str: string | undefined) => {
          if (!str) return 0;
          let cleanStr = str.replace(/[^0-9.MkK]/g, '');
          let multiplier = 1;
          if (cleanStr.toLowerCase().endsWith('m')) {
            multiplier = 1000000;
            cleanStr = cleanStr.slice(0, -1);
          } else if (cleanStr.toLowerCase().endsWith('k')) {
            multiplier = 1000;
            cleanStr = cleanStr.slice(0, -1);
          }
          const val = parseFloat(cleanStr);
          return isNaN(val) ? 0 : val * multiplier;
        };
        
        for (let i = 0; i < extensionDeals.length; i++) {
          const d = extensionDeals[i];
          setImportProgress(`Analyzing deal ${i + 1} of ${extensionDeals.length}...`);
          
          // Convert the extension deal format to our internal format
          const dealData = {
            listingUrl: d.url,
            askingPrice: parseDealNumber(d.askingPrice),
            sde: parseDealNumber(d.cashFlow),
            revenue: parseDealNumber(d.grossRevenue),
            keywords: d.title || '',
            notes: `Broker: ${d.brokerName || 'N/A'}\nPhone: ${d.brokerPhone || 'N/A'}`,
            growthContext: '',
            imageUrl: '',
            files: [],
            hasFinancials: false
          };
          
          const metrics = {
            multiple: dealData.sde > 0 ? parseFloat((dealData.askingPrice / dealData.sde).toFixed(2)) : null,
            margin: dealData.revenue > 0 ? parseFloat(((dealData.sde / dealData.revenue) * 100).toFixed(1)) : null,
            status: 'UNKNOWN' as any
          };

          let analysisResult;
          try {
            analysisResult = await analyzeDeal(profile, dealData, {
              multiple: metrics.multiple?.toString() || "N/A",
              margin: metrics.margin?.toString() || "N/A"
            });
          } catch (aiError) {
            console.error("AI Analysis failed for deal", d.url, aiError);
            analysisResult = { markdown: 'AI Analysis failed during import. Please retry manually.', groundingUrls: [] };
          }

          const entry = dataService.saveToGlobalCache(
            d.url, 
            dealData, 
            analysisResult, 
            metrics
          );
          
          dataService.saveUserDeal(user.id, entry.id, dealData.notes, d.crm || undefined);
        }
        
        setImportProgress("Refreshing dashboard...");
        fetchDeals();
      }
    } catch (err) {
      console.error("Failed to import batch deals", err);
    } finally {
      setImportingBatch(false);
      setImportProgress(null);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl w-full max-w-md shadow-2xl text-center">
          <h1 className="text-2xl font-display font-bold text-white mb-6 tracking-wider uppercase">User Dashboard</h1>
          <p className="text-slate-400 mb-6">Please log in to view your dashboard.</p>
          <a href="/" className="inline-block bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-3 px-6 rounded uppercase tracking-widest transition-colors">
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="ml-1 opacity-0 group-hover:opacity-50">↓</span>;
    return <span className="ml-1 text-cyan-400">{sortDirection === 'desc' ? '↓' : '↑'}</span>;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-white uppercase tracking-wider">My Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">View and manage your saved deals</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={handleImportBatch}
              disabled={importingBatch}
              className="text-sm text-emerald-400 hover:text-white border border-emerald-700 hover:border-emerald-500 px-4 py-2 rounded transition-colors flex items-center disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {importingBatch ? (importProgress || 'Importing...') : 'Import Batched Deals'}
            </button>
            <a 
              href="/"
              className="text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-4 py-2 rounded transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </a>
            <button 
              onClick={fetchDeals}
              className="text-sm text-cyan-400 hover:text-white border border-cyan-700 hover:border-cyan-500 px-4 py-2 rounded transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-850 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800 select-none">
                <tr>
                  <th className="p-4 font-semibold cursor-pointer hover:text-white group" onClick={() => handleSort('keywords')}>
                    Deal / URL <SortIcon field="keywords" />
                  </th>
                  <th className="p-4 font-semibold text-center cursor-pointer hover:text-white group" onClick={() => handleSort('score')}>
                    Score <SortIcon field="score" />
                  </th>
                  <th className="p-4 font-semibold text-right cursor-pointer hover:text-white group" onClick={() => handleSort('askingPrice')}>
                    Asking Price <SortIcon field="askingPrice" />
                  </th>
                  <th className="p-4 font-semibold text-right cursor-pointer hover:text-white group" onClick={() => handleSort('revenue')}>
                    Revenue <SortIcon field="revenue" />
                  </th>
                  <th className="p-4 font-semibold text-right cursor-pointer hover:text-white group" onClick={() => handleSort('sde')}>
                    SDE <SortIcon field="sde" />
                  </th>
                  <th className="p-4 font-semibold text-center cursor-pointer hover:text-white group" onClick={() => handleSort('multiple')}>
                    Mult. <SortIcon field="multiple" />
                  </th>
                  <th className="p-4 font-semibold text-center cursor-pointer hover:text-white group" onClick={() => handleSort('crm')}>
                    CRM Status <SortIcon field="crm" />
                  </th>
                  <th className="p-4 font-semibold text-right cursor-pointer hover:text-white group" onClick={() => handleSort('savedAt')}>
                    Date <SortIcon field="savedAt" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {sortedDeals.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      No deals saved yet.
                    </td>
                  </tr>
                ) : (
                  sortedDeals.map((deal) => {
                    const score = deal.cache.analysis.score || 0;
                    const title = deal.cache.dealData.keywords || deal.cache.url.split('bizbuysell.com/')[1]?.split('/')[0]?.replace(/-/g, ' ') || 'Unknown Deal';

                    return (
                      <tr key={deal.id} className="hover:bg-slate-800/50 transition-colors group">
                        <td className="p-4">
                          <a 
                            href={`/?dealId=${deal.id}`}
                            className="font-medium text-slate-200 truncate max-w-[200px] hover:text-amber-400 transition-colors block" 
                            title={title}
                          >
                            {title}
                          </a>
                          <a 
                            href={deal.cache.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-[10px] text-cyan-400 hover:underline truncate max-w-[200px] block mt-1"
                            title={deal.cache.url}
                          >
                            {deal.cache.url}
                          </a>
                        </td>
                        <td className="p-4 text-center">
                          {score > 0 ? (
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded font-bold ${
                              score >= 80 ? 'bg-green-900/30 text-green-400 border border-green-500/30' :
                              score >= 60 ? 'bg-amber-900/30 text-amber-400 border border-amber-500/30' :
                              'bg-red-900/30 text-red-400 border border-red-500/30'
                            }`}>
                              {score}
                            </span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                        <td className="p-4 text-right font-mono text-slate-300">
                          {deal.cache.dealData.askingPrice ? `$${deal.cache.dealData.askingPrice.toLocaleString()}` : '-'}
                        </td>
                        <td className="p-4 text-right font-mono text-slate-400">
                          {deal.cache.dealData.revenue ? `$${deal.cache.dealData.revenue.toLocaleString()}` : '-'}
                        </td>
                        <td className="p-4 text-right font-mono text-slate-400">
                          {deal.cache.dealData.sde ? `$${deal.cache.dealData.sde.toLocaleString()}` : '-'}
                        </td>
                        <td className="p-4 text-center font-mono text-slate-400">
                          {deal.cache.metrics.multiple ? `${deal.cache.metrics.multiple}x` : '-'}
                        </td>
                        <td className="p-4 text-center">
                          {deal.crm?.status ? (
                            <span className="bg-purple-900/30 text-purple-400 border border-purple-500/30 px-2 py-1 rounded text-[10px] uppercase tracking-wider">
                              {deal.crm.status}
                            </span>
                          ) : (
                            <span className="text-slate-600 text-[10px] uppercase">None</span>
                          )}
                        </td>
                        <td className="p-4 text-right text-slate-500 text-xs">
                          {new Date(deal.savedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
