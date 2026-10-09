import { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  FastForward, 
  Rewind,
  Radio,
  Upload
} from 'lucide-react';

export default function AudioPlayer({ 
  audioUrl, 
  title = "Audio Recording", 
  duration = "02:35"
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [localAudioUrl, setLocalAudioUrl] = useState(null);
  const [localTitle, setLocalTitle] = useState('');
  const [playbackError, setPlaybackError] = useState('');

  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const localAudioUrlRef = useRef(null);
  const currentAudioUrl = localAudioUrl || audioUrl;
  const displayTitle = localTitle || title;

  // Format seconds to mm:ss
  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Convert duration string "2:35" to seconds if needed
  const parseDurationString = (str) => {
    if (typeof str === 'number') return str;
    if (!str) return 0;
    const parts = str.split(':').map(Number);
    const parsed = parts.length === 2
      ? parts[0] * 60 + parts[1]
      : parts.length === 3
        ? parts[0] * 3600 + parts[1] * 60 + parts[2]
        : 0;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  };

  const fallbackDurationSecs = parseDurationString(duration);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.volume = isMuted ? 0 : 1;
    }
  }, [playbackRate, isMuted]);

  useEffect(() => () => {
    if (localAudioUrlRef.current) URL.revokeObjectURL(localAudioUrlRef.current);
  }, []);

  const handleChooseFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validExtensions = ['mp3', 'wav', 'm4a', 'ogg', 'webm', 'aac', 'flac'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!file.type.startsWith('audio/') && !validExtensions.includes(extension)) {
      setPlaybackError('Please choose a valid audio file.');
      event.target.value = '';
      return;
    }

    if (localAudioUrlRef.current) URL.revokeObjectURL(localAudioUrlRef.current);
    const fileUrl = URL.createObjectURL(file);
    localAudioUrlRef.current = fileUrl;
    setLocalAudioUrl(fileUrl);
    setLocalTitle(file.name.replace(/\.[^/.]+$/, '') || 'Selected audio');
    setCurrentTime(0);
    setAudioDuration(0);
    setIsPlaying(false);
    setPlaybackError('');
    event.target.value = '';
  };

  // Handle play/pause
  const togglePlay = () => {
    if (!currentAudioUrl) {
      setPlaybackError('Choose an audio file to play.');
      return;
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        setPlaybackError('');
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch(() => {
              setIsPlaying(false);
              setPlaybackError('This audio could not be played. Try choosing another file.');
            });
        }
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && Number.isFinite(audioRef.current.duration) && audioRef.current.duration > 0) {
      setAudioDuration(audioRef.current.duration);
      return;
    }
    const seekableEnd = audioRef.current?.seekable?.length
      ? audioRef.current.seekable.end(audioRef.current.seekable.length - 1)
      : 0;
    setAudioDuration(Number.isFinite(seekableEnd) && seekableEnd > 0 ? seekableEnd : fallbackDurationSecs);
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    if (!Number.isFinite(newTime)) return;
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleSkip = (seconds) => {
    const target = Math.max(0, Math.min(currentTime + seconds, effectiveDuration));
    setCurrentTime(target);
    if (audioRef.current) {
      audioRef.current.currentTime = target;
    }
  };

  const handleSpeedToggle = () => {
    const speeds = [0.75, 1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    setPlaybackRate(speeds[nextIdx]);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const effectiveDuration = Number.isFinite(audioDuration) && audioDuration > 0
    ? audioDuration
    : fallbackDurationSecs;
  const progressPercent = effectiveDuration > 0
    ? Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100))
    : 0;

  return (
    <div className="modern-audio-player-card">
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm,.aac,.flac"
        onChange={handleChooseFile}
        style={{ display: 'none' }}
      />

      {currentAudioUrl && (
        <audio
          ref={audioRef}
          src={currentAudioUrl}
          onLoadStart={() => {
            setCurrentTime(0);
            setAudioDuration(0);
            setIsPlaying(false);
            setPlaybackError('');
          }}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onDurationChange={handleLoadedMetadata}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
          onError={() => {
            setIsPlaying(false);
            setPlaybackError('This audio could not be loaded. Try choosing another file.');
          }}
        />
      )}

      {/* Header Info */}
      <div className="player-top-meta">
        <div className="player-title-box">
          <div className="player-icon-pulse">
            <Radio size={18} className="pulse-signal-icon" />
          </div>
          <div>
            <h4 className="player-track-title">{displayTitle}</h4>
            <span className="player-track-sub">
              {isPlaying ? 'Playing Voice Note...' : 'Audio Ready for playback'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="player-choose-file-btn"
          >
            <Upload size={14} />
            Choose file
          </button>
          <button 
            className="speed-chip-btn" 
            onClick={handleSpeedToggle}
            title="Change playback speed"
          >
            {playbackRate}x
          </button>
        </div>
      </div>

      {playbackError && <p className="player-error-message" role="alert">{playbackError}</p>}

      {/* Waveform graphic visualization */}
      <div className="player-waveform-bar-container">
        {Array.from({ length: 36 }).map((_, idx) => {
          const height = Math.sin(idx * 0.4) * 18 + 22 + (idx % 3) * 6;
          const isPast = (idx / 36) * 100 <= progressPercent;
          return (
            <span
              key={idx}
              className={`waveform-stick ${isPast ? 'stick-active' : ''} ${isPlaying ? 'stick-animating' : ''}`}
              style={{
                height: `${height}px`,
                animationDelay: `${(idx % 6) * 0.12}s`
              }}
            ></span>
          );
        })}
      </div>

      {/* Scrubber track */}
      <div className="player-scrubber-row">
        <span className="player-timestamp">{formatTime(currentTime)}</span>
        <div className="scrubber-slider-wrapper">
          <input
            type="range"
            min="0"
            max={effectiveDuration || 1}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            disabled={!effectiveDuration}
            className="player-slider"
            style={{
              background: `linear-gradient(to right, #6366F1 ${progressPercent}%, #E2E8F0 ${progressPercent}%)`
            }}
          />
        </div>
        <span className="player-timestamp">{formatTime(effectiveDuration)}</span>
      </div>

      {/* Control buttons */}
      <div className="player-controls-row">
        <div className="controls-left-group">
          <button 
            className="player-btn player-sub-btn" 
            onClick={() => handleSkip(-5)}
            title="Rewind 5 seconds"
          >
            <Rewind size={18} />
            <span className="btn-tag">5s</span>
          </button>
        </div>

        {/* Main Play / Pause Button */}
        <div className="controls-center-group">
          <button 
            className={`player-main-play-btn ${isPlaying ? 'is-playing' : ''}`}
            onClick={togglePlay}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause size={22} fill="white" color="white" />
            ) : (
              <Play size={22} fill="white" color="white" style={{ marginLeft: '3px' }} />
            )}
          </button>
        </div>

        <div className="controls-right-group">
          <button 
            className="player-btn player-sub-btn" 
            onClick={() => handleSkip(5)}
            title="Forward 5 seconds"
          >
            <FastForward size={18} />
            <span className="btn-tag">5s</span>
          </button>

          <button 
            className="player-btn player-sub-btn" 
            onClick={toggleMute}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
