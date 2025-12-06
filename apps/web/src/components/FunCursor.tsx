import { useEffect, useRef } from 'react';

export default function FunCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -100, y: -100 });
  const cursorRef = useRef({ x: -100, y: -100 });
  const trailRef = useRef<{ x: number; y: number; alpha: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    // Track mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop with smooth interpolation
    let animationId: number;
    
    const lerp = (start: number, end: number, factor: number) => {
      return start + (end - start) * factor;
    };

    const animate = () => {
      // Smooth cursor following (lerp)
      cursorRef.current.x = lerp(cursorRef.current.x, mouseRef.current.x, 0.15);
      cursorRef.current.y = lerp(cursorRef.current.y, mouseRef.current.y, 0.15);

      // Add to trail
      trailRef.current.unshift({
        x: cursorRef.current.x,
        y: cursorRef.current.y,
        alpha: 1,
      });

      // Limit trail length and fade out
      if (trailRef.current.length > 20) {
        trailRef.current.pop();
      }

      // Fade trail points
      trailRef.current.forEach((point, i) => {
        point.alpha = 1 - (i / trailRef.current.length);
      });

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw smooth trail
      if (trailRef.current.length > 1) {
        ctx.beginPath();
        ctx.moveTo(trailRef.current[0].x, trailRef.current[0].y);

        // Smooth curve through points
        for (let i = 1; i < trailRef.current.length - 1; i++) {
          const xc = (trailRef.current[i].x + trailRef.current[i + 1].x) / 2;
          const yc = (trailRef.current[i].y + trailRef.current[i + 1].y) / 2;
          ctx.quadraticCurveTo(trailRef.current[i].x, trailRef.current[i].y, xc, yc);
        }

        // Gradient stroke
        const gradient = ctx.createLinearGradient(
          trailRef.current[trailRef.current.length - 1].x,
          trailRef.current[trailRef.current.length - 1].y,
          trailRef.current[0].x,
          trailRef.current[0].y
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.8)');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }

      // Draw main cursor dot with subtle glow
      const { x, y } = cursorRef.current;
      
      // Outer glow
      const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, 24);
      glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      glowGradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.1)');
      glowGradient.addColorStop(1, 'transparent');
      
      ctx.beginPath();
      ctx.arc(x, y, 24, 0, Math.PI * 2);
      ctx.fillStyle = glowGradient;
      ctx.fill();

      // Inner dot
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fill();

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
    />
  );
}
