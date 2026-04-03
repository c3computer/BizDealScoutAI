import React, { useState, useRef } from 'react';

interface PrivateLenderScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrintPrivateLenderScript: React.FC<{ name: string; company: string }> = ({ name, company }) => {
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
                    <span className="text-[10px] uppercase tracking-[0.22em] text-[#8A9BB5] mt-2 font-mono">Private Lender Script</span>
                </div>
            </div>
            <div className="text-right flex-1 pt-2 flex flex-col items-end">
                <div className="flex justify-end items-center mb-2">
                   <h1 className="text-2xl font-bold text-[#0D0F12] uppercase tracking-tight m-0 leading-tight font-display max-w-[400px]">
                      Elevator Pitch
                   </h1>
                </div>
                <p className="text-[10px] text-[#8A9BB5] uppercase tracking-[0.14em] mt-2 font-mono">
                    Generated: {new Date().toLocaleDateString()}
                </p>
            </div>
        </div>

        {/* Content Body - White Paper Styles */}
        <div className="prose prose-slate max-w-none text-[#0D0F12] text-[15px] leading-relaxed text-justify font-sans">
            <p className="mb-6">
              Hi, my name is <strong>{name || '[Name]'}</strong> with <strong>{company || '[Company]'}</strong>. We are a business acquisition firm that specializes in identifying and acquiring undervalued, cash-flowing small businesses — and helping owners transition out while protecting the legacy they've built.
            </p>
            <p className="mb-6">
              The strength of our model comes from the rigorous analysis, deal systems, and acquisition frameworks we've built through <strong>{company || '[Company]'}</strong> — our AI-powered platform that evaluates every deal across financials, operations, and risk before we ever make an offer. Our goal is to close <strong>targeted acquisitions</strong> this year with precision, not guesswork.
            </p>
            <p className="mb-6">
              We're proud to offer our private lending partners a <strong>strong, predictable rate of return</strong> — secured against real business cash flow and assets. We prioritize long-term relationships with our lenders and make it our mission to give them a dependable, completely hands-off way to grow their wealth.
            </p>
            <p className="mb-6">
              If you're open to learning more about how you could benefit from partnering with us, I'd love to take you to lunch or dinner — my treat — to walk you through our lending structure in detail and see if it's a fit for both of us. I also have a deal overview package from <strong>{company || '[Company]'}</strong> you can review in the meantime. How does that sound?
            </p>
        </div>
    </div>
  );
};

export const PrivateLenderScriptModal: React.FC<PrivateLenderScriptModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const hiddenPrintRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleDownloadPdf = () => {
    if (!hiddenPrintRef.current) return;

    const contentHtml = hiddenPrintRef.current.innerHTML;
    const win = window.open('', '_blank', 'height=900,width=850,scrollbars=yes');
    if (!win) {
      alert("Pop-up blocked! Please allow pop-ups to print the report.");
      return;
    }

    win.document.write(`
      <html>
        <head>
          <title>Private Lender Script</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <script>
            tailwind.config = {
              theme: {
                extend: {
                  fontFamily: {
                    sans: ['Inter', 'sans-serif'],
                    display: ['Space Grotesk', 'sans-serif'],
                    mono: ['JetBrains Mono', 'monospace'],
                  }
                }
              }
            }
          </script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&family=Space+Grotesk:wght@500;700&display=swap');
            body { 
              background-color: #ffffff;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            @media print {
              body { padding: 0; margin: 0; }
              @page { margin: 15mm; size: auto; }
            }
          </style>
        </head>
        <body>
          ${contentHtml}
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
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/80 sticky top-0 z-10">
          <h2 className="text-xl font-display font-bold text-white flex items-center">
            <svg className="w-5 h-5 mr-2 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Private Lender Script Generator
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 flex flex-col lg:flex-row gap-6">
          {/* Controls */}
          <div className="w-full lg:w-1/3 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Christopher Carwise"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Company Name</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Acquisition Edge"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
            
            <button
              onClick={handleDownloadPdf}
              disabled={!name || !company}
              className="w-full mt-4 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </button>
          </div>

          {/* Preview */}
          <div className="w-full lg:w-2/3 bg-slate-900 rounded-lg border border-slate-700 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full overflow-y-auto p-8">
              <div className="text-center mb-10">
                <h1 className="text-3xl font-display font-bold text-white mb-2">Private Lender Elevator Pitch</h1>
                <p className="text-sm tracking-widest text-slate-400 uppercase">Capital Raising Script — Business Acquisitions</p>
              </div>

              <div className="space-y-8 text-slate-300 text-lg leading-relaxed font-light italic">
                <div className="pl-6 border-l-2 border-amber-500">
                  <p>
                    Hi, my name is <span className="text-amber-400 font-medium not-italic">{name || '[Name]'}</span> with <span className="text-amber-400 font-medium not-italic">{company || '[Company]'}</span>. We are a business acquisition firm that specializes in identifying and acquiring undervalued, cash-flowing small businesses — and helping owners transition out while protecting the legacy they've built.
                  </p>
                </div>

                <div className="pl-6 border-l-2 border-amber-500">
                  <p>
                    The strength of our model comes from the rigorous analysis, deal systems, and acquisition frameworks we've built through <span className="text-amber-400 font-medium not-italic">{company || '[Company]'}</span> — our AI-powered platform that evaluates every deal across financials, operations, and risk before we ever make an offer. Our goal is to close <span className="text-amber-400 font-medium not-italic">targeted acquisitions</span> this year with precision, not guesswork.
                  </p>
                </div>

                <div className="pl-6 border-l-2 border-amber-500">
                  <p>
                    We're proud to offer our private lending partners a <span className="text-amber-400 font-medium not-italic">strong, predictable rate of return</span> — secured against real business cash flow and assets. We prioritize long-term relationships with our lenders and make it our mission to give them a dependable, completely hands-off way to grow their wealth.
                  </p>
                </div>

                <div className="pl-6 border-l-2 border-amber-500">
                  <p>
                    If you're open to learning more about how you could benefit from partnering with us, I'd love to take you to lunch or dinner — my treat — to walk you through our lending structure in detail and see if it's a fit for both of us. I also have a deal overview package from <span className="text-amber-400 font-medium not-italic">{company || '[Company]'}</span> you can review in the meantime. How does that sound?
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Render for Print Generation */}
      <div style={{ display: 'none' }}>
         <div ref={hiddenPrintRef}>
            <PrintPrivateLenderScript name={name} company={company} />
         </div>
      </div>
    </div>
  );
};
