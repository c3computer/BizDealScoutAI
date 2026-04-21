import React, { useState } from 'react';
import { InvestorProfile, DealOpportunity, LOITerms } from '../types';
import { generateDealProposalExcel, generateDealProposalDocx } from '../services/pitchDeckGenerator';

interface PitchDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: DealOpportunity;
  loi: LOITerms | null;
  profile: InvestorProfile;
  financialStructureMarkdown?: string;
}

export const PitchDeckModal: React.FC<PitchDeckModalProps> = ({ 
  isOpen, 
  onClose,
  deal,
  loi,
  profile,
  financialStructureMarkdown
}) => {
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

  const handleDownloadExcel = async () => {
    setIsGeneratingExcel(true);
    try {
      const blob = await generateDealProposalExcel(deal, loi, profile, financialStructureMarkdown);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${deal.name ? deal.name.replace(/\D/g, '') : 'Deals'}_Financial_Model.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      console.error(e);
      alert('Error generating Excel file');
    } finally {
      setIsGeneratingExcel(false);
    }
  };

  const handleDownloadDocx = async () => {
    setIsGeneratingDocx(true);
    try {
      const blob = await generateDealProposalDocx(deal, loi, profile, financialStructureMarkdown);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${deal.name ? deal.name.replace(/\D/g, '') : 'Deals'}_Investment_Proposal.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      console.error(e);
      alert('Error generating Word document');
    } finally {
      setIsGeneratingDocx(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl bg-slate-800 rounded-xl shadow-2xl border border-slate-700 p-6 flex flex-col max-h-[90vh]">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wide mb-6 flex items-center border-b border-slate-700 pb-4">
          <svg className="w-6 h-6 mr-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Private Capital Pitch Deck
        </h2>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 text-slate-300">
             <div className="flex flex-col items-center justify-center h-full py-12">
               <h3 className="text-xl font-bold text-white mb-4 text-center">Ready to Generate Financial Documentation</h3>
               <p className="text-center max-w-md text-slate-400 mb-8">
                 Your customized financial models and Word proposal narratives are ready. Download them below using the configuration rules applied from your Deal Profile.
               </p>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl text-center">
                  <div className="bg-slate-900 p-6 rounded-lg border border-slate-700 flex flex-col items-center">
                    <svg className="w-12 h-12 text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h4 className="text-white font-bold mb-2">Deal Financials (Excel)</h4>
                    <p className="text-sm text-slate-400 mb-6">4-Sheet model with cash flow analysis and exit waterfall.</p>
                    <button 
                      onClick={handleDownloadExcel}
                      disabled={isGeneratingExcel}
                      className="w-full px-4 py-2 mt-auto bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded font-bold transition-colors flex items-center justify-center"
                    >
                      {isGeneratingExcel ? 'Generating...' : 'Download .xlsx'}
                    </button>
                  </div>
                  
                  <div className="bg-slate-900 p-6 rounded-lg border border-slate-700 flex flex-col items-center">
                    <svg className="w-12 h-12 text-blue-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h4 className="text-white font-bold mb-2">Investment Proposal (Word)</h4>
                    <p className="text-sm text-slate-400 mb-6">4-page narrative with deal structure and strategy.</p>
                    <button 
                      onClick={handleDownloadDocx}
                      disabled={isGeneratingDocx}
                      className="w-full px-4 py-2 mt-auto bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded font-bold transition-colors flex items-center justify-center"
                    >
                      {isGeneratingDocx ? 'Generating...' : 'Download .docx'}
                    </button>
                  </div>
               </div>
             </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
