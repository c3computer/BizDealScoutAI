import React, { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { AnalysisResult, DealOpportunity } from '../types';
import { PrintDocument } from './ResultViewer';

interface ChatPresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AnalysisResult | null;
  dealTitle: string;
  deal: DealOpportunity;
}

export const ChatPresentationModal: React.FC<ChatPresentationModalProps> = ({ isOpen, onClose, result, dealTitle, deal }) => {
  const hiddenPrintRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !result) return null;

  const handlePrint = () => {
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
          <title>Chat Presentation | Acquisition Edge</title>
          <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
          <script>
            tailwind.config = {
                theme: {
                    extend: {
                        fontFamily: {
                            sans: ['Inter', 'sans-serif'],
                            display: ['Oswald', 'sans-serif'],
                        }
                    }
                }
            }
          </script>
          <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;700&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
          <style>
            body { background: white; margin: 0; padding: 0; }
            #print-container { padding: 40px; display: flex; justify-content: center; background: #f1f5f9; min-height: 100vh; }
            #print-content { background: white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); width: 100%; max-width: 210mm; }
            
            @media print {
              body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white !important; }
              #print-container { padding: 0; background: white; display: block; }
              #print-content { box-shadow: none; max-width: none; width: 100%; }
              @page { margin: 10mm; size: auto; }
            }
          </style>
        </head>
        <body>
          <div id="print-container">
             <div id="print-content">
                ${contentHtml}
             </div>
          </div>
        </body>
      </html>
    `);
    win.document.close();

    setTimeout(() => {
        win.focus();
        win.print();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl bg-slate-900 rounded-xl shadow-2xl border border-slate-700 flex flex-col max-h-[90vh]">
        
        {/* Hidden Render for Print Generation */}
        <div style={{ display: 'none' }}>
           <div ref={hiddenPrintRef}>
              <PrintDocument result={result} dealTitle={dealTitle} deal={deal} showReferences={false} />
           </div>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wider">
            Chat Presentation
          </h2>
          <div className="flex items-center space-x-4">
            <button 
              onClick={handlePrint}
              className="flex items-center space-x-2 bg-amber-400 hover:bg-amber-300 text-slate-900 px-4 py-2 rounded text-sm font-bold uppercase tracking-wider transition-all"
            >
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
               </svg>
               <span>Download / Print PDF</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#1e293b]">
            <div className="prose prose-invert prose-slate max-w-none text-slate-300
                prose-headings:font-sans prose-headings:font-bold prose-headings:uppercase prose-headings:tracking-wide
                prose-h1:text-cyan-400 prose-h1:text-2xl prose-h1:mb-6 prose-h1:border-b prose-h1:border-slate-700 prose-h1:pb-3
                prose-h2:text-cyan-400 prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4
                prose-h3:text-slate-200 prose-h3:font-bold prose-h3:mt-6
                prose-p:leading-relaxed prose-p:mb-4 prose-p:text-justify prose-p:text-[15px]
                prose-strong:text-white prose-strong:font-bold
                prose-ul:list-disc prose-ul:pl-5 prose-ul:my-4
                prose-li:text-slate-300 prose-li:mb-2
                prose-a:text-cyan-400 prose-a:font-bold prose-a:no-underline hover:prose-a:underline
                prose-blockquote:bg-slate-800 prose-blockquote:border-l-[6px] prose-blockquote:border-cyan-500 prose-blockquote:text-slate-300 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:my-8
                prose-table:w-full prose-table:border-collapse prose-table:my-8 prose-table:text-sm prose-table:border prose-table:border-slate-700
                prose-th:bg-slate-800 prose-th:text-slate-200 prose-th:font-bold prose-th:uppercase prose-th:text-xs prose-th:tracking-wider prose-th:p-4 prose-th:border prose-th:border-slate-700
                prose-td:p-3 prose-td:border prose-td:border-slate-700 prose-td:text-slate-300
                prose-tr:nth-child(even):bg-slate-800/50
            ">
                <ReactMarkdown>{result.markdown}</ReactMarkdown>
            </div>
        </div>
      </div>
    </div>
  );
};
