import { useState } from 'react';
import { Play, X } from 'lucide-react';

interface YouTubePlayerProps {
  url: string;
  title?: string;
  className?: string;
}

/**
 * Extracts the YouTube video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://youtube.com/shorts/VIDEO_ID
 */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

/**
 * Light YouTube embed — shows a thumbnail with a play button.
 * On click, loads the full iframe player.
 */
export function YouTubePlayer({ url, title, className }: YouTubePlayerProps) {
  const [playing, setPlaying] = useState(false);
  const videoId = extractYouTubeId(url);

  if (!videoId) {
    // Not a YouTube URL — fall back to a simple link
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-primary-600 underline hover:text-primary-800"
      >
        <Play className="h-3 w-3" /> Ver vídeo
      </a>
    );
  }

  if (playing) {
    return (
      <div className={`relative aspect-video w-full overflow-hidden rounded-lg ${className ?? ''}`}>
        <button
          onClick={() => setPlaying(false)}
          className="absolute right-2 top-2 z-10 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
        >
          <X className="h-4 w-4" />
        </button>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title ?? 'Vídeo do exercício'}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setPlaying(true)}
      className={`group relative aspect-video w-full overflow-hidden rounded-lg bg-gray-900 ${className ?? ''}`}
    >
      <img
        src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
        alt={title ?? 'Vídeo'}
        className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
        loading="lazy"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition-transform group-hover:scale-110">
          <Play className="h-6 w-6 ml-0.5" fill="currentColor" />
        </div>
      </div>
      {title && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
          <p className="text-xs text-white truncate">{title}</p>
        </div>
      )}
    </button>
  );
}

/** Compact video link — shows small play button + text. Clicking opens the embed inline. */
export function VideoLink({ url, label }: { url: string; label?: string }) {
  const [expanded, setExpanded] = useState(false);
  const videoId = extractYouTubeId(url);

  if (expanded && videoId) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setExpanded(false)}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          ✕ Fechar vídeo
        </button>
        <YouTubePlayer url={url} className="max-w-sm" />
      </div>
    );
  }

  return (
    <button
      onClick={() => videoId ? setExpanded(true) : window.open(url, '_blank')}
      className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
    >
      <Play className="h-3 w-3" />
      {label ?? 'Ver vídeo'}
    </button>
  );
}
