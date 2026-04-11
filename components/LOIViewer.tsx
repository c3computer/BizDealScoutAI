import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { LOITrackingData } from '../types';

interface LOIViewerProps {
  loiId: string;
}

export const LOIViewer: React.FC<LOIViewerProps> = ({ loiId }) => {
  const [loiData, setLoiData] = useState<LOITrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndLogView = async () => {
      try {
        const docRef = doc(db, 'loi_tracking', loiId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as LOITrackingData;
          setLoiData(data);
          
          // Increment views and opens (if it's the first view)
          const isFirstOpen = data.opens === 0;
          
          await updateDoc(docRef, {
            views: increment(1),
            lastViewedAt: new Date(),
            ...(isFirstOpen ? { opens: increment(1), lastOpenedAt: new Date() } : {})
          });
        } else {
          setError("LOI not found or has been removed.");
        }
      } catch (err) {
        console.error("Error fetching LOI:", err);
        setError("Failed to load the document.");
      } finally {
        setLoading(false);
      }
    };

    fetchAndLogView();
  }, [loiId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error || !loiData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-lg border border-slate-700 text-center max-w-md w-full shadow-2xl">
          <svg className="w-16 h-16 text-rose-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-white mb-2">Document Unavailable</h2>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <div className="bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center shadow-md">
        <div>
          <h1 className="text-white font-bold text-lg">Letter of Intent</h1>
          <p className="text-slate-400 text-sm">Prepared for {loiData.sellerName}</p>
        </div>
        <a 
          href={loiData.pdfUrl} 
          download={`LOI_${loiData.sellerName.replace(/\s+/g, '_')}.pdf`}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded text-sm font-medium transition-colors flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download PDF
        </a>
      </div>
      <div className="flex-grow p-4 md:p-8 flex justify-center">
        <iframe 
          src={`${loiData.pdfUrl}#toolbar=0`} 
          className="w-full max-w-4xl h-[80vh] bg-white rounded shadow-2xl border border-slate-700"
          title="Letter of Intent"
        />
      </div>
    </div>
  );
};
