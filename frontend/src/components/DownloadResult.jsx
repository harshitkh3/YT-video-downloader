import React from 'react';
import { Download, CheckCircle, Trash2, ArrowLeft, FileVideo, FileAudio } from 'lucide-react';
import { getFileUrl } from '../services/api';

export default function DownloadResult({
  result,
  onReset,
  onDeleteServerFile,
  deleting,
}) {
  if (!result) return null;

  const downloadUrl = getFileUrl(result.filename);
  const isAudio = result.filename.endsWith('.mp3');

  return (
    <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
      {/* Glow accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <CheckCircle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-slate-100 text-base sm:text-lg">
            Media Ready for Download!
          </h4>
          <p className="text-xs text-slate-400">
            Conversion completed successfully via yt-dlp.
          </p>
        </div>
      </div>

      {/* File summary box */}
      <div className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-4 mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-rose-400 shrink-0">
            {isAudio ? <FileAudio className="w-6 h-6" /> : <FileVideo className="w-6 h-6" />}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-100 truncate" title={result.filename}>
              {result.filename}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
              <span className="font-mono bg-slate-900 px-2 py-0.5 rounded text-emerald-400 border border-slate-700">
                {result.size_str}
              </span>
              <span>•</span>
              <span className="uppercase">{isAudio ? 'MP3 Audio' : 'MP4 Video'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <a
          href={downloadUrl}
          download={result.filename}
          className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-600/25 transition text-center"
        >
          <Download className="w-5 h-5" />
          <span>Save File to Device</span>
        </a>

        <button
          type="button"
          onClick={() => onDeleteServerFile(result.filename)}
          disabled={deleting}
          className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 text-xs sm:text-sm font-medium transition disabled:opacity-50"
          title="Delete temporary file from server to free space"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete from Server</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs sm:text-sm font-medium transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>New Download</span>
        </button>
      </div>
    </div>
  );
}
