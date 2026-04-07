import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, isSyncing, isGoogleReady } = useAuth();
  
  if (!isOpen) return null;

  const handleLogin = () => {
    login();
    onClose();
  };

  const CLIENT_CONFIGURED = !!(import.meta.env.VITE_GOOGLE_CLIENT_ID || (typeof process !== 'undefined' && process.env && process.env.GOOGLE_CLIENT_ID));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative w-full max-w-md bg-slate-800 rounded-xl shadow-2xl border border-slate-700 p-8 transform transition-all scale-100">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
             <svg className="w-6 h-6 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
             </svg>
          </div>
          <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wide">
            Sync with Google
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            Save your Investor Profile and Deal History to your personal Google Drive.
          </p>
        </div>

        {isSyncing ? (
             <div className="text-center py-8">
                 <div className="animate-spin w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                 <p className="text-amber-400 font-bold uppercase tracking-widest text-xs">Syncing Data...</p>
             </div>
        ) : (
            <div className="space-y-4">
                {!CLIENT_CONFIGURED && (
                    <div className="bg-red-900/20 border border-red-800 text-red-300 p-3 rounded text-xs text-center mb-4">
                        <strong>Configuration Missing:</strong> <br/>
                        Please set <code>VITE_GOOGLE_CLIENT_ID</code> in your Netlify Environment Variables.
                    </div>
                )}

                {!isGoogleReady && (
                   <div className="bg-slate-700/50 p-2 rounded text-xs text-center text-slate-400 animate-pulse">
                     Loading Google Security Services...
                   </div>
                )}

                <button
                    onClick={handleLogin}
                    disabled={!CLIENT_CONFIGURED || !isGoogleReady}
                    className="w-full bg-white hover:bg-slate-100 text-slate-800 font-bold py-3 px-4 rounded-lg shadow-lg flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 mr-3" />
                    <span>Sign in with Google</span>
                </button>
                
                <p className="text-[10px] text-slate-500 text-center mt-4 px-4 leading-relaxed">
                    By signing in, you grant Acquisition Edge permission to create and manage a specific configuration file in your Google Drive. We do not access your other files.
                </p>
                <p className="text-[10px] text-amber-500/50 text-center mt-1">
                  Origin: {window.location.origin}
                </p>
            </div>
        )}
      </div>
    </div>
  );
};