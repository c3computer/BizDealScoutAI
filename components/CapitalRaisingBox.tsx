import React, { useState, useRef, useEffect } from 'react';
import { InvestorProfile, DealOpportunity, DealAnalysis, ChatMessage, LOITerms } from '../types';
import { queryCapitalRaisingChat } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { PrivateLenderScriptModal } from './PrivateLenderScriptModal';
import { PitchDeckModal } from './PitchDeckModal';

interface CapitalRaisingBoxProps {
  profile: InvestorProfile;
  deal: DealOpportunity;
  analysis: DealAnalysis | null;
  mainChatHistory: ChatMessage[];
  loiTerms: LOITerms | null;
}

const PrintFinancialStructure: React.FC<{ markdown: string; dealTitle?: string }> = ({ markdown, dealTitle }) => {
  return (
    <div className="bg-white text-[#0D0F12] font-sans p-10 max-w-[210mm] mx-auto">
       {/* Acquisition Edge Header */}
       <div className="flex justify-between items-start border-b border-[rgba(201,153,58,0.25)] pb-6 mb-8 gap-8">
            <div className="flex items-center space-x-4 flex-shrink-0">
                <div className="flex flex-col leading-none">
                    <div className="flex items-baseline font-display text-[42px] text-[#0D0F12] tracking-tight">
                        <span>Acquisition</span>
                        <em className="text-[#C9993A] italic ml-1">Edge</em>
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.22em] text-[#8A9BB5] mt-2 font-mono">Financial Structure</span>
                </div>
            </div>
            <div className="text-right flex-1 pt-2 flex flex-col items-end">
                <div className="flex justify-end items-center mb-2">
                   <h1 className="text-2xl font-bold text-[#0D0F12] uppercase tracking-tight m-0 leading-tight font-display max-w-[400px]">
                      {dealTitle || 'Deal Structure Proposal'}
                   </h1>
                </div>
                <p className="text-[10px] text-[#8A9BB5] uppercase tracking-[0.14em] mt-2 font-mono">
                    Generated: {new Date().toLocaleDateString()}
                </p>
            </div>
        </div>

        {/* Content Body - White Paper Styles */}
        <div className="
            prose prose-slate max-w-none text-[#0D0F12]
            prose-headings:font-display prose-headings:uppercase prose-headings:tracking-wide
            prose-h1:text-[#C9993A] prose-h1:text-2xl prose-h1:mb-6 prose-h1:border-b prose-h1:border-[rgba(201,153,58,0.25)] prose-h1:pb-3 prose-h1:mt-8
            prose-h2:text-[#C9993A] prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4
            prose-h3:text-[#0D0F12] prose-h3:font-bold prose-h3:mt-6
            prose-p:leading-relaxed prose-p:mb-4 prose-p:text-justify prose-p:text-[15px] prose-p:font-sans
            prose-strong:text-[#0D0F12] prose-strong:font-bold
            prose-ul:list-disc prose-ul:pl-5 prose-ul:my-4 prose-ul:font-sans
            prose-li:text-[#0D0F12] prose-li:mb-2
            prose-blockquote:bg-[#F8F5EF] prose-blockquote:border-l-[6px] prose-blockquote:border-[#C9993A] prose-blockquote:text-[#0D0F12] prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:my-8 prose-blockquote:font-serif
            prose-table:w-full prose-table:border-collapse prose-table:my-8 prose-table:text-[13px] prose-table:font-sans
            prose-th:bg-[#0D0F12] prose-th:text-white prose-th:font-bold prose-th:uppercase prose-th:tracking-wider prose-th:p-3 prose-th:border prose-th:border-[#0D0F12]
            prose-td:p-3 prose-td:border prose-td:border-[rgba(13,15,18,0.1)] prose-td:text-[#0D0F12]
            prose-tr:nth-child(even):bg-[#F8F5EF]
        ">
            <ReactMarkdown>{markdown}</ReactMarkdown>
        </div>
    </div>
  );
};

export const CapitalRaisingBox: React.FC<CapitalRaisingBoxProps> = ({ profile, deal, analysis, mainChatHistory, loiTerms }) => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [isPitchDeckModalOpen, setIsPitchDeckModalOpen] = useState(false);
  const [financialStructureMarkdown, setFinancialStructureMarkdown] = useState<string>('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const hiddenPrintRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = { role: 'user', text: inputMessage, timestamp: Date.now() };
    setChatHistory(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await queryCapitalRaisingChat(profile, deal, analysis, chatHistory, inputMessage, mainChatHistory, loiTerms);
      const aiMessage: ChatMessage = { role: 'model', text: response, timestamp: Date.now() };
      setChatHistory(prev => [...prev, aiMessage]);
    } catch (error: any) {
      const errorMessage: ChatMessage = { role: 'model', text: `Error: ${error.message}`, timestamp: Date.now() };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handlePrint = async () => {
    let markdownToPrint = financialStructureMarkdown;
    
    if (!markdownToPrint) {
      setIsTyping(true);
      try {
        const proposalMessage = `Please provide a comprehensive Deal Structure Proposal formatted as a professional document. 
        
Please ensure the header is formatted EXACTLY like this, with each item as its own separate paragraph (separated by blank lines) so they do not run together:

**TO:** Potential Investment Partners / Private Money Lenders

**FROM:** ${profile.name || '[Your Name]'}, ${profile.entityName || '[Your Entity]'}

DATE: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

**SUBJECT:** Acquisition & Re-Capitalization Proposal: ${deal.title || deal.url}

Then proceed with the rest of the Memorandum of Investment Strategy.`;
        const response = await queryCapitalRaisingChat(profile, deal, analysis, chatHistory, proposalMessage, mainChatHistory, loiTerms);
        setFinancialStructureMarkdown(response);
        markdownToPrint = response;
        
        // Also add to chat history so the user sees it
        const userMsg: ChatMessage = { role: 'user', text: proposalMessage, timestamp: Date.now() };
        const aiMsg: ChatMessage = { role: 'model', text: response, timestamp: Date.now() };
        setChatHistory(prev => [...prev, userMsg, aiMsg]);
      } catch (error: any) {
        console.error("Error generating proposal for print:", error);
        alert("Failed to generate proposal for printing.");
        setIsTyping(false);
        return;
      }
      setIsTyping(false);
    }

    // Force the date in the markdown to be today's date just in case
    const todayStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    markdownToPrint = markdownToPrint.replace(/\*\*DATE:\*\*.*?(?=\n|$)/g, `DATE: ${todayStr}`);
    markdownToPrint = markdownToPrint.replace(/DATE:.*?(?=\n|$)/g, `DATE: ${todayStr}`);
    setFinancialStructureMarkdown(markdownToPrint);

    // Wait for state to update and render
    setTimeout(() => {
      if (!hiddenPrintRef.current) return;

      const contentHtml = hiddenPrintRef.current.innerHTML;
      const win = window.open('', '_blank', 'height=900,width=850,scrollbars=yes');
      if (!win) {
        alert("Pop-up blocked! Please allow pop-ups to print the report.");
        return;
      }

      win.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Deal Structure Proposal | Acquisition Edge</title>
            <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
            <script>
              tailwind.config = {
                  theme: {
                      extend: {
                          fontFamily: {
                              sans: ['"DM Sans"', 'sans-serif'],
                              display: ['"DM Serif Display"', 'serif'],
                              mono: ['"Space Mono"', 'monospace'],
                          }
                      }
                  }
              }
            </script>
            <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
            <style>
              body { background: white; margin: 0; padding: 0; }
              #print-container { padding: 40px; display: flex; justify-content: center; background: #f1f5f9; min-height: 100vh; }
              #print-content { background: white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); width: 100%; max-width: 210mm; }
              @media print {
                body { background: white; }
                #print-container { padding: 0; background: white; display: block; }
                #print-content { box-shadow: none; max-width: none; }
                @page { margin: 0; }
                body { padding: 15mm; }
                #custom-footer {
                  position: fixed;
                  bottom: 10mm;
                  left: 15mm;
                  font-family: sans-serif;
                  font-size: 10px;
                  color: #8A9BB5;
                  display: block !important;
                }
              }
            </style>
          </head>
          <body>
            <div id="custom-footer" style="display: none;">Capital Raising & Deal Terms</div>
            <div id="print-container">
                <div id="print-content">
                    ${contentHtml}
                </div>
            </div>
            <script>
              setTimeout(() => {
                window.print();
                window.close();
              }, 1000);
            </script>
          </body>
        </html>
      `);
      win.document.close();
    }, 100);
  };

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl overflow-hidden relative group flex flex-col mt-6">
      {/* Hidden Render for Print Generation */}
      <div style={{ display: 'none' }}>
         <div ref={hiddenPrintRef}>
            <PrintFinancialStructure markdown={financialStructureMarkdown} dealTitle={deal.title || deal.url} />
         </div>
      </div>

      <div className="absolute top-0 left-0 w-1 h-full bg-slate-600 group-hover:bg-amber-400 transition-colors"></div>
      <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
        <h2 className="text-lg font-display font-bold text-white uppercase flex items-center">
          <svg className="w-5 h-5 mr-2 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Capital Raising & Deal Terms
        </h2>
      </div>

      <div className="p-4 flex flex-col gap-6">
        {/* Top: AI Chat */}
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
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.text
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
        </div>

        {/* Middle: Buttons */}
        <div className="flex flex-col items-center space-y-4">
          <div className="flex flex-row w-full max-w-md justify-center space-x-4">
            <button
              onClick={handlePrint}
              disabled={isTyping}
              className={`flex-1 py-2 text-sm uppercase font-display font-bold tracking-widest text-slate-900 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 rounded flex items-center justify-center space-x-2
                  ${isTyping ? 'bg-slate-600' : 'bg-green-400 hover:bg-green-300 shadow-[0_0_15px_rgba(74,222,128,0.3)]'}
              `}
            >
              {isTyping ? (
                <span>Generating PDF...</span>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span>Print</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsPitchDeckModalOpen(true)}
              disabled={isTyping}
              className={`flex-1 py-2 text-sm uppercase font-display font-bold tracking-widest text-slate-900 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 rounded flex items-center justify-center space-x-2
                  ${isTyping ? 'bg-slate-600' : 'bg-green-400 hover:bg-green-300 shadow-[0_0_15px_rgba(74,222,128,0.3)]'}
              `}
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Pitch Deck</span>
            </button>
          </div>

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

        {/* Bottom: The 4 Stages */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2 text-center">The 4 Stages of Profitability</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
      </div>

      <PrivateLenderScriptModal
        isOpen={isScriptModalOpen}
        onClose={() => setIsScriptModalOpen(false)}
      />
      <PitchDeckModal 
        isOpen={isPitchDeckModalOpen}
        onClose={() => setIsPitchDeckModalOpen(false)}
        deal={deal}
        loi={loiTerms}
        profile={profile}
        financialStructureMarkdown={financialStructureMarkdown}
      />
    </div>
  );
};
