import React, { useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { openSignService } from '../services/openSignService';
import { LOITerms } from '../types';

interface LOIData {
  logo?: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  sellerName: string;
  sellerEmail: string;
  brokerName: string;
  brokerEmail: string;
}

interface LOIWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: LOIData;
  loiTerms: LOITerms | null;
}

export const LOIWalkthroughModal: React.FC<LOIWalkthroughModalProps> = ({ isOpen, onClose, initialData, loiTerms }) => {
  const [step, setStep] = useState(1);
  const [buyerName, setBuyerName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [purchasePrice, setPurchasePrice] = useState(loiTerms?.purchasePrice || '');
  const [earnestMoney, setEarnestMoney] = useState(loiTerms?.earnestMoney || '');
  const [dueDiligenceDays, setDueDiligenceDays] = useState(loiTerms?.dueDiligenceDays || '30');
  const [closingDate, setClosingDate] = useState(loiTerms?.closingDate || '');
  const [trainingPeriod, setTrainingPeriod] = useState(loiTerms?.trainingPeriod || '14 days');
  const [nonCompetePeriod, setNonCompetePeriod] = useState(loiTerms?.nonCompetePeriod || '2 years');

  useEffect(() => {
    if (loiTerms) {
      setPurchasePrice(loiTerms.purchasePrice || '');
      setEarnestMoney(loiTerms.earnestMoney || '');
      setDueDiligenceDays(loiTerms.dueDiligenceDays || '30');
      setClosingDate(loiTerms.closingDate || '');
      setTrainingPeriod(loiTerms.trainingPeriod || '14 days');
      setNonCompetePeriod(loiTerms.nonCompetePeriod || '2 years');
    }
  }, [loiTerms]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => s - 1);

  const generatePDF = async (): Promise<File | null> => {
    if (!printRef.current) return null;
    
    try {
      // Temporarily make it visible for html2canvas
      printRef.current.style.display = 'block';
      
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      printRef.current.style.display = 'none';

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      
      const pdfBlob = pdf.output('blob');
      return new File([pdfBlob], `LOI_${initialData.sellerName.replace(/\s+/g, '_')}.pdf`, { type: 'application/pdf' });
    } catch (error) {
      console.error("Error generating PDF:", error);
      return null;
    }
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const file = await generatePDF();
      if (file) {
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        setErrorMessage("Failed to generate PDF.");
      }
    } catch (error) {
      setErrorMessage("An error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendViaOpenSign = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const file = await generatePDF();
      if (!file) {
        setErrorMessage("Failed to generate PDF.");
        setIsGenerating(false);
        return;
      }

      const signers = [];
      if (initialData.brokerName && initialData.brokerEmail) {
        signers.push({ name: initialData.brokerName, email: initialData.brokerEmail });
      }
      if (initialData.sellerName && initialData.sellerEmail) {
        signers.push({ name: initialData.sellerName, email: initialData.sellerEmail });
      }

      if (signers.length === 0) {
        setErrorMessage("No valid signers (Broker or Seller) provided with email addresses.");
        setIsGenerating(false);
        return;
      }

      const result = await openSignService.sendDocumentForSignature({
        file,
        title: `Letter of Intent - ${initialData.sellerName}`,
        signers
      });

      if (result.success) {
        setSuccessMessage(result.message);
      } else {
        setErrorMessage(result.message);
      }
    } catch (error) {
      setErrorMessage("An unexpected error occurred while sending.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
          <h2 className="text-xl font-display font-bold text-white uppercase tracking-wider">
            LOI Walkthrough
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {successMessage && (
            <div className="mb-4 bg-emerald-900/50 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded text-sm">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="mb-4 bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-3 rounded text-sm">
              {errorMessage}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-lg font-bold text-amber-400 mb-4">Step 1: Basic Information</h3>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Buyer Name / Entity</label>
                <input type="text" value={buyerName} onChange={e => setBuyerName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:border-amber-400 focus:outline-none" placeholder="e.g., Acquisition Edge LLC" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Business Description</label>
                <input type="text" value={businessDescription} onChange={e => setBusinessDescription(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:border-amber-400 focus:outline-none" placeholder="e.g., HVAC Company in Florida" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-lg font-bold text-amber-400 mb-4">Step 2: Financial Terms</h3>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Purchase Price ($)</label>
                <input type="text" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:border-amber-400 focus:outline-none" placeholder="e.g., 1,500,000" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Earnest Money Deposit ($)</label>
                <input type="text" value={earnestMoney} onChange={e => setEarnestMoney(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:border-amber-400 focus:outline-none" placeholder="e.g., 50,000" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-lg font-bold text-amber-400 mb-4">Step 3: Timeline & Conditions</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Due Diligence (Days)</label>
                  <input type="number" value={dueDiligenceDays} onChange={e => setDueDiligenceDays(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:border-amber-400 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Closing Date</label>
                  <input type="date" value={closingDate} onChange={e => setClosingDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:border-amber-400 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Seller Training Period</label>
                  <input type="text" value={trainingPeriod} onChange={e => setTrainingPeriod(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:border-amber-400 focus:outline-none" placeholder="e.g., 14 days" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Non-Compete Period</label>
                  <input type="text" value={nonCompetePeriod} onChange={e => setNonCompetePeriod(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:border-amber-400 focus:outline-none" placeholder="e.g., 2 years" />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-lg font-bold text-amber-400 mb-4">Step 4: Review & Generate</h3>
              <p className="text-slate-300 text-sm">You have completed the walkthrough. You can now download the filled LOI as a PDF or send it directly to the broker/seller via OpenSign.</p>
              
              <div className="flex flex-col space-y-3 mt-6">
                <button
                  onClick={handleDownload}
                  disabled={isGenerating}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded transition-colors flex items-center justify-center"
                >
                  {isGenerating ? 'Generating...' : 'Download PDF'}
                </button>
                <button
                  onClick={handleSendViaOpenSign}
                  disabled={isGenerating}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded transition-colors flex items-center justify-center"
                >
                  {isGenerating ? 'Sending...' : 'Send via OpenSign'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-800/50 flex justify-between">
          <button
            onClick={handlePrev}
            disabled={step === 1 || isGenerating}
            className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
          >
            Back
          </button>
          {step < 4 && (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 text-sm font-bold rounded transition-colors"
            >
              Next
            </button>
          )}
        </div>
      </div>

      {/* Hidden Printable LOI Template */}
      <div style={{ display: 'none' }}>
        <div ref={printRef} className="bg-white text-black p-12 w-[210mm] min-h-[297mm] font-serif text-[11pt] leading-relaxed">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div className="w-1/2">
              {initialData.logo ? (
                <img src={initialData.logo} alt="Logo" className="max-h-20 object-contain" />
              ) : (
                <div className="h-20 w-40 bg-gray-100 flex items-center justify-center text-gray-400 text-sm italic border border-gray-200">
                  [Company Logo]
                </div>
              )}
            </div>
            <div className="w-1/2 text-right text-sm">
              <p>{initialData.businessAddress || '[Business Address]'}</p>
              <p>{initialData.businessPhone || '[Business Phone]'}</p>
              <p>{initialData.businessEmail || '[Business Email]'}</p>
            </div>
          </div>

          {/* Date & Addressee */}
          <div className="mb-8">
            <p className="mb-4"><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
            <p><strong>To:</strong> {initialData.sellerName || '[Seller Name]'}</p>
            {initialData.brokerName && <p><strong>CC:</strong> {initialData.brokerName} (Broker)</p>}
          </div>

          {/* Subject */}
          <div className="mb-8 font-bold text-center uppercase underline">
            LETTER OF INTENT TO PURCHASE {businessDescription ? businessDescription.toUpperCase() : '[BUSINESS DESCRIPTION]'}
          </div>

          {/* Body */}
          <div className="space-y-4">
            <p>Dear {initialData.sellerName || '[Seller Name]'},</p>
            <p>
              This Letter of Intent ("LOI") sets forth the preliminary terms and conditions under which {buyerName || '[Buyer Name]'} ("Buyer") intends to acquire the assets and business operations of {businessDescription || '[Business Description]'} ("Business") from {initialData.sellerName || '[Seller Name]'} ("Seller").
            </p>
            
            <h4 className="font-bold mt-6 mb-2">1. Purchase Price</h4>
            <p>
              The total purchase price for the Business shall be ${purchasePrice || '[Purchase Price]'}, subject to customary adjustments.
            </p>

            <h4 className="font-bold mt-6 mb-2">2. Earnest Money Deposit</h4>
            <p>
              Upon execution of a definitive Purchase Agreement, Buyer shall deposit ${earnestMoney || '[Earnest Money]'} into escrow as an earnest money deposit.
            </p>

            <h4 className="font-bold mt-6 mb-2">3. Due Diligence</h4>
            <p>
              Buyer shall have a period of {dueDiligenceDays || '[X]'} days following the execution of this LOI to conduct legal, financial, and operational due diligence.
            </p>

            <h4 className="font-bold mt-6 mb-2">4. Closing Date</h4>
            <p>
              The parties anticipate closing the transaction on or before {closingDate || '[Closing Date]'}, subject to the satisfaction of all closing conditions.
            </p>

            <h4 className="font-bold mt-6 mb-2">5. Transition and Training</h4>
            <p>
              Seller agrees to provide training and transition assistance to Buyer for a period of {trainingPeriod || '[Training Period]'} following the closing at no additional cost.
            </p>

            <h4 className="font-bold mt-6 mb-2">6. Non-Compete Agreement</h4>
            <p>
              Seller agrees not to compete with the Business within a reasonable geographic radius for a period of {nonCompetePeriod || '[Non-Compete Period]'} following the closing.
            </p>

            <p className="mt-8">
              This LOI is non-binding and is intended solely as a basis for further negotiations.
            </p>

            <div className="mt-12 flex justify-between">
              <div className="w-[45%]">
                <p className="mb-8"><strong>BUYER:</strong></p>
                <div className="border-b border-black mb-2 h-8"></div>
                <p>{buyerName || '[Buyer Name]'}</p>
              </div>
              <div className="w-[45%]">
                <p className="mb-8"><strong>SELLER:</strong></p>
                <div className="border-b border-black mb-2 h-8"></div>
                <p>{initialData.sellerName || '[Seller Name]'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
