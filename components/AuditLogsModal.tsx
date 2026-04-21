import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auditService } from '../services/auditService';
import { AuditLog } from '../types';

export const AuditLogsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { team } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && team?.id) {
      setLoading(true);
      auditService.getTeamLogs(team.id).then(fetchedLogs => {
        setLogs(fetchedLogs);
        setLoading(false);
      });
    }
  }, [isOpen, team?.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-xl max-w-4xl w-full max-h-[80vh] flex flex-col border border-slate-700 shadow-2xl">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider flex items-center">
             <svg className="w-5 h-5 text-amber-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
             </svg>
             Corporate Audit Trail
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 text-sm bg-slate-900/50">
          {loading ? (
            <div className="text-slate-500 animate-pulse">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-slate-500 italic">No audit logs found for this team.</div>
          ) : (
             <div className="space-y-3">
               {logs.map((log) => (
                 <div key={log.id} className="bg-slate-800 p-4 rounded border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="text-amber-400 font-bold uppercase tracking-wider text-xs mb-1">{log.action}</div>
                      <div className="text-slate-200">
                         <span className="font-semibold">{log.userName}</span>
                         {log.dealName && <span className="text-slate-400"> on <span className="text-white italic">{log.dealName}</span></span>}
                      </div>
                    </div>
                    <div className="text-slate-500 text-xs text-right shrink-0">
                       {log.timestamp ? new Date((log.timestamp as any).seconds * 1000).toLocaleString() : 'Just now'}
                    </div>
                 </div>
               ))}
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
