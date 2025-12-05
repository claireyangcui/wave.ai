import { useEffect, useRef } from 'react';
import type { WaveformData } from '@wave-ai/shared';

interface WaveformVisualizerProps {
  waveform: WaveformData;
  isPlaying: boolean;
  currentTime: number;
}

export default function WaveformVisualizer({
  waveform,
  isPlaying,
  currentTime,
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const barWidth = width / waveform.peaks.length;
      const currentIndex = Math.floor((currentTime / waveform.duration) * waveform.peaks.length);

      waveform.peaks.forEach((peak, index) => {
        const barHeight = peak * height * 0.8;
        const x = index * barWidth;
        const isActive = isPlaying && Math.abs(index - currentIndex) < 3;

        ctx.fillStyle = isActive
          ? 'rgba(0, 245, 255, 0.8)'
          : index < currentIndex
          ? 'rgba(168, 85, 247, 0.6)'
          : 'rgba(255, 255, 255, 0.3)';

        ctx.fillRect(x, (height - barHeight) / 2, barWidth - 1, barHeight);
      });
    };

    draw();

    if (isPlaying) {
      const animate = () => {
        draw();
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animate();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [waveform, isPlaying, currentTime]);

  return (
    <div className="w-full h-24 bg-gray-900 rounded-lg p-4">
      <canvas
        ref={canvasRef}
        width={800}
        height={96}
        className="w-full h-full"
      />
    </div>
  );
}

