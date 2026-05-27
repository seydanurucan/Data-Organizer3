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

    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>{}[]/\\|$#@!';
    const charArr = chars.split('');
    const fontSize = 13;

    type Drop = { y: number; speed: number; opacity: number; length: number };
    let columns: number;
    let drops: Drop[];

    const init = () => {
      columns = Math.floor(canvas.width / fontSize);
      drops = Array.from({ length: columns }, () => ({
        y: Math.random() * -canvas.height,
        speed: 0.4 + Math.random() * 0.8,
        opacity: 0.05 + Math.random() * 0.2,
        length: 8 + Math.floor(Math.random() * 20),
      }));
    };
    init();
    window.addEventListener('resize', init);

    let animId: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < drops.length; i++) {
        const drop = drops[i];
        const x = i * fontSize;

        for (let j = drop.length; j >= 0; j--) {
          const y = drop.y - j * fontSize;
          if (y < 0 || y > canvas.height) continue;

          const tail = j / drop.length;
          if (j === 0) {
            ctx.fillStyle = `rgba(180, 255, 200, ${drop.opacity * 3.5})`;
          } else if (j < 3) {
            ctx.fillStyle = `rgba(0, 255, 65, ${drop.opacity * (1 - tail * 0.4)})`;
          } else {
            ctx.fillStyle = `rgba(0, 180, 50, ${drop.opacity * (1 - tail)})`;
          }
          ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
          ctx.fillText(charArr[Math.floor(Math.random() * charArr.length)], x, y);
        }

        drop.y += fontSize * drop.speed;
        if (drop.y - drop.length * fontSize > canvas.height) {
          drops[i] = {
            y: -Math.random() * canvas.height * 0.5,
            speed: 0.4 + Math.random() * 0.8,
            opacity: 0.05 + Math.random() * 0.2,
            length: 8 + Math.floor(Math.random() * 20),
          };
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
      style={{ zIndex: 0, opacity: 0.55 }}
    />
  );
}
