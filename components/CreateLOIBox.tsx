import React, { useState } from 'react';
import { LOIWalkthroughModal } from './LOIWalkthroughModal';
import { LOITerms } from '../types';

interface CreateLOIBoxProps {
  loiTerms: LOITerms | null;
}

export const CreateLOIBox: React.FC<CreateLOIBoxProps> = ({ loiTerms }) => {
  const [logo, setLogo] = useState<string | undefined>(undefined);
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  
  const [sellerName, setSellerName] = useState('');
  const [sellerEmail, setSellerEmail] = useState('');
  const [brokerName, setBrokerName] = useState('');
  const [brokerEmail, setBrokerEmail] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartWalkthrough = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loiTerms) {
      alert("Terms are not Set. Please set terms in the Acquisition Edge Chat first.");
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl overflow-hidden relative group flex flex-col">
      <div className="absolute top-0 left-0 w-1 h-full bg-slate-600 group-hover:bg-emerald-400 transition-colors"></div>
      <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
        <h2 className="text-lg font-display font-bold text-white uppercase flex items-center">
          <svg className="w-5 h-5 mr-2 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Create LOI & Send
        </h2>
        <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-1 rounded uppercase tracking-wider">
          OpenSign Integration
        </span>
      </div>

      <div className="p-4 space-y-4">
        <form onSubmit={handleStartWalkthrough} className="space-y-4">
          
          {/* Logo Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Business Logo / Header Graphic (Optional)
            </label>
            <div className="flex items-center justify-center w-full">
              <label htmlFor="logo-upload" className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-900/50 hover:bg-slate-800 transition-colors overflow-hidden">
                {logo ? (
                  <img src={logo} alt="Logo Preview" className="h-full object-contain p-2" />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-6 h-6 mb-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mb-1 text-sm text-slate-400">
                      <span className="font-semibold">Click to upload</span> logo
                    </p>
                  </div>
                )}
                <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </label>
            </div>
          </div>

          {/* Business Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Business Address</label>
              <input type="text" value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400 transition-colors" placeholder="123 Main St" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Business Phone</label>
              <input type="text" value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400 transition-colors" placeholder="(555) 123-4567" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Business Email</label>
              <input type="email" value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400 transition-colors" placeholder="info@business.com" />
            </div>
          </div>

          {/* Seller Details (Optional) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Seller Name *
              </label>
              <input
                type="text"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400 transition-colors"
                placeholder="Jane Smith"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Seller Email (Optional)
              </label>
              <input
                type="email"
                value={sellerEmail}
                onChange={(e) => setSellerEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400 transition-colors"
                placeholder="seller@example.com"
              />
            </div>
          </div>

          {/* Broker Details (Mandatory) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Broker Name *
              </label>
              <input
                type="text"
                value={brokerName}
                onChange={(e) => setBrokerName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400 transition-colors"
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Broker Email *
              </label>
              <input
                type="email"
                value={brokerEmail}
                onChange={(e) => setBrokerEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400 transition-colors"
                placeholder="broker@example.com"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!sellerName || !brokerName || !brokerEmail}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
            Start LOI Walkthrough
          </button>
        </form>
      </div>

      <LOIWalkthroughModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={{
          logo,
          businessAddress,
          businessPhone,
          businessEmail,
          sellerName,
          sellerEmail,
          brokerName,
          brokerEmail
        }}
        loiTerms={loiTerms}
      />
    </div>
  );
};
