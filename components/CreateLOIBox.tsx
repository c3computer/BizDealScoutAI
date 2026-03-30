import React, { useState } from 'react';
import { openSignService, OpenSignSigner } from '../services/openSignService';

export const CreateLOIBox: React.FC = () => {
  const [loiFile, setLoiFile] = useState<File | null>(null);
  const [brokerName, setBrokerName] = useState('');
  const [brokerEmail, setBrokerEmail] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [sellerEmail, setSellerEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.name.endsWith('.docx')) {
        setLoiFile(file);
        setErrorMessage(null);
      } else {
        setLoiFile(null);
        setErrorMessage('Please upload a .docx file.');
      }
    }
  };

  const handleSendLOI = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!loiFile) {
      setErrorMessage('Please upload a template LOI (.docx).');
      return;
    }

    if (!brokerName || !brokerEmail) {
      setErrorMessage('Broker Name and Email are required.');
      return;
    }

    setIsSending(true);

    const signers: OpenSignSigner[] = [
      { name: brokerName, email: brokerEmail }
    ];

    if (sellerName && sellerEmail) {
      signers.push({ name: sellerName, email: sellerEmail });
    }

    try {
      const result = await openSignService.sendDocumentForSignature({
        file: loiFile,
        title: `Letter of Intent - ${loiFile.name}`,
        signers
      });

      if (result.success) {
        setSuccessMessage(result.message);
        // Reset form
        setLoiFile(null);
        setBrokerName('');
        setBrokerEmail('');
        setSellerName('');
        setSellerEmail('');
        // Reset file input
        const fileInput = document.getElementById('loi-file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setErrorMessage(result.message);
      }
    } catch (error) {
      setErrorMessage('An unexpected error occurred.');
    } finally {
      setIsSending(false);
    }
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
        {successMessage && (
          <div className="bg-emerald-900/50 border border-emerald-500/50 text-emerald-200 px-3 py-2 rounded text-sm">
            {successMessage}
          </div>
        )}
        
        {errorMessage && (
          <div className="bg-red-900/50 border border-red-500/50 text-red-200 px-3 py-2 rounded text-sm">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSendLOI} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Upload LOI Template (.docx)
            </label>
            <div className="flex items-center justify-center w-full">
              <label htmlFor="loi-file-upload" className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-900/50 hover:bg-slate-800 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-6 h-6 mb-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mb-1 text-sm text-slate-400">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-slate-500">DOCX files only</p>
                </div>
                <input id="loi-file-upload" type="file" accept=".docx" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
            {loiFile && (
              <div className="mt-2 text-sm text-emerald-400 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {loiFile.name}
              </div>
            )}
          </div>

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Seller Name (Optional)
              </label>
              <input
                type="text"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-400 transition-colors"
                placeholder="Jane Smith"
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

          <button
            type="submit"
            disabled={isSending || !loiFile || !brokerName || !brokerEmail}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSending ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending via OpenSign...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Create LOI & Send to Broker
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
