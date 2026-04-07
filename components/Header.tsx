import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './AuthModal';

interface HeaderProps {
  onOpenHistory?: () => void;
  onOpenProfile?: () => void;
  showActions?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenHistory, onOpenProfile, showActions = true }) => {
  const { user, isSyncing, syncError } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-6 pt-6 px-4 md:px-8">
        <div className="flex items-center gap-4">
          <a href="/" className="flex-shrink-0 hover:opacity-80 transition-opacity">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 4L4 36H14L20 24L26 36H36L20 4Z" fill="currentColor" className="text-amber-400"/>
              <path d="M20 16L12 32H28L20 16Z" fill="currentColor" className="text-slate-900"/>
            </svg>
          </a>
          <div>
            <a href="/" className="hover:opacity-80 transition-opacity block">
              <h1 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight flex items-baseline flex-wrap gap-x-3">
                <span>Acquisition <span className="italic text-amber-400">Edge</span></span>
              </h1>
            </a>
            <p className="text-slate-500 text-sm font-medium tracking-wide mt-1 italic">
              "The acquisition intelligence tool built for buyers who think above the crowd."
            </p>
          </div>
        </div>
        
        {showActions && (
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <div className="px-4 py-2 bg-slate-800 rounded border border-slate-700 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gemini 3.1 Pro Active</span>
            </div>

            {user ? (
              <div className="flex items-center space-x-3">
                 {isSyncing ? (
                     <div className="text-xs font-bold text-amber-400 uppercase animate-pulse mr-2 flex items-center">
                          <svg className="w-3 h-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Syncing...
                     </div>
                 ) : syncError ? (
                     <div className="text-xs font-bold text-red-400 mr-2 flex items-center" title={syncError}>
                         <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                         </svg>
                         Sync Error
                     </div>
                 ) : (
                     <div className="text-xs font-bold text-green-400 mr-2 flex items-center">
                         <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                         </svg>
                         Synced
                     </div>
                 )}
                
                {onOpenHistory && (
                  <button 
                    onClick={onOpenHistory}
                    className="text-slate-400 hover:text-white transition-colors p-2 rounded-full hover:bg-slate-800"
                    title="View History"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                )}
                {onOpenProfile && (
                  <button 
                    onClick={onOpenProfile}
                    className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white py-2 px-3 rounded-lg transition-colors border border-slate-700"
                  >
                    <img src={user.picture} alt={user.name} className="w-6 h-6 rounded-full" />
                    <span className="text-sm font-medium hidden sm:block">{user.name}</span>
                  </button>
                )}
              </div>
            ) : (
              <button 
                onClick={() => setAuthOpen(true)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-2 px-4 rounded-lg transition-colors shadow-[0_0_15px_rgba(245,158,11,0.3)]"
              >
                Sign In
              </button>
            )}
          </div>
        )}
      </header>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
};
