import { useEffect, useRef } from 'react';

export default function MouseBacklight({ theme = 'dark' }) {
  const divRef = useRef(null);
  const themeRef = useRef(theme);
  
  useEffect(() => { themeRef.current = theme; }, [theme]);

  useEffect(() => {
    const el = divRef.current;
    if (!el) return;
    
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    
    const onMouseMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    let raf;
    const tick = () => {
      const isLight = themeRef.current === 'light';
      el.style.background = isLight
        ? `radial-gradient(480px circle at ${mx}px ${my}px, rgba(150,140,230,0.10), transparent 50%)`
        : `radial-gradient(520px circle at ${mx}px ${my}px, rgba(90,80,180,0.14), transparent 50%)`;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={divRef}
      className="backlight-layer"
      style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }}
    />
  );
}
