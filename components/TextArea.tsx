import React from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="mb-4">
      <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
        {label}
      </label>
      <textarea
        className={`w-full bg-slate-900 border border-slate-700 rounded-md py-2 px-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all min-h-[80px] ${className}`}
        {...props}
      />
    </div>
  );
};
