import { useState, useEffect, useRef } from 'react';
import GenreCarousel from './components/GenreCarousel';
import NowPlaying from './components/NowPlaying';
import StockPriceVisualizer from './components/StockPriceVisualizer';
import ToastContainer from './components/Toast';
import FunCursor from './components/FunCursor';
import type { MarketMoment } from '@wave-ai/shared';
import { api } from './lib/api';

function App() {
  const [currentMoment, setCurrentMoment] = useState<MarketMoment | null>(null);
  const [moments, setMoments] = useState<MarketMoment[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const visualizationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMoments();
  }, []);

  // Show controls when visualization section is visible
  useEffect(() => {
    if (!visualizationRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowControls(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(visualizationRef.current);
    return () => observer.disconnect();
  }, [currentMoment]);

  const loadMoments = async () => {
    try {
      const data = await api.getMoments();
      setMoments(data);
    } catch (error) {
      console.error('Failed to load moments:', error);
    }
  };

  const handleMomentGenerated = (moment: MarketMoment) => {
    setCurrentMoment(moment);
    setMoments(prev => [moment, ...prev]);
    setIsPlaying(true);
    
    // Scroll to visualization section after a short delay
    setTimeout(() => {
      visualizationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 500);
  };

  return (
    <div className="min-h-screen bg-black overflow-y-auto cursor-none">
      <FunCursor />
      <div className="h-screen">
        <GenreCarousel onMomentGenerated={handleMomentGenerated} />
      </div>
      
      {currentMoment && (
        <>
          <div ref={visualizationRef} className="pb-24 bg-black">
            <StockPriceVisualizer
              moment={currentMoment}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
            />
          </div>
          
          {/* Fixed music controls at bottom - only visible when scrolled down */}
          <div 
            className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${
              showControls ? 'translate-y-0' : 'translate-y-full'
            }`}
          >
            <NowPlaying
              moment={currentMoment}
              isPlaying={isPlaying}
              onPlayPause={setIsPlaying}
              onTimeUpdate={setCurrentTime}
              onDurationChange={setDuration}
            />
          </div>
        </>
      )}
      
      <ToastContainer />
    </div>
  );
}

export default App;
