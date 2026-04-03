import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface PrivateLenderScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivateLenderScriptModal: React.FC<PrivateLenderScriptModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const scriptRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleDownloadPdf = async () => {
    if (!scriptRef.current) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(scriptRef.current, {
        scale: 2,
        backgroundColor: '#111827', // slate-900
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save('Private_Lender_Elevator_Pitch.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
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
              disabled={isGenerating || !name || !company}
              className="w-full mt-4 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating PDF...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download PDF
                </>
              )}
            </button>
          </div>

          {/* Preview */}
          <div className="w-full lg:w-2/3 bg-slate-900 rounded-lg border border-slate-700 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full overflow-y-auto p-8" ref={scriptRef}>
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
    </div>
  );
};
