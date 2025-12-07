import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label className="text-slate-300 text-sm font-medium pr-1">
          {label}
        </label>
      )}
      <input
        className={`bg-slate-800/50 border border-slate-700 text-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder:text-slate-500 ${className}`}
        {...props}
      />
      {error && (
        <span className="text-red-400 text-xs">{error}</span>
      )}
    </div>
  );
};