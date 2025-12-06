import { useState, useEffect } from 'react';
import GenreCarousel from './components/GenreCarousel';
import NowPlaying from './components/NowPlaying';
import ToastContainer from './components/Toast';
import type { MarketMoment } from '@wave-ai/shared';
import { api } from './lib/api';

function App() {
  const [currentMoment, setCurrentMoment] = useState<MarketMoment | null>(null);
  const [moments, setMoments] = useState<MarketMoment[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    loadMoments();
  }, []);

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
  };

  return (
    <div className="h-screen overflow-hidden bg-black">
      <GenreCarousel onMomentGenerated={handleMomentGenerated} />
      
      {currentMoment && (
        <NowPlaying
          moment={currentMoment}
          isPlaying={isPlaying}
          onPlayPause={setIsPlaying}
        />
      )}
      
      <ToastContainer />
    </div>
  );
}

export default App;
