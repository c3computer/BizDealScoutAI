import React, { useState, useRef, useEffect } from 'react';
import { InvestorProfile, DealOpportunity, DealAnalysis, ChatMessage } from '../types';
import { queryCapitalRaisingChat } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { PrivateLenderScriptModal } from './PrivateLenderScriptModal';

interface CapitalRaisingBoxProps {
  profile: InvestorProfile;
  deal: DealOpportunity;
  analysis: DealAnalysis | null;
}

export const CapitalRaisingBox: React.FC<CapitalRaisingBoxProps> = ({ profile, deal, analysis }) => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: inputMessage };
    setChatHistory(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await queryCapitalRaisingChat(profile, deal, analysis, chatHistory, inputMessage);
      const aiMessage: ChatMessage = { role: 'model', content: response };
      setChatHistory(prev => [...prev, aiMessage]);
    } catch (error: any) {
      const errorMessage: ChatMessage = { role: 'model', content: `Error: ${error.message}` };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl overflow-hidden relative group flex flex-col mt-6">
      <div className="absolute top-0 left-0 w-1 h-full bg-slate-600 group-hover:bg-amber-400 transition-colors"></div>
      <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
        <h2 className="text-lg font-display font-bold text-white uppercase flex items-center">
          <svg className="w-5 h-5 mr-2 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Capital Raising & Deal Terms
        </h2>
      </div>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: The 4 Stages */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2 text-center">The 4 Stages of Profitability</h3>
          
          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-start mb-2">
              <div className="bg-amber-500/20 text-amber-400 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</div>
              <div>
                <h4 className="text-white font-medium text-sm">Acquisition</h4>
                <p className="text-xs text-slate-400 mt-1">e.g., 2% acquisition fee charged at deal inception, Gator lending for EMD, short-term PMLs.</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-start mb-2">
              <div className="bg-amber-500/20 text-amber-400 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</div>
              <div>
                <h4 className="text-white font-medium text-sm">Monthly Profit</h4>
                <p className="text-xs text-slate-400 mt-1">The monthly profit spread, cash flow distributions, and equity splits with private money lenders.</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-start mb-2">
              <div className="bg-amber-500/20 text-amber-400 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</div>
              <div>
                <h4 className="text-white font-medium text-sm">Refinance</h4>
                <p className="text-xs text-slate-400 mt-1">Paying off short-term PMLs or seller finance balloons using Commercial loans, SBA 7a, DSCR, etc.</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
            <div className="flex items-start">
              <div className="bg-amber-500/20 text-amber-400 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</div>
              <div>
                <h4 className="text-white font-medium text-sm">Exit Planning / Sale</h4>
                <p className="text-xs text-slate-400 mt-1">Final equity payout, capital gains distribution, and selling the asset.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Chat */}
        <div className="flex flex-col h-[500px] bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
          <div className="bg-slate-800 p-3 border-b border-slate-700">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Capital Raising Strategist AI</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatHistory.length === 0 && (
              <div className="text-center text-slate-500 text-sm mt-10">
                <p>Ask the AI to structure the capital stack based on the seller's offer.</p>
                <p className="mt-2 text-xs">Example: "How should I structure the 2% acquisition fee and PML returns for this deal?"</p>
              </div>
            )}
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg p-3 text-sm ${msg.role === 'user' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-200 border border-slate-700'}`}>
                  {msg.role === 'model' ? (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-slate-400 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-3 bg-slate-800 border-t border-slate-700">
            <div className="relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about structuring capital..."
                className="w-full bg-slate-900 border border-slate-600 rounded-full pl-4 pr-12 py-2 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={isTyping || !inputMessage.trim()}
                className="absolute right-1 top-1 bottom-1 bg-amber-600 hover:bg-amber-500 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </form>
          
          <div className="p-3 bg-slate-800 border-t border-slate-700 flex justify-center">
            <button
              onClick={() => setIsScriptModalOpen(true)}
              className="text-amber-400 hover:text-amber-300 text-sm font-medium flex items-center transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generate Private Lender Script (PDF)
            </button>
          </div>
        </div>
      </div>

      <PrivateLenderScriptModal
        isOpen={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
      />
    </div>
  );
};
