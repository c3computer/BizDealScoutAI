import React, { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { AnalysisResult, DealOpportunity } from '../types';

interface ResultViewerProps {
  result: AnalysisResult | null;
  loading: boolean;
  loadingMessage?: string;
  dealTitle?: string;
  deal?: DealOpportunity;
  showReferences?: boolean;
}

// --- PRINT DOCUMENT COMPONENT ---
// This renders the "Paper" version of the deal memo
export const PrintDocument: React.FC<{ result: AnalysisResult; dealTitle?: string; deal?: DealOpportunity; showReferences?: boolean }> = ({ result, dealTitle, deal, showReferences }) => {
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
                    <span className="text-[10px] uppercase tracking-[0.22em] text-[#8A9BB5] mt-2 font-mono">Investment Memo</span>
                </div>
            </div>
            <div className="text-right flex-1 pt-2 flex flex-col items-end">
                <div className="flex justify-end items-center mb-2">
                   {result.initialScore !== undefined && result.score !== undefined ? (
                     <div className="flex items-center mr-4 bg-[#F8F5EF] rounded-full px-4 py-2 border border-[rgba(13,15,18,0.08)]">
                        <div className="flex flex-col items-center mr-3 opacity-60">
                            <span className="text-sm font-bold line-through decoration-[#8A9BB5]">{result.initialScore}</span>
                            <span className="text-[8px] uppercase font-mono tracking-widest">Stage 1</span>
                        </div>
                        <span className="text-[#8A9BB5] mr-3">→</span>
                        <div className="flex flex-col items-center">
                            <span className="text-xl font-bold">{result.score}</span>
                            <span className="text-[8px] uppercase text-[#C9993A] font-bold font-mono tracking-widest">Stage 2</span>
                        </div>
                     </div>
                   ) : result.score !== undefined && (
                     <div className="border border-[#0D0F12] rounded-full w-12 h-12 flex items-center justify-center mr-4">
                       <span className="text-xl font-bold">{result.score}</span>
                     </div>
                   )}
                   <h1 className="text-2xl font-bold text-[#0D0F12] uppercase tracking-tight m-0 leading-tight font-display max-w-[400px]">
                      {dealTitle || 'Opportunity Analysis'}
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
            prose-ul:list-disc prose-ul:pl-5 prose-ul:my-4
            prose-li:text-[#0D0F12] prose-li:mb-2 prose-li:font-sans
            
            /* Link Styles */
            prose-a:text-[#C9993A] prose-a:font-bold prose-a:no-underline hover:prose-a:underline
            
            /* Callout / Blockquote Styles */
            prose-blockquote:bg-[#F8F5EF] 
            prose-blockquote:border-l-[4px] 
            prose-blockquote:border-[#C9993A] 
            prose-blockquote:text-[#0D0F12] 
            prose-blockquote:py-4 
            prose-blockquote:px-6 
            prose-blockquote:not-italic 
            prose-blockquote:my-8 
            
            /* Table Styles */
            prose-table:w-full prose-table:border-collapse prose-table:my-8 prose-table:text-sm prose-table:border prose-table:border-[rgba(13,15,18,0.08)]
            prose-th:bg-[#F8F5EF] prose-th:text-[#0D0F12] prose-th:font-bold prose-th:uppercase prose-th:text-xs prose-th:tracking-wider prose-th:p-4 prose-th:border prose-th:border-[rgba(13,15,18,0.08)] prose-th:font-mono
            prose-td:p-3 prose-td:border prose-td:border-[rgba(13,15,18,0.08)] prose-td:text-[#0D0F12]
            prose-tr:nth-child(even):bg-[#F8F5EF]
        ">
            <ReactMarkdown>{result.markdown}</ReactMarkdown>
        </div>

        {/* References Section */}
        {deal && showReferences && (
          <div className="mt-12 pt-8 border-t border-[rgba(201,153,58,0.25)]">
            <h3 className="text-[#0D0F12] font-display uppercase tracking-wide mb-4">References & Citations</h3>
            <div className="space-y-3 text-sm text-[#0D0F12] font-sans">
              {deal.listingUrl && (
                <p>
                  <span className="font-bold">Listing URL:</span>{' '}
                  <a href={deal.listingUrl} target="_blank" rel="noopener noreferrer" className="text-[#C9993A] hover:underline break-all">
                    {deal.listingUrl}
                  </a>
                </p>
              )}
              <div>
                <span className="font-bold">Documents Used:</span>{' '}
                {deal.files && deal.files.length > 0 ? (
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    {deal.files.map((file, idx) => (
                      <li key={idx}>{file.name}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="italic text-[#8A9BB5]">Only the listing was used to make the deal scoring memorandum.</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-20 border-t border-[rgba(201,153,58,0.25)] pt-8 flex justify-between items-center text-[9px] text-[#8A9BB5] uppercase tracking-[0.14em] font-mono">
            <span>Confidential • Internal Circulation Only</span>
            <span>Powered by Acquisition Edge & DealScout.it</span>
        </div>
    </div>
  );
};

export const ResultViewer: React.FC<ResultViewerProps> = ({ result, loading, loadingMessage, dealTitle, deal, showReferences }) => {
  const hiddenPrintRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!result || !hiddenPrintRef.current) return;

    // 1. Get the HTML from the hidden div
    const contentHtml = hiddenPrintRef.current.innerHTML;

    // 2. Open a new window
    const win = window.open('', '_blank', 'height=900,width=850,scrollbars=yes');
    if (!win) {
      alert("Pop-up blocked! Please allow pop-ups to print the report.");
      return;
    }

    // 3. Write the HTML structure
    // CRITICAL: Include typography plugin in the Tailwind script
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${dealTitle || 'Deal Memo'} | Acquisition Edge</title>
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
            /* Center the document in the window for preview */
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

    // 4. Trigger Print after a short delay to allow styles to parse
    setTimeout(() => {
        win.focus();
        win.print();
    }, 1500);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400 border-green-500 shadow-[0_0_15px_rgba(74,222,128,0.3)]';
    if (score >= 60) return 'text-amber-400 border-amber-500 shadow-[0_0_15px_rgba(251,191,36,0.3)]';
    return 'text-red-400 border-red-500 shadow-[0_0_15px_rgba(248,113,113,0.3)]';
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 min-h-[400px]">
        <div className="w-12 h-12 border-4 border-slate-700 border-t-amber-400 rounded-full animate-spin"></div>
        <p className="font-display tracking-widest uppercase animate-pulse text-amber-500 text-sm">
          {loadingMessage || "Processing..."}
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50 min-h-[400px]">
        <svg className="w-16 h-16 mb-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="font-display uppercase tracking-widest">Awaiting Deal Data</p>
      </div>
    );
  }

  return (
    <div className="relative">
      
      {/* Hidden Render for Print Generation */}
      <div style={{ display: 'none' }}>
         <div ref={hiddenPrintRef}>
            <PrintDocument result={result} dealTitle={dealTitle} deal={deal} showReferences={showReferences} />
         </div>
      </div>

      {/* Save/Print Button */}
      <div className="absolute top-0 right-0 z-10">
        <button 
          onClick={handlePrint}
          className="flex items-center space-x-2 bg-amber-400 hover:bg-amber-300 text-slate-900 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all"
        >
           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
           </svg>
           <span>Download / Print PDF</span>
        </button>
      </div>

      {/* --- SCREEN VIEW (Dark Mode, Dashboard Style) --- */}
      <div className="prose prose-invert prose-slate max-w-none pt-8 px-2 pb-4 bg-[#1e293b]">
        {/* Title & Score */}
        <div className="mb-6 border-b border-slate-700 pb-4 flex justify-between items-start">
             <div className="flex items-start space-x-4">
                 <div>
                     <h1 className="text-2xl font-display font-bold text-amber-400 uppercase m-0">
                       {dealTitle || 'Deal Analysis'}
                     </h1>
                     <p className="text-slate-400 text-xs uppercase tracking-widest mt-1">
                       Generated by Acquisition Edge • {new Date().toLocaleDateString()}
                     </p>
                 </div>
             </div>
             
             {/* Score Display (Single or Stage 2 Evolution) */}
             <div className="flex items-center">
                 {result.initialScore !== undefined && result.score !== undefined ? (
                    <div className="flex items-center bg-slate-800 rounded-full p-2 border border-slate-700">
                        <div className="flex flex-col items-center px-2 opacity-50">
                             <span className="text-xl font-bold line-through decoration-red-500 decoration-2 text-slate-400">{result.initialScore}</span>
                             <span className="text-[7px] uppercase tracking-wider font-bold">Stage 1</span>
                        </div>
                        <div className="text-slate-500 mx-1">
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                           </svg>
                        </div>
                        <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-full border-2 ${getScoreColor(result.score)} bg-slate-900 mx-1`}>
                           <span className="text-2xl font-display font-bold leading-none">{result.score}</span>
                           <span className="text-[7px] uppercase font-bold tracking-widest opacity-80 mt-1">Final</span>
                        </div>
                    </div>
                 ) : result.score !== undefined && (
                    <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-full border-4 ${getScoreColor(result.score)} bg-slate-900`}>
                        <span className="text-3xl font-display font-bold leading-none">{result.score}</span>
                        <span className="text-[9px] uppercase font-bold tracking-widest opacity-80 mt-1">Score</span>
                    </div>
                 )}
             </div>
        </div>

        {/* Markdown Content (Screen) */}
        <div className="
          prose-headings:font-display prose-headings:uppercase prose-headings:text-slate-100
          prose-h1:text-xl prose-h1:text-amber-400 prose-h1:border-b prose-h1:border-slate-700 prose-h1:pb-2
          prose-h2:text-lg prose-h2:text-amber-400 prose-h2:mt-6
          prose-strong:text-amber-400
          prose-p:text-slate-300 prose-p:leading-relaxed
          
          /* Link Styles (Screen) */
          prose-a:text-amber-400 prose-a:font-bold hover:prose-a:text-amber-300 prose-a:transition-colors prose-a:underline

          prose-li:text-slate-300
          prose-blockquote:border-l-4 prose-blockquote:border-amber-400 prose-blockquote:bg-slate-900 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:not-italic
          prose-table:border-collapse prose-table:w-full prose-table:my-6
          prose-th:bg-slate-900 prose-th:text-amber-400 prose-th:p-3 prose-th:text-left prose-th:uppercase prose-th:text-xs prose-th:tracking-wider prose-th:border prose-th:border-slate-700
          prose-td:p-3 prose-td:border prose-td:border-slate-700 prose-td:text-sm
          ">
          <ReactMarkdown>{result.markdown}</ReactMarkdown>
        </div>

        {/* References Section (Screen) */}
        {deal && showReferences && (
          <div className="mt-8 pt-6 border-t border-slate-700 avoid-break">
            <h4 className="font-display text-xs uppercase text-slate-500 mb-3 tracking-widest">
              References & Citations
            </h4>
            <div className="space-y-3 text-sm text-slate-300 bg-slate-900/50 p-4 rounded border border-slate-800">
              {deal.listingUrl && (
                <p>
                  <span className="font-bold text-slate-400">Listing URL:</span>{' '}
                  <a href={deal.listingUrl} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 hover:underline break-all">
                    {deal.listingUrl}
                  </a>
                </p>
              )}
              <div>
                <span className="font-bold text-slate-400">Documents Used:</span>{' '}
                {deal.files && deal.files.length > 0 ? (
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    {deal.files.map((file, idx) => (
                      <li key={idx} className="text-slate-300">{file.name}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="italic text-slate-500">Only the listing was used to make the deal scoring memorandum.</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Grounding Sources (Screen) */}
        {result.groundingUrls.length > 0 && (
          <div className="mt-8 pt-6 border-t border-slate-700 avoid-break">
            <h4 className="font-display text-xs uppercase text-slate-500 mb-3 tracking-widest">
              Verified Sources
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {result.groundingUrls.map((source, idx) => (
                <a
                  key={idx}
                  href={source.uri}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center p-3 rounded bg-slate-900 border border-slate-800 hover:border-amber-400/50 hover:bg-slate-850 transition-all group no-underline"
                >
                  <span className="text-amber-400 mr-2 opacity-50 group-hover:opacity-100">↗</span>
                  <span className="text-xs text-slate-400 group-hover:text-slate-200 truncate">
                    {source.title}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};