import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, Download, Loader2 } from 'lucide-react';
import clsx from 'clsx';

export function AudioMessageBubble({ audioUrl, language }) {
  const containerRef = useRef(null);
  const wavesurfer = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  const formatTime = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    if (!audioUrl || isDownloading) return;

    try {
      setIsDownloading(true);

      // 1. Fetch the file manually as a Blob
      const response = await fetch(audioUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();

      // 2. Create a temporary URL for that Blob
      const blobUrl = window.URL.createObjectURL(blob);

      // 3. Force download using the Blob URL
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `audio-${Date.now()}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 4. Cleanup
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed', error);
      // Fallback: If blob fetch fails, try opening in new tab
      window.open(audioUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    if (!containerRef.current || !audioUrl) return;

    setIsLoading(true);

    wavesurfer.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'rgba(55, 65, 81, 0.3)',
      progressColor: '#1f2937',
      cursorColor: '#1f2937',
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      height: 32,
      normalize: true,
    });

    wavesurfer.current.load(audioUrl).catch((err) => {
      if (err.name === 'AbortError' || err.message === 'Fetch is aborted') {
        return;
      }
      console.error('WaveSurfer load error:', err);
      setIsLoading(false);
    });

    wavesurfer.current.on('ready', () => {
      setIsLoading(false);
      setDuration(wavesurfer.current.getDuration());
    });

    wavesurfer.current.on('audioprocess', () => {
      setCurrentTime(wavesurfer.current.getCurrentTime());
    });

    wavesurfer.current.on('finish', () => {
      setIsPlaying(false);
    });

    wavesurfer.current.on('play', () => setIsPlaying(true));
    wavesurfer.current.on('pause', () => setIsPlaying(false));

    return () => {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
      }
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (wavesurfer.current) {
      wavesurfer.current.playPause();
    }
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3 w-full max-w-full h-10 sm:h-12 overflow-hidden">
      {language && (
        <div className="flex items-center h-full pr-2 sm:pr-3 border-r border-gray-300 flex-shrink-0">
          <span className="text-[12px] sm:text-[14px] font-mono font-bold uppercase tracking-widest text-gray-800">
            {language}
          </span>
        </div>
      )}

      <button
        onClick={togglePlay}
        className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors"
      >
        {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
      </button>

      <div className="flex-1 relative h-[32px] flex items-center min-w-0 overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Loader2 className="animate-spin text-gray-600" size={20} />
          </div>
        )}

        <div
          ref={containerRef}
          className={clsx(
            "w-full transition-opacity duration-500",
            isLoading ? "opacity-0" : "opacity-100"
          )}
        />
      </div>

      <span className="text-[10px] sm:text-xs font-mono text-gray-700 w-[28px] sm:w-[32px] text-right tabular-nums flex-shrink-0">
        {formatTime(isPlaying ? currentTime : duration)}
      </span>

      <button
        onClick={handleDownload}
        disabled={isDownloading || isLoading}
        className="flex-shrink-0 p-1 sm:p-1.5 rounded-full hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors"
        title="Download Audio"
      >
        {isDownloading ? (
          <Loader2 size={14} className="sm:w-4 sm:h-4 animate-spin" />
        ) : (
          <Download size={14} className="sm:w-4 sm:h-4" />
        )}
      </button>
    </div>
  );
};