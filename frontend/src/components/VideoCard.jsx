import React from 'react';
import { Eye, Clock, User, ExternalLink } from 'lucide-react';

export default function VideoCard({ info }) {
  if (!info) return null;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl transition-all">
      <div className="flex flex-col md:flex-row gap-5">
        {/* Thumbnail with duration overlay */}
        <div className="relative w-full md:w-72 shrink-0 aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 group">
          {info.thumbnail ? (
            <img
              src={info.thumbnail}
              alt={info.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600 text-sm">
              No thumbnail
            </div>
          )}
          {info.duration_str && (
            <span className="absolute bottom-2 right-2 bg-black/85 backdrop-blur-sm text-white text-[11px] font-mono px-2 py-0.5 rounded-md font-medium border border-white/10 shadow">
              {info.duration_str}
            </span>
          )}
        </div>

        {/* Video metadata */}
        <div className="flex flex-col justify-between flex-1 min-w-0">
          <div>
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base sm:text-lg font-bold text-slate-100 line-clamp-2 leading-snug">
                {info.title}
              </h3>
              {info.id && (
                <a
                  href={`https://www.youtube.com/watch?v=${info.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition shrink-0"
                  title="Open video on YouTube"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-300">
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/50">
                <User className="w-3.5 h-3.5 text-rose-400" />
                <span className="font-medium text-slate-200">{info.author}</span>
              </div>

              {info.view_count && (
                <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/50">
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                  <span>{info.view_count.toLocaleString()} views</span>
                </div>
              )}

              {info.duration_str && (
                <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/50">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{info.duration_str}</span>
                </div>
              )}
            </div>

            {info.description && (
              <p className="mt-3 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {info.description}
              </p>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Metadata verified and ready for download</span>
          </div>
        </div>
      </div>
    </div>
  );
}
