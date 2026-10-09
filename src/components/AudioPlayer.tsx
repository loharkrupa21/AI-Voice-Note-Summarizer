// src/components/AudioPlayer.tsx
import React, { useRef, useState, useEffect } from "react";
import { Play, Pause } from "lucide-react";

interface AudioPlayerProps {
  /** URL, Blob, or MediaStream to play */
  src: string | Blob;
  /** Optional label displayed next to the controls */
  label?: string;
}

export default function AudioPlayer({ src, label }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Convert Blob to object URL when needed
  const [url, setUrl] = useState<string>("");
  useEffect(() => {
    if (src instanceof Blob) {
      const objectUrl = URL.createObjectURL(src);
      setUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setUrl(src as string);
    }
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${mins}:${secs}`;
  };

  return (
    <div className="flex items-center space-x-3">
      {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
      <button
        onClick={togglePlay}
        className="p-2 rounded-full bg-primary text-white hover:bg-secondary"
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? <Pause size={18} /> : <Play size={18} />}
      </button>
      <div className="flex-1">
        <input
          type="range"
          min={0}
          max={duration}
          step={0.1}
          value={currentTime}
          onChange={e => {
            const t = Number(e.target.value);
            if (audioRef.current) audioRef.current.currentTime = t;
            setCurrentTime(t);
          }}
          className="w-full"
        />
      </div>
      <span className="text-xs text-gray-600">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={() => setPlaying(false)}
        hidden
      />
    </div>
  );
}
