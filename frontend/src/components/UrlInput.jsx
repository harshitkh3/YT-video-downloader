import React from 'react';
import { Search, Clipboard, X, Loader2, Sparkles } from 'lucide-react';

export default function UrlInput({
  url,
  setUrl,
  onFetch,
  loading,
  disabled,
}) {
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
      }
    } catch (err) {
      // Clipboard read permission might fail, graceful fallback
    }
  };

  const handleClear = () => {
    setUrl('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim() && !loading) {
      onFetch();
    }
  };

  const setSampleUrl = () => {
    setUrl('https://www.youtube.com/watch?v=jNQXAC9IVRw');
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center shadow-2xl rounded-2xl bg-slate-900 border border-slate-800 focus-within:border-rose-500/80 focus-within:ring-4 focus-within:ring-rose-500/10 transition-all">
          <div className="pl-4 text-slate-400">
            <Search className="w-5 h-5" />
          </div>

          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={disabled}
            placeholder="Paste YouTube link here (e.g. https://www.youtube.com/watch?v=...)"
            className="w-full px-4 py-4 text-sm sm:text-base bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none"
          />

          <div className="flex items-center gap-1.5 pr-2">
            {url && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handlePaste}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              title="Paste from clipboard"
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>Paste</span>
            </button>

            <button
              type="submit"
              disabled={!url.trim() || loading || disabled}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-semibold text-sm rounded-xl transition shadow-lg shadow-rose-600/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Fetching...</span>
                </>
              ) : (
                <span>Fetch Info</span>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Helper / Sample hint */}
      <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400 px-1">
        <span>Supports YouTube Videos, Shorts, and Music links.</span>
        <button
          type="button"
          onClick={setSampleUrl}
          className="text-rose-400 hover:text-rose-300 underline underline-offset-2 transition"
        >
          Try sample video
        </button>
      </div>
    </div>
  );
}
