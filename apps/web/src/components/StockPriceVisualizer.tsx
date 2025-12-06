import { useEffect, useRef, useState } from 'react';
import type { MarketMoment } from '@wave-ai/shared';
import { formatCurrency, formatPercent } from '@wave-ai/shared';
import { TrendingUp, TrendingDown, Waves } from 'lucide-react';

interface StockPriceVisualizerProps {
  moment: MarketMoment;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

/**
 * Generate a realistic price line based on market data
 * Creates a smooth price movement that reflects volatility and price change
 */
function generatePriceLine(
  basePrice: number,
  priceChangePercent: number,
  volatility: number,
  numPoints: number = 300
): number[] {
  const prices: number[] = [];
  const targetPrice = basePrice * (1 + priceChangePercent / 100);
  
  // Start from a slightly lower price and move towards target
  const startPrice = basePrice * 0.98;
  const endPrice = targetPrice;
  
  // Add some noise based on volatility
  const noiseScale = volatility * basePrice * 0.01;
  
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    
    // Smooth interpolation with some oscillation
    const smoothProgress = t * t * (3 - 2 * t); // Smoothstep
    const baseValue = startPrice + (endPrice - startPrice) * smoothProgress;
    
    // Add volatility-based noise
    const noise = (Math.sin(t * Math.PI * 4) + Math.cos(t * Math.PI * 6)) * noiseScale * 0.3;
    const randomNoise = (Math.random() - 0.5) * noiseScale * 0.2;
    
    prices.push(baseValue + noise + randomNoise);
  }
  
  return prices;
}

