import React, { useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { storage, db } from '../firebase';
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
  userId?: string;
  dealId?: string;
}

export const LOIWalkthroughModal: React.FC<LOIWalkthroughModalProps> = ({ isOpen, onClose, initialData, loiTerms, userId, dealId }) => {
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
  const [trackedLink, setTrackedLink] = useState<string | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => s - 1);

  const generatePDF = async (): Promise<{ file: File, dataUrl: string } | null> => {
    if (!printRef.current) return null;
    
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2, // Restored to 2 for print-quality text
        useCORS: true,
        logging: false
      });
      
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error(`Canvas dimensions are invalid: ${canvas.width}x${canvas.height}`);
      }

      let imgData = canvas.toDataURL('image/jpeg', 0.6); // Lowered quality to compensate for higher scale
      
      // If the image data is still too large for Firestore (approaching 1MB), compress it further
      if (imgData.length > 900000) {
        imgData = canvas.toDataURL('image/jpeg', 0.4);
      }
      if (imgData.length > 900000) {
        imgData = canvas.toDataURL('image/jpeg', 0.2);
      }
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'letter'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = position - pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      const pdfBlob = pdf.output('blob');
      const dataUrl = pdf.output('datauristring');
      return {
        file: new File([pdfBlob], `LOI_${initialData.sellerName.replace(/\s+/g, '_')}.pdf`, { type: 'application/pdf' }),
        dataUrl
      };
    } catch (error) {
      console.error("Error generating PDF:", error);
      return null;
    }
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const result = await generatePDF();
      if (result) {
        const url = URL.createObjectURL(result.file);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.file.name;
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

  const handleGenerateTrackedLink = async () => {
    if (!userId || !dealId) {
      setErrorMessage("Please save the deal to history first before generating a tracked link.");
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setTrackedLink(null);

    try {
      const result = await generatePDF();
      if (!result) {
        setErrorMessage("Failed to generate PDF.");
        setIsGenerating(false);
        return;
      }

      const loiId = Math.random().toString(36).substr(2, 9);
      
      // Store the base64 PDF directly in Firestore to avoid Storage rules/timeout issues
      const trackingRef = doc(db, 'loi_tracking', loiId);
      await setDoc(trackingRef, {
        userId,
        dealId,
        pdfUrl: result.dataUrl,
        sellerName: initialData.sellerName || 'Unknown Seller',
        sentAt: new Date(),
        opens: 0,
        views: 0
      });

      const link = `${window.location.origin}/?loi=${loiId}`;
      setTrackedLink(link);
      setSuccessMessage("Tracked link generated successfully! You can now copy and send this link.");
    } catch (error) {
      console.error("Error generating tracked link:", error);
      setErrorMessage(error instanceof Error ? error.message : "An unexpected error occurred while generating the link.");
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
              <p className="text-slate-300 text-sm">You have completed the walkthrough. You can now download the filled LOI as a PDF or generate a tracked link to send via email.</p>
              
              {trackedLink ? (
                <div className="mt-6 p-4 bg-slate-800 border border-emerald-500/30 rounded-lg">
                  <p className="text-sm text-slate-300 mb-2">Your tracked link is ready:</p>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={trackedLink} 
                      className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-emerald-400 text-sm focus:outline-none"
                    />
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(trackedLink);
                        alert("Link copied to clipboard!");
                      }}
                      className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded text-sm transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-3">
                    Send this link to the broker or seller. When they open it, you'll be able to track their engagement in the LOI Dash Cam.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col space-y-3 mt-6">
                  <button
                    onClick={handleDownload}
                    disabled={isGenerating}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded transition-colors flex items-center justify-center"
                  >
                    {isGenerating ? 'Generating...' : 'Download PDF'}
                  </button>
                  <button
                    onClick={handleGenerateTrackedLink}
                    disabled={isGenerating}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded transition-colors flex items-center justify-center"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Tracked Link'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-800/50 flex justify-between">
          {!(step === 4 && trackedLink) ? (
            <button
              onClick={handlePrev}
              disabled={step === 1 || isGenerating}
              className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
            >
              Back
            </button>
          ) : (
            <div></div>
          )}
          
          {step < 4 && (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 text-sm font-bold rounded transition-colors"
            >
              Next
            </button>
          )}
          
          {step === 4 && (
            <button
              onClick={onClose}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded transition-colors"
            >
              Finished!
            </button>
          )}
        </div>
      </div>

      {/* Hidden Printable LOI Template */}
      <div className="fixed top-0 left-0 z-[-1] opacity-0 pointer-events-none">
        <div ref={printRef} className="bg-white text-black w-[8.5in] px-[1in] py-[1in] font-serif text-[11pt] leading-relaxed box-border shadow-none">
          {/* Header */}
          <div className="flex justify-between items-start mb-10 border-b-2 border-gray-800 pb-6">
            <div className="w-1/2">
              {initialData.logo ? (
                <img src={initialData.logo} alt="Logo" className="max-h-16 object-contain" />
              ) : (
                <div className="h-16 w-48 bg-gray-50 flex items-center justify-center text-gray-400 text-sm font-sans tracking-widest uppercase border border-gray-200">
                  {buyerName || 'COMPANY LOGO'}
                </div>
              )}
            </div>
            <div className="w-1/2 text-right text-sm text-gray-600 font-sans">
              <p>{initialData.businessAddress || '[Business Address]'}</p>
              <p>{initialData.businessPhone || '[Business Phone]'}</p>
              <p>{initialData.businessEmail || '[Business Email]'}</p>
            </div>
          </div>

          {/* Date & Addressee */}
          <div className="mb-10 text-gray-800">
            <p className="mb-6"><strong>Date:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>To:</strong> {initialData.sellerName || '[Seller Name]'}</p>
            {initialData.brokerName && <p><strong>CC:</strong> {initialData.brokerName} (Broker)</p>}
          </div>

          {/* Subject */}
          <div className="mb-10 font-bold text-center uppercase tracking-wider text-lg">
            LETTER OF INTENT TO PURCHASE {businessDescription ? businessDescription.toUpperCase() : '[BUSINESS DESCRIPTION]'}
          </div>

          {/* Body */}
          <div className="space-y-6 text-justify text-gray-800">
            <p>Dear {initialData.sellerName || '[Seller Name]'},</p>
            <p>
              This Letter of Intent ("LOI") sets forth the preliminary terms and conditions under which <strong>{buyerName || '[Buyer Name]'}</strong> ("Buyer") intends to acquire the assets and business operations of <strong>{businessDescription || '[Business Description]'}</strong> ("Business") from <strong>{initialData.sellerName || '[Seller Name]'}</strong> ("Seller").
            </p>
            
            <div>
              <h4 className="font-bold mb-2 uppercase text-sm tracking-wider">1. Purchase Price</h4>
              <p>
                The total purchase price for the Business shall be <strong>${purchasePrice || '[Purchase Price]'}</strong>, subject to customary adjustments.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-2 uppercase text-sm tracking-wider">2. Earnest Money Deposit</h4>
              <p>
                Upon execution of a definitive Purchase Agreement, Buyer shall deposit <strong>${earnestMoney || '[Earnest Money]'}</strong> into escrow as an earnest money deposit.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-2 uppercase text-sm tracking-wider">3. Due Diligence</h4>
              <p>
                Buyer shall have a period of <strong>{dueDiligenceDays || '[X]'} days</strong> following the execution of this LOI to conduct legal, financial, and operational due diligence.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-2 uppercase text-sm tracking-wider">4. Closing Date</h4>
              <p>
                The parties anticipate closing the transaction on or before <strong>{closingDate || '[Closing Date]'}</strong>, subject to the satisfaction of all closing conditions.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-2 uppercase text-sm tracking-wider">5. Transition and Training</h4>
              <p>
                Seller agrees to provide training and transition assistance to Buyer for a period of <strong>{trainingPeriod || '[Training Period]'}</strong> following the closing at no additional cost.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-2 uppercase text-sm tracking-wider">6. Non-Compete Agreement</h4>
              <p>
                Seller agrees not to compete with the Business within a reasonable geographic radius for a period of <strong>{nonCompetePeriod || '[Non-Compete Period]'}</strong> following the closing.
              </p>
            </div>

            <p className="mt-10 italic text-gray-600">
              This LOI is non-binding and is intended solely as a basis for further negotiations. It does not constitute a legally binding agreement to purchase or sell the Business.
            </p>

            <div className="mt-16 flex justify-between pt-8">
              <div className="w-[40%]">
                <p className="mb-12 font-bold text-sm uppercase tracking-wider text-gray-500">Buyer</p>
                <div className="border-b border-gray-400 mb-3 h-8"></div>
                <p className="font-bold">{buyerName || '[Buyer Name]'}</p>
                <p className="text-sm text-gray-500">Date: _________________</p>
              </div>
              <div className="w-[40%]">
                <p className="mb-12 font-bold text-sm uppercase tracking-wider text-gray-500">Seller</p>
                <div className="border-b border-gray-400 mb-3 h-8"></div>
                <p className="font-bold">{initialData.sellerName || '[Seller Name]'}</p>
                <p className="text-sm text-gray-500">Date: _________________</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
