import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import UrlInput from './components/UrlInput';
import VideoCard from './components/VideoCard';
import DownloadOptions from './components/DownloadOptions';
import DownloadResult from './components/DownloadResult';
import StorageModal from './components/StorageModal';
import Notification from './components/Notification';
import { getVideoInfo, requestDownload, deleteServerFile, getCacheStats } from './services/api';
import { Sparkles, ShieldCheck, Zap, DownloadCloud } from 'lucide-react';

export default function App() {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [mode, setMode] = useState('Video (MP4)');
  const [resolution, setResolution] = useState('Best Available');
  const [downloading, setDownloading] = useState(false);
  const [downloadResult, setDownloadResult] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [cacheStats, setCacheStats] = useState(null);
  const [isStorageOpen, setIsStorageOpen] = useState(false);

  // Load server cache stats on mount
  useEffect(() => {
    refreshCacheStats();
  }, []);

  const refreshCacheStats = async () => {
    try {
      const stats = await getCacheStats();
      setCacheStats(stats);
    } catch {
      // Backend might be warming up
    }
  };

  const handleFetchInfo = async () => {
    if (!url.trim()) return;

    setFetching(true);
    setNotification(null);
    setVideoInfo(null);
    setDownloadResult(null);

    try {
      const data = await getVideoInfo(url.trim());
      setVideoInfo(data);
      if (data.resolutions && data.resolutions.length > 0) {
        setResolution(data.resolutions[0]);
      } else {
        setResolution('Best Available');
      }
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to fetch video details.',
      });
    } finally {
      setFetching(false);
    }
  };

  const handleDownload = async () => {
    if (!url.trim()) return;

    setDownloading(true);
    setNotification(null);
    setDownloadResult(null);

    try {
      const result = await requestDownload({
        url: url.trim(),
        mode,
        resolution,
      });
      setDownloadResult(result);
      await refreshCacheStats();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Media processing failed.',
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleDeleteServerFile = async (filename) => {
    try {
      setDeleting(true);
      await deleteServerFile(filename);
      setDownloadResult(null);
      setNotification({
        type: 'success',
        message: 'File removed from server cache.',
      });
      await refreshCacheStats();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to delete file from server.',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleReset = () => {
    setUrl('');
    setVideoInfo(null);
    setDownloadResult(null);
    setNotification(null);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white">
      {/* Navigation */}
      <Navbar
        onOpenStorage={() => setIsStorageOpen(true)}
        cacheStats={cacheStats}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col gap-8">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fast, Full Quality & Zero Watermarks</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Download YouTube{' '}
            <span className="bg-gradient-to-r from-rose-500 via-red-500 to-amber-500 bg-clip-text text-transparent">
              Videos & MP3s
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            Convert and save videos in ultra-clear MP4 or extract crystal-clear 192kbps MP3 audio in seconds.
          </p>
        </div>

        {/* Input Bar */}
        <UrlInput
          url={url}
          setUrl={setUrl}
          onFetch={handleFetchInfo}
          loading={fetching}
          disabled={downloading}
        />

        {/* Global Notifications */}
        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}

        {/* Video Preview Card */}
        {videoInfo && <VideoCard info={videoInfo} />}

        {/* Download Options */}
        {videoInfo && !downloadResult && (
          <DownloadOptions
            mode={mode}
            setMode={setMode}
            resolution={resolution}
            setResolution={setResolution}
            resolutions={videoInfo.resolutions}
            onDownload={handleDownload}
            downloading={downloading}
          />
        )}

        {/* Download Result & Delivery */}
        {downloadResult && (
          <DownloadResult
            result={downloadResult}
            onReset={handleReset}
            onDeleteServerFile={handleDeleteServerFile}
            deleting={deleting}
          />
        )}

        {/* Features Row (when idle) */}
        {!videoInfo && !downloadResult && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 mt-4 border-t border-slate-800/80">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Lightning Fast</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Streamlined yt-dlp core merges audio and video streams instantly.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <DownloadCloud className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Any Quality</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Choose from 1080p, 720p, 480p, or high-fidelity 192kbps MP3 audio.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Safe & Ephemeral</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Automated auto-cleanup after 30 minutes protects disk and privacy.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <p>Built with React, Vite, Tailwind CSS, FastAPI, and yt-dlp.</p>
      </footer>

      {/* Storage Management Modal */}
      <StorageModal
        isOpen={isStorageOpen}
        onClose={() => setIsStorageOpen(false)}
        cacheStats={cacheStats}
        onRefreshStats={refreshCacheStats}
      />
    </div>
  );
}