export default function StockPriceVisualizer({
  moment,
  isPlaying,
  currentTime,
  duration,
}: StockPriceVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const priceLineRef = useRef<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [canvasReady, setCanvasReady] = useState(false);

  // Generate price line once when moment changes
  useEffect(() => {
    if (moment) {
      priceLineRef.current = generatePriceLine(
        moment.marketData.price,
        moment.marketData.priceChangePercent24h,
        moment.marketData.volatility
      );
      setAnimatedProgress(0);
      setCanvasReady(false); // Reset canvas ready state
    }
  }, [moment]);

  // Animate progress smoothly
  useEffect(() => {
    if (!isPlaying) return;
    
    const progress = duration > 0 ? currentTime / duration : 0;
    const targetProgress = Math.min(progress, 1);
    
    const animate = () => {
      setAnimatedProgress((prev) => {
        const diff = targetProgress - prev;
        if (Math.abs(diff) < 0.001) return targetProgress;
        return prev + diff * 0.1; // Smooth interpolation
      });
    };
    
    const interval = setInterval(animate, 16);
    return () => clearInterval(interval);
  }, [isPlaying, currentTime, duration]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const updateCanvasSize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width - 64; // Account for padding
      const height = 400;
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };

    // Use setTimeout to ensure container is rendered
    const timeoutId = setTimeout(() => {
      updateCanvasSize();
      setCanvasReady(true);
    }, 100);

    window.addEventListener('resize', updateCanvasSize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [moment]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || priceLineRef.current.length === 0 || !canvasReady) return;
    
    // Ensure canvas has valid dimensions
    if (canvas.width === 0 || canvas.height === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    
    // Reset transform before scaling
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const prices = priceLineRef.current;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    const padding = { top: 60, right: 40, bottom: 60, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Calculate price bounds
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;
    const pricePadding = priceRange * 0.15;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Calculate current progress (inverted: 1 - progress so it moves right to left)
      const progress = Math.min(animatedProgress, 1);
      const currentIndex = Math.floor((1 - progress) * (prices.length - 1));

      // Draw subtle grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
      }

      // Create smooth path
      const createSmoothPath = (points: number[], endIndex: number) => {
        if (points.length === 0) return;
        
        ctx.beginPath();
        for (let i = 0; i <= endIndex && i < points.length; i++) {
          const x = padding.left + (i / (points.length - 1)) * chartWidth;
          const normalizedPrice = (points[i] - minPrice + pricePadding) / (priceRange + pricePadding * 2);
          const y = padding.top + chartHeight - normalizedPrice * chartHeight;
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
      };

      // Draw gradient fill under the line
      // Since indicator moves right to left, fill from currentIndex (right side) to the end
      if (isPlaying) {
        // Fill from current position (right) to the end
        ctx.beginPath();
        for (let i = currentIndex; i < prices.length; i++) {
          const x = padding.left + (i / (prices.length - 1)) * chartWidth;
          const normalizedPrice = (prices[i] - minPrice + pricePadding) / (priceRange + pricePadding * 2);
          const y = padding.top + chartHeight - normalizedPrice * chartHeight;
          
          if (i === currentIndex) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
        ctx.lineTo(padding.left + (currentIndex / (prices.length - 1)) * chartWidth, padding.top + chartHeight);
        ctx.closePath();
      } else {
        // When not playing, show full line
        createSmoothPath(prices, prices.length - 1);
        ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
        ctx.lineTo(padding.left, padding.top + chartHeight);
        ctx.closePath();
      }
      
      if (true) {

        const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
        const isPositive = moment.marketData.priceChangePercent24h >= 0;
        gradient.addColorStop(0, isPositive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)');
        gradient.addColorStop(1, isPositive ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)');
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      // Draw price line (past) - smooth and thick
      // Always draw at least the full line when not playing
      const drawIndex = isPlaying ? currentIndex : prices.length - 1;
      ctx.strokeStyle = moment.marketData.priceChangePercent24h >= 0 ? '#22c55e' : '#ef4444';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      createSmoothPath(prices, drawIndex);
      ctx.stroke();

      // Draw price line (future - dimmed) - only when playing
      if (isPlaying && currentIndex < prices.length - 1) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = currentIndex; i < prices.length; i++) {
          const x = padding.left + (i / (prices.length - 1)) * chartWidth;
          const normalizedPrice = (prices[i] - minPrice + pricePadding) / (priceRange + pricePadding * 2);
          const y = padding.top + chartHeight - normalizedPrice * chartHeight;
          
          if (i === currentIndex) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      // Draw current position indicator with glow
      if (isPlaying && currentIndex < prices.length && currentIndex >= 0) {
        const currentX = padding.left + (currentIndex / (prices.length - 1)) * chartWidth;
        const currentPrice = prices[currentIndex];
        const normalizedPrice = (currentPrice - minPrice + pricePadding) / (priceRange + pricePadding * 2);
        const currentY = padding.top + chartHeight - normalizedPrice * chartHeight;

        // Draw vertical line at current position with gradient
        const lineGradient = ctx.createLinearGradient(currentX, padding.top, currentX, padding.top + chartHeight);
        lineGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        lineGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
        lineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.strokeStyle = lineGradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(currentX, padding.top);
        ctx.lineTo(currentX, padding.top + chartHeight);
        ctx.stroke();

        // Draw glowing dot at current price point
        const dotGradient = ctx.createRadialGradient(currentX, currentY, 0, currentX, currentY, 15);
        dotGradient.addColorStop(0, '#ffffff');
        dotGradient.addColorStop(0.5, moment.marketData.priceChangePercent24h >= 0 ? '#22c55e' : '#ef4444');
        dotGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = dotGradient;
        ctx.beginPath();
        ctx.arc(currentX, currentY, 15, 0, Math.PI * 2);
        ctx.fill();

        // Draw white center dot
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(currentX, currentY, 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw price label with background
        const priceText = formatCurrency(currentPrice);
        ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const textMetrics = ctx.measureText(priceText);
        const textWidth = textMetrics.width;
        const textHeight = 24;
        const textX = currentX;
        const textY = currentY - 30;
        
        // Draw rounded rectangle background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        const rectX = textX - textWidth / 2 - 8;
        const rectY = textY - textHeight / 2;
        const rectWidth = textWidth + 16;
        const rectHeight = textHeight;
        const radius = 8;
        ctx.beginPath();
        ctx.moveTo(rectX + radius, rectY);
        ctx.lineTo(rectX + rectWidth - radius, rectY);
        ctx.quadraticCurveTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + radius);
        ctx.lineTo(rectX + rectWidth, rectY + rectHeight - radius);
        ctx.quadraticCurveTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - radius, rectY + rectHeight);
        ctx.lineTo(rectX + radius, rectY + rectHeight);
        ctx.quadraticCurveTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - radius);
        ctx.lineTo(rectX, rectY + radius);
        ctx.quadraticCurveTo(rectX, rectY, rectX + radius, rectY);
        ctx.closePath();
        ctx.fill();
        
        // Draw price text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(priceText, textX, textY);
      }

      // Draw price labels on Y-axis
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (let i = 0; i <= 4; i++) {
        const price = minPrice - pricePadding + (priceRange + pricePadding * 2) * (1 - i / 4);
        const y = padding.top + (chartHeight / 4) * i;
        ctx.fillText(formatCurrency(price), padding.left - 12, y);
      }
    };

    // Initial draw
    draw();

    if (isPlaying) {
      const animate = () => {
        draw();
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [moment, isPlaying, animatedProgress, canvasReady]);

  const isPositive = moment.marketData.priceChangePercent24h >= 0;
  const { musicParams, marketData } = moment;

  // Calculate visual pulse based on playback
  const pulseIntensity = isPlaying ? 1 + Math.sin(currentTime * Math.PI * 2) * 0.1 : 1;

  return (
    <div className="w-full bg-black">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header with Market Data */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">
                {moment.instrument}
              </h2>
              <p className="text-sm text-gray-400 uppercase tracking-widest">
                Market → Music Sonification
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white mb-1">
                {formatCurrency(marketData.price)}
              </div>
              <div className={`flex items-center gap-1 justify-end ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="text-sm font-semibold">
                  {formatPercent(marketData.priceChangePercent24h)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Card */}
        <div 
          ref={containerRef} 
          className="relative bg-gradient-to-br from-gray-900/50 via-gray-900/30 to-black rounded-2xl p-8 backdrop-blur-sm border border-white/5 shadow-2xl overflow-hidden"
          style={{
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
          }}
        >
          {/* Animated gradient overlay */}
          <div 
            className="absolute inset-0 opacity-30 pointer-events-none transition-opacity"
            style={{
              background: `linear-gradient(135deg, ${
                isPositive 
                  ? 'rgba(34, 197, 94, 0.1)' 
                  : 'rgba(239, 68, 68, 0.1)'
              } 0%, transparent 50%)`,
              opacity: isPlaying ? 0.3 + Math.sin(currentTime * 4) * 0.1 : 0.3,
            }}
          />
          
          <canvas
            ref={canvasRef}
            className="relative z-10 w-full"
            style={{ height: '400px', display: 'block' }}
          />
        </div>

        {/* Explanation Card */}
        <div className="mt-8 bg-gray-900/30 rounded-xl p-6 border border-white/5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <Waves className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2 uppercase tracking-wider text-sm">
                How This Sound Was Created
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {moment.explanation}
              </p>
            </div>
          </div>
        </div>

        {/* DJ Style Badge */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10">
            <span className="text-sm text-gray-400">DJ Style: </span>
            <span className="text-sm text-white font-semibold uppercase tracking-wider">
              {moment.dj.replace('-', ' ')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
