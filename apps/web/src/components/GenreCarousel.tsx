import { useState, useRef, useEffect } from 'react';
import type { Instrument, DJPreset, MarketMoment } from '@wave-ai/shared';
import { api } from '../lib/api';
import MarketDataSelector from './MarketDataSelector';
import LoadingSpinner from './LoadingSpinner';
import { toast } from './Toast';

const INSTRUMENTS: Instrument[] = ['BTC', 'ETH', 'SOL', 'AVAX', 'MATIC'];

interface GenreConfig {
  preset: DJPreset;
  name: string;
  tagline: string;
  description: string;
  gradient: string;
  accentColor: string;
  // Video placeholder - you can replace these with actual video URLs
  // Place video files in: /apps/web/public/videos/
  videoUrl: string;
}

const GENRES: GenreConfig[] = [
  {
    preset: 'neon-house',
    name: 'NEON HOUSE',
    tagline: 'Electric Dreams',
    description: 'High-energy electronic beats with vibrant synths and pulsating rhythms',
    gradient: 'from-fuchsia-600/40 via-transparent to-cyan-500/40',
    accentColor: '#ff00ff',
    // Replace with your video: /apps/web/public/videos/neon-house.mp4
    videoUrl: '/videos/neon-house.mp4',
  },
  {
    preset: 'lo-fi-drift',
    name: 'LO-FI DRIFT',
    tagline: 'Smooth Waves',
    description: 'Chill, relaxed vibes with smooth textures and dreamy atmospheres',
    gradient: 'from-amber-600/40 via-transparent to-teal-500/40',
    accentColor: '#00ffd5',
    // Replace with your video: /apps/web/public/videos/lo-fi-drift.mp4
    videoUrl: '/videos/lo-fi-drift.mp4',
  },
  {
    preset: 'industrial-tech',
    name: 'INDUSTRIAL TECH',
    tagline: 'Machine Soul',
    description: 'Dark, mechanical sounds with heavy percussion and raw energy',
    gradient: 'from-red-600/40 via-transparent to-zinc-500/40',
    accentColor: '#ff3333',
    // Replace with your video: /apps/web/public/videos/industrial-tech.mp4
    videoUrl: '/videos/industrial-tech.mp4',
  },
];

interface GenreCarouselProps {
  onMomentGenerated: (moment: MarketMoment) => void;
}

export default function GenreCarousel({ onMomentGenerated }: GenreCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument>('BTC');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentGenre = GENRES[currentIndex];

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % GENRES.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + GENRES.length) % GENRES.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Touch/Mouse handlers for swipe
  const handleDragStart = (clientX: number) => {
    setIsDragging(true);
    setStartX(clientX);
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging) return;
    const diff = clientX - startX;
    setTranslateX(diff);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const threshold = 100;
    if (translateX > threshold) {
      goToPrevious();
    } else if (translateX < -threshold) {
      goToNext();
    }
    setTranslateX(0);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const moment = await api.generate({
        instrument: selectedInstrument,
        djPreset: currentGenre.preset,
      });
      onMomentGenerated(moment);
      toast.success('Market moment generated!');
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || 'Failed to generate moment');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-black select-none"
      onMouseDown={(e) => handleDragStart(e.clientX)}
      onMouseMove={(e) => handleDragMove(e.clientX)}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
      onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
      onTouchEnd={handleDragEnd}
    >
      {/* Background Video/Gradient Layer */}
      <div className="absolute inset-0 transition-all duration-700 ease-out">
        {/* Video Background */}
        <video
          key={currentGenre.preset}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          poster="/videos/poster.jpg"
        >
          <source src={currentGenre.videoUrl} type="video/mp4" />
        </video>
        
        {/* Fallback gradient if video doesn't load */}
        <div className={`absolute inset-0 bg-gradient-to-br ${currentGenre.gradient} mix-blend-overlay`} />
        
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Slide indicators */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {GENRES.map((genre, index) => (
          <button
            key={genre.preset}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 ${
              index === currentIndex 
                ? 'w-8 h-2 bg-white rounded-full' 
                : 'w-2 h-2 bg-white/40 rounded-full hover:bg-white/60'
            }`}
            aria-label={`Go to ${genre.name}`}
          />
        ))}
      </div>


      {/* Main Content */}
      <div 
        className="relative z-10 h-full flex flex-col justify-center items-center px-8"
        style={{ 
          transform: isDragging ? `translateX(${translateX}px)` : 'translateX(0)',
          transition: isDragging ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {/* Genre Title */}
        <div className="text-center mb-12">
          <p 
            className="text-sm uppercase tracking-[0.4em] mb-4 font-medium"
            style={{ color: currentGenre.accentColor }}
          >
            {currentGenre.tagline}
          </p>
          <h1 className="text-7xl md:text-9xl font-black text-white tracking-wide mb-6 leading-none">
            {currentGenre.name}
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-xl mx-auto font-light">
            {currentGenre.description}
          </p>
        </div>

        {/* Market Data Selector */}
        <div className="mb-8 w-full max-w-md">
          <MarketDataSelector
            instruments={INSTRUMENTS}
            selected={selectedInstrument}
            onSelect={setSelectedInstrument}
          />
        </div>

        {/* Remix Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="group relative px-16 py-5 text-lg font-bold uppercase tracking-[0.2em] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden bg-white text-black hover:bg-white/90"
          style={{
            boxShadow: '0 0 40px rgba(255,255,255,0.3)',
          }}
        >
          {/* Button glow effect */}
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: 'linear-gradient(135deg, transparent, rgba(255,255,255,0.4), transparent)',
            }}
          />
          
          <span className="relative">
            {isGenerating ? (
              <span className="flex items-center gap-3">
                <LoadingSpinner />
                <span>Generating...</span>
              </span>
            ) : (
              <span>Remix</span>
            )}
          </span>
        </button>

        {/* Swipe hint */}
        <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 text-sm tracking-widest uppercase">
          Swipe or use arrow keys to browse genres
        </p>
      </div>

      {/* Side navigation - clickable genre names */}
      <button
        onClick={goToPrevious}
        className="absolute left-0 top-1/2 -translate-y-1/2 w-24 h-64 z-20 group cursor-pointer"
        aria-label="Previous genre"
      >
        <div className="h-full flex items-center justify-center">
          <span className="text-white/30 text-xl font-bold -rotate-90 whitespace-nowrap transition-all group-hover:text-white/70 group-hover:scale-105">
            {GENRES[(currentIndex - 1 + GENRES.length) % GENRES.length].name}
          </span>
        </div>
      </button>
      
      <button
        onClick={goToNext}
        className="absolute right-0 top-1/2 -translate-y-1/2 w-24 h-64 z-20 group cursor-pointer"
        aria-label="Next genre"
      >
        <div className="h-full flex items-center justify-center">
          <span className="text-white/30 text-xl font-bold rotate-90 whitespace-nowrap transition-all group-hover:text-white/70 group-hover:scale-105">
            {GENRES[(currentIndex + 1) % GENRES.length].name}
          </span>
        </div>
      </button>
    </div>
  );
}

