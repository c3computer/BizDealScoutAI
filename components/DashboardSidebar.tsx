import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/storageService';
import { PopulatedSavedDeal } from '../types';

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDeal: (deal: PopulatedSavedDeal) => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ isOpen, onClose, onSelectDeal }) => {
  const { user } = useAuth();
  const [deals, setDeals] = useState<PopulatedSavedDeal[]>([]);

  // Refresh deals when sidebar opens
  useEffect(() => {
    const fetchDeals = async () => {
      if (isOpen && user) {
        const history = await dataService.getUserDeals(user.id);
        setDeals(history);
      }
    };
    fetchDeals();
  }, [isOpen, user]);

  if (!isOpen) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400 border-green-500/50 bg-green-900/20';
    if (score >= 60) return 'text-amber-400 border-amber-500/50 bg-amber-900/20';
    return 'text-red-400 border-red-500/50 bg-red-900/20';
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed top-0 left-0 bottom-0 w-80 md:w-96 bg-slate-850 border-r border-slate-700 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-out">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-700 bg-slate-900">
           <div className="flex justify-between items-center mb-1">
             <h2 className="font-display font-bold text-xl text-white uppercase tracking-wider">
               My Deal Flow
             </h2>
             <button onClick={onClose} className="text-slate-400 hover:text-white">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>
           </div>
           <p className="text-xs text-slate-500 uppercase tracking-widest">
             {user?.name}'s History • Sorted by Score
           </p>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
           {deals.length === 0 ? (
             <div className="text-center py-10 text-slate-500">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm">No deals saved yet.</p>
                <p className="text-xs mt-2">Analyze a deal and click "Save" to build your portfolio.</p>
             </div>
           ) : (
             deals.map(saved => {
               const score = saved.cache.analysis.score || 0;
               return (
               <button
                 key={saved.id}
                 onClick={() => {
                   onSelectDeal(saved);
                   onClose();
                 }}
                 className="w-full text-left bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-amber-400/50 rounded-lg p-3 transition-all group relative overflow-hidden"
               >
                 <div className="flex justify-between items-start mb-2">
                   <div className="flex items-center space-x-2 w-3/4">
                       <div className={`flex flex-col items-center justify-center w-10 h-10 rounded border ${getScoreColor(score)}`}>
                          <span className="text-sm font-bold leading-none">{score}</span>
                          <span className="text-[7px] uppercase leading-none opacity-80">Score</span>
                       </div>
                       <h4 className="font-bold text-slate-200 text-sm truncate group-hover:text-amber-400 transition-colors">
                         {saved.cache.dealData.keywords || 'Untitled Opportunity'}
                       </h4>
                   </div>
                   <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wider ${
                      saved.cache.metrics.status === 'PREMIUM' ? 'bg-blue-900/50 text-blue-400' :
                      saved.cache.metrics.status === 'SUSPICIOUS' ? 'bg-red-900/50 text-red-400' :
                      'bg-green-900/50 text-green-400'
                   }`}>
                      {saved.cache.metrics.status}
                   </span>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mb-2 pl-12">
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider opacity-60">Price</span>
                      ${saved.cache.dealData.askingPrice?.toLocaleString() ?? '-'}
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider opacity-60">SDE Mult.</span>
                      {saved.cache.metrics.multiple}x
                    </div>
                 </div>

                 <div className="flex justify-between items-center pt-2 border-t border-slate-700/50 text-[10px] text-slate-500 pl-1">
                    <div className="flex items-center space-x-2">
                      <span>{new Date(saved.savedAt).toLocaleDateString()}</span>
                      {saved.crm && (
                        <span className="bg-purple-900/30 text-purple-400 border border-purple-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider">
                          {saved.crm.status}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {saved.cache.dealData.hasFinancials && (
                        <span className="text-amber-400 font-bold border border-amber-400/30 bg-amber-400/10 px-1 rounded" title="Financials/Documents Included">F$</span>
                      )}
                      <span className="group-hover:translate-x-1 transition-transform">View Analysis &rarr;</span>
                    </div>
                 </div>
               </button>
               );
             })
           )}
        </div>
      </div>
    </>
  );
};