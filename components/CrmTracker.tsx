import React from 'react';
import { CrmData, DealStatus } from '../types';

interface CrmTrackerProps {
  crm: CrmData;
  onChange: (crm: CrmData) => void;
  disabled?: boolean;
}

const STATUS_OPTIONS: DealStatus[] = ['Lead', 'Engaged', 'Offer Made', 'LOI Sent', 'Due Diligence', 'Accepted', 'Rejected'];

export const CrmTracker: React.FC<CrmTrackerProps> = ({ crm, onChange, disabled }) => {
  const handleCheck = (field: keyof CrmData) => {
    if (disabled) return;
    onChange({ ...crm, [field]: !crm[field] });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (disabled) return;
    onChange({ ...crm, status: e.target.value as DealStatus });
  };

  const Checkbox = ({ label, field }: { label: string, field: keyof CrmData }) => (
    <label className={`flex items-center space-x-2 text-sm ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:text-purple-400'} transition-colors`}>
      <input 
        type="checkbox" 
        checked={crm[field] as boolean} 
        onChange={() => handleCheck(field)}
        disabled={disabled}
        className="rounded border-slate-600 bg-slate-900 text-purple-400 focus:ring-purple-400 focus:ring-offset-slate-800"
      />
      <span className={crm[field] ? 'text-purple-400 font-medium' : 'text-slate-300'}>{label}</span>
    </label>
  );

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl overflow-hidden relative group">
      <div className="absolute top-0 left-0 w-1 h-full bg-slate-600 group-hover:bg-purple-400 transition-colors"></div>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-display font-bold text-white uppercase flex items-center">
            <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            CRM / Pipeline
          </h2>
          {disabled && (
            <span className="text-[10px] bg-slate-700 text-slate-400 px-2 py-1 rounded uppercase tracking-wider">
              Save Deal to Track
            </span>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            Pipeline Stage
          </label>
          <select 
            value={crm.status}
            onChange={handleStatusChange}
            disabled={disabled}
            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none disabled:opacity-50"
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 border-b border-slate-700 pb-1">Prep & Docs</h3>
            <Checkbox label="NDA Signed" field="ndaSigned" />
            <Checkbox label="Financials Requested" field="financialsRequested" />
            <Checkbox label="POF Sent" field="pofSent" />
            <Checkbox label="CIM/Financials Received" field="cimReceived" />
          </div>
          <div className="space-y-2">
            <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 border-b border-slate-700 pb-1">Action & Comms</h3>
            <Checkbox label="Broker Call" field="brokerCall" />
            <Checkbox label="Seller Call" field="sellerCall" />
            <Checkbox label="Offer Made" field="offerMade" />
            <Checkbox label="LOI Sent" field="loiSent" />
            <Checkbox label="Due Diligence" field="dueDiligence" />
          </div>
        </div>
      </div>
    </div>
  );
};
