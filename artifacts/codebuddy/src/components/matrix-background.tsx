import { useEffect, useRef } from 'react';

export function MatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ01';
    const charArr = chars.split('');
    const fontSize = 11;

    type Drop = { y: number; speed: number };
    let drops: Drop[] = [];

    const init = () => {
      const columns = Math.floor(canvas.width / fontSize);
      drops = Array.from({ length: columns }, () => ({
        y: Math.random() * canvas.height,
        speed: 0.12 + Math.random() * 0.18,
      }));
    };
    init();
    window.addEventListener('resize', init);

    let animId: number;

    const draw = () => {
      ctx.fillStyle = 'rgba(5, 9, 6, 0.18)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < drops.length; i++) {
        const drop = drops[i];
        const x = i * fontSize;
        const y = drop.y;

        const alpha = 0.06 + Math.random() * 0.07;
        ctx.fillStyle = `rgba(0, 220, 55, ${alpha})`;
        ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
        ctx.fillText(charArr[Math.floor(Math.random() * charArr.length)], x, y);

        drop.y += fontSize * drop.speed;
        if (drop.y > canvas.height) {
          drop.y = -fontSize;
          drop.speed = 0.12 + Math.random() * 0.18;
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('resize', init);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, opacity: 1 }}
    />
  );
}
