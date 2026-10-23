import React from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export default function Notification({ type = 'error', message, onClose }) {
  if (!message) return null;

  const isError = type === 'error';
  const isSuccess = type === 'success';

  return (
    <div
      className={`rounded-xl p-4 border flex items-start justify-between gap-3 shadow-lg transition-all ${
        isError
          ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          : isSuccess
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
      }`}
    >
      <div className="flex items-start gap-3">
        {isError && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
        {isSuccess && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
        {!isError && !isSuccess && <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />}
        <div className="text-xs sm:text-sm font-medium leading-relaxed">
          {message}
        </div>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
