import React from 'react';
import { Video, Music, Download, CheckCircle2, Loader2, Sparkles, Sliders } from 'lucide-react';

export default function DownloadOptions({
  mode,
  setMode,
  resolution,
  setResolution,
  resolutions,
  onDownload,
  downloading,
}) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-rose-500" />
          <h4 className="font-bold text-sm sm:text-base text-slate-100">
            Download Format & Quality
          </h4>
        </div>
        <span className="text-xs text-slate-400">Step 2 of 2</span>
      </div>

      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <button
          type="button"
          onClick={() => setMode('Video (MP4)')}
          disabled={downloading}
          className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
            mode === 'Video (MP4)'
              ? 'bg-rose-500/15 border-rose-500/80 text-rose-300 ring-2 ring-rose-500/20 shadow-lg shadow-rose-500/10'
              : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>Video (MP4)</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('Audio Only (MP3)')}
          disabled={downloading}
          className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
            mode === 'Audio Only (MP3)'
              ? 'bg-rose-500/15 border-rose-500/80 text-rose-300 ring-2 ring-rose-500/20 shadow-lg shadow-rose-500/10'
              : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Music className="w-4 h-4" />
          <span>Audio Only (MP3)</span>
        </button>
      </div>

      {/* Mode specific configuration */}
      {mode === 'Video (MP4)' ? (
        <div className="mb-6 space-y-3">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Select Video Resolution
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(resolutions || ['Best Available']).map((res) => (
              <button
                key={res}
                type="button"
                onClick={() => setResolution(res)}
                disabled={downloading}
                className={`py-2 px-3 rounded-lg border text-xs sm:text-sm font-medium transition text-center ${
                  resolution === res
                    ? 'bg-rose-600 border-rose-500 text-white font-bold shadow-md shadow-rose-600/30'
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-700 hover:border-slate-600'
                }`}
              >
                {res}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Highest audio bitrate will be seamlessly merged into the MP4 container via FFmpeg.
          </p>
        </div>
      ) : (
        <div className="mb-6 p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 mt-0.5">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-200">
              High Quality MP3 Audio Extraction
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Extracts the pristine audio stream and encodes it into 192 kbps Constant Bitrate MP3, universally playable on all devices.
            </p>
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        type="button"
        onClick={onDownload}
        disabled={downloading}
        className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:via-red-500 hover:to-rose-600 text-white font-bold text-sm sm:text-base shadow-xl shadow-rose-600/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
      >
        {downloading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing Media on Server...</span>
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            <span>
              {mode === 'Audio Only (MP3)' ? 'Download MP3 Audio' : `Download MP4 Video (${resolution})`}
            </span>
          </>
        )}
      </button>

      {downloading && (
        <p className="text-center text-xs text-slate-400 mt-2.5 animate-pulse">
          Downloading stream & merging formats with yt-dlp. This may take a few seconds...
        </p>
      )}
    </div>
  );
}
