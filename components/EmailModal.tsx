import React, { useState, useEffect } from 'react';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail: string;
  dealTitle: string;
  dealBody: string;
}

export const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  defaultEmail,
  dealTitle,
  dealBody
}) => {
  const [toEmail, setToEmail] = useState(defaultEmail);
  const [subject, setSubject] = useState(dealTitle.toUpperCase());
  const [body, setBody] = useState(dealBody);
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setToEmail(defaultEmail);
      setSubject(dealTitle.toUpperCase());
      setBody(dealBody);
      setSuccess(false);
    }
  }, [isOpen, defaultEmail, dealTitle, dealBody]);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    
    // Simulate sending email
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSending(false);
    setSuccess(true);
    
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl bg-slate-800 rounded-xl shadow-2xl border border-slate-700 p-6 flex flex-col max-h-[90vh]">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wide mb-6 flex items-center">
          <svg className="w-6 h-6 mr-2 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Email Memorandum
        </h2>

        {success ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-green-900/50 rounded-full flex items-center justify-center mb-4 border border-green-500">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Email Sent Successfully!</h3>
            <p className="text-slate-400">The memorandum has been sent to {toEmail}</p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex flex-col flex-1 overflow-hidden">
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">To:</label>
                <input 
                  type="email" 
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Subject:</label>
                <input 
                  type="text" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm font-bold text-amber-400 uppercase focus:outline-none focus:border-amber-400 transition-colors"
                  required
                />
              </div>
            </div>
            
            <div className="flex-1 flex flex-col min-h-[300px]">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Body:</label>
              <textarea 
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="flex-1 w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-400 transition-colors resize-none custom-scrollbar font-mono"
                required
              />
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button 
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-semibold transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isSending || !toEmail || !subject || !body}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send Email
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
