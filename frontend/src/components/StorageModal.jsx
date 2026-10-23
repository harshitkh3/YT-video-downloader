import React, { useState } from 'react';
import { X, HardDrive, Trash2, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { clearCache } from '../services/api';

export default function StorageModal({
  isOpen,
  onClose,
  cacheStats,
  onRefreshStats,
}) {
  const [clearing, setClearing] = useState(false);
  const [clearedMessage, setClearedMessage] = useState(null);

  if (!isOpen) return null;

  const handleClear = async () => {
    try {
      setClearing(true);
      const res = await clearCache();
      setClearedMessage(`Cleared ${res.deleted_count} file(s) from server cache.`);
      await onRefreshStats();
      setTimeout(() => setClearedMessage(null), 3000);
    } catch (err) {
      alert(`Failed to clear cache: ${err.message}`);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-800 text-rose-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">Server Storage</h3>
              <p className="text-xs text-slate-400">Temporary downloads management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Storage stats */}
        <div className="my-5 grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-xs text-slate-400">Cached Files</span>
            <div className="text-xl font-bold font-mono text-slate-100 mt-1">
              {cacheStats ? cacheStats.file_count : 0}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-xs text-slate-400">Total Disk Size</span>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
              {cacheStats ? cacheStats.size_str : '0 B'}
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed mb-6">
          Files are automatically deleted after 30 minutes to prevent disk bloat. You can also purge the cache immediately below.
        </p>

        {clearedMessage && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{clearedMessage}</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleClear}
            disabled={clearing || !cacheStats || cacheStats.file_count === 0}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition shadow-lg shadow-rose-600/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {clearing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Purging...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Purge Cache</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onRefreshStats}
            className="p-2.5 text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl transition border border-slate-700"
            title="Refresh storage statistics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
