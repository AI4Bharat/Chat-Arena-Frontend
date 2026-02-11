import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, Download, Loader2, Volume2 } from 'lucide-react';
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
      waveColor: 'rgba(55, 65, 81, 0.25)',
      progressColor: 'rgba(55, 65, 81, 0.9)',
      cursorColor: 'rgba(55, 65, 81, 0.8)',
      barWidth: 2,
      barGap: 1,
      barRadius: 1,
      height: 28,
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
    <div className="flex items-center gap-2 w-full">
      {/* Audio Label Badge */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-200 rounded-lg flex-shrink-0">
        <Volume2 size={13} className="text-gray-700" />
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-700 hidden sm:inline">Audio</span>
      </div>

      {/* Play Button */}
      <button
        onClick={togglePlay}
        className="flex-shrink-0 p-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 transition-all duration-200 hover:scale-110 active:scale-95"
        aria-label={isPlaying ? "Pause audio" : "Play audio"}
      >
        {isLoading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : isPlaying ? (
          <Pause size={14} fill="currentColor" />
        ) : (
          <Play size={14} fill="currentColor" className="ml-0.5" />
        )}
      </button>

      {/* Waveform */}
      <div className="flex-1 relative h-[28px] flex items-center rounded-lg overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-100/50">
            <span className="text-[10px] text-gray-600">Loading...</span>
          </div>
        )}
        <div
          ref={containerRef}
          className={clsx(
            "w-full h-full transition-all duration-300",
            isLoading ? "opacity-20" : "opacity-100"
          )}
        />
      </div>

      {/* Duration */}
      <span className="text-xs font-mono font-semibold text-gray-700 min-w-[38px] text-right tabular-nums flex-shrink-0">
        {formatTime(isPlaying ? currentTime : duration)}
      </span>

      {/* Download Button */}
      <button
        onClick={handleDownload}
        disabled={isDownloading || isLoading}
        className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-all duration-200 hover:scale-110 active:scale-95 disabled:opacity-50"
        title="Download Audio"
        aria-label="Download audio"
      >
        {isDownloading ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Download size={14} />
        )}
      </button>
    </div>
  );
};