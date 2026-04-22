import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  prefix?: string;
  onAction?: () => void;
  actionLabel?: string;
  actionLoading?: boolean;
  onSecondaryAction?: () => void;
  secondaryActionLabel?: string;
  onTertiaryAction?: () => void;
  tertiaryActionLabel?: string;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  prefix, 
  onAction, 
  actionLabel, 
  actionLoading,
  onSecondaryAction,
  secondaryActionLabel,
  onTertiaryAction,
  tertiaryActionLabel,
  className = '', 
  ...props 
}) => {
  // Generate a unique ID if one isn't provided to link label and input accessibility-wise
  const inputId = props.id || props.name || `input-${(label || '').replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="mb-4">
      {/* Separate container for Label and Actions to avoid nesting buttons inside label */}
      {label && (
        <div className="flex justify-between items-center mb-1">
          <label htmlFor={inputId} className="text-slate-400 text-xs font-bold uppercase tracking-wider cursor-pointer select-none">
            {label}
          </label>
          
          <div className="flex items-center space-x-3">
            {onTertiaryAction && tertiaryActionLabel && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onTertiaryAction();
                }}
                className="relative cursor-pointer text-[10px] font-bold uppercase text-slate-500 hover:text-cyan-400 tracking-wider transition-colors z-10 p-1 -mr-1 hover:bg-slate-800 rounded"
              >
                {tertiaryActionLabel}
              </button>
            )}
            {onSecondaryAction && secondaryActionLabel && (
              <button
                type="button"
                onClick={(e) => {
                  // Prevent form submission or label triggering
                  e.preventDefault();
                  e.stopPropagation();
                  onSecondaryAction();
                }}
                className="relative cursor-pointer text-[10px] font-bold uppercase text-slate-500 hover:text-red-400 tracking-wider transition-colors z-10 p-1 -mr-1 hover:bg-slate-800 rounded"
              >
                {secondaryActionLabel}
              </button>
            )}
            {onAction && actionLabel && (
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAction();
                }}
                disabled={actionLoading}
                className="relative cursor-pointer text-[10px] font-bold uppercase text-amber-400 hover:text-amber-300 disabled:opacity-50 tracking-wider flex items-center z-10 p-1 -mr-1 hover:bg-slate-800 rounded"
              >
                {actionLoading && (
                  <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-amber-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {actionLabel}
              </button>
            )}
          </div>
        </div>
      )}
      
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          id={inputId}
          className={`w-full bg-slate-900 border border-slate-700 rounded-md py-2.5 ${prefix ? 'pl-8' : 'pl-3'} pr-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all ${className}`}
          {...props}
        />
      </div>
    </div>
  );
};