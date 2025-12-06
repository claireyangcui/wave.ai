import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Coins, Image as ImageIcon } from 'lucide-react';
import type { MarketMoment } from '@wave-ai/shared';
import { formatPercent, formatCurrency } from '@wave-ai/shared';
import TipModal from './TipModal';
import MintModal from './MintModal';
import { toast } from './Toast';

interface NowPlayingProps {
  moment: MarketMoment;
  isPlaying: boolean;
  onPlayPause: (playing: boolean) => void;
  onTimeUpdate?: (time: number) => void;
  onDurationChange?: (duration: number) => void;
}

export default function NowPlaying({ moment, isPlaying, onPlayPause, onTimeUpdate, onDurationChange }: NowPlayingProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showMintModal, setShowMintModal] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      onTimeUpdate?.(audio.currentTime);
    };
    const updateDuration = () => {
      setDuration(audio.duration);
      onDurationChange?.(audio.duration);
    };
    const handleEnded = () => {
      onPlayPause(false);
      setCurrentTime(0);
      onTimeUpdate?.(0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [moment.audioUrl, onPlayPause, onTimeUpdate, onDurationChange]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play();
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const newTime = percent * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className="h-24 bg-black flex items-center px-8">
        <audio ref={audioRef} src={moment.audioUrl} preload="metadata" />

        <div className="flex-1 flex items-center gap-6">
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white mb-1 uppercase tracking-wide text-sm">
              {moment.instrument} — {moment.dj.replace('-', ' ').toUpperCase()}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">
              {formatCurrency(moment.marketData.price)} • {formatPercent(moment.marketData.priceChangePercent24h)}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center gap-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onPlayPause(!isPlaying)}
              className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:bg-gray-200 transition-colors border-2 border-white"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
          </div>

          <div className="w-full max-w-md">
            <div
              className="h-0.5 bg-gray-800 cursor-pointer relative group"
              onClick={handleSeek}
            >
              <div
                className="h-full bg-white transition-all"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%`, marginLeft: '-4px' }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2 uppercase tracking-wider">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-end gap-3">
          <div className="flex items-center gap-3">
            <Volume2 className="w-4 h-4 text-gray-500" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20 accent-white"
            />
          </div>

          <div className="w-px h-6 bg-gray-800"></div>

          <button
            onClick={() => setShowTipModal(true)}
            className="px-4 py-2 bg-white text-black font-bold uppercase tracking-wider text-xs hover:bg-gray-200 transition-all flex items-center gap-2 border-2 border-white"
          >
            <Coins className="w-3 h-3" />
            <span>Tip</span>
          </button>

          <button
            onClick={() => setShowMintModal(true)}
            className="px-4 py-2 border-2 border-gray-700 text-gray-400 font-bold uppercase tracking-wider text-xs hover:border-gray-600 hover:text-white transition-all flex items-center gap-2"
          >
            <ImageIcon className="w-3 h-3" />
            <span>Mint</span>
          </button>
        </div>
      </div>

      {showTipModal && (
        <TipModal
          moment={moment}
          onClose={() => setShowTipModal(false)}
          onSuccess={() => {
            setShowTipModal(false);
            toast.success('Tip sent! Thank you for supporting the DJ 🎵');
          }}
        />
      )}

      {showMintModal && (
        <MintModal
          moment={moment}
          onClose={() => setShowMintModal(false)}
          onSuccess={() => {
            setShowMintModal(false);
            toast.success('NFT metadata generated!');
          }}
        />
      )}
    </>
  );
}

