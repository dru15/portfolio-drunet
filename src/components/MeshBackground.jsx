import React, { useEffect, useRef } from 'react';

const COLS = 28;
const ROWS = 18;
const INFLUENCE_RADIUS = 200;
const MAX_WARP = 38;
const DAMPING = 0.035;

const PALETTE = {
  dark: {
    dot: [0, 255, 136],
    lineStart: [0, 255, 136],
    lineEnd: [0, 212, 255],
  },
  light: {
    dot: [0, 160, 90],
    lineStart: [0, 170, 95],
    lineEnd: [0, 140, 200],
  },
};

export default function MeshBackground({ mousePos, theme = 'dark' }) {
  const canvasRef = useRef(null);
  const meshRef = useRef([]);
  const rafRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const themeRef = useRef(theme);

  useEffect(() => {
    mouseRef.current = mousePos;
  }, [mousePos]);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let W = window.innerWidth;
    let H = window.innerHeight;

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
      buildMesh();
    };

    const buildMesh = () => {
      meshRef.current = [];
      for (let row = 0; row <= ROWS; row++) {
        meshRef.current[row] = [];
        for (let col = 0; col <= COLS; col++) {
          const ox = (col / COLS) * W;
          const oy = (row / ROWS) * H;
          meshRef.current[row][col] = { ox, oy, x: ox, y: oy, vx: 0, vy: 0 };
        }
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const colors = PALETTE[themeRef.current] || PALETTE.dark;

      ctx.clearRect(0, 0, W, H);

      for (let r = 0; r <= ROWS; r++) {
        for (let c = 0; c <= COLS; c++) {
          const pt = meshRef.current[r][c];
          const dx = pt.ox - mx;
          const dy = pt.oy - my;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < INFLUENCE_RADIUS) {
            const factor = (1 - dist / INFLUENCE_RADIUS) ** 2;
            const angle = Math.atan2(dy, dx);
            const force = factor * MAX_WARP;
            pt.vx += Math.cos(angle) * force * 0.06;
            pt.vy += Math.sin(angle) * force * 0.06;
          }

          const springX = (pt.ox - pt.x) * DAMPING;
          const springY = (pt.oy - pt.y) * DAMPING;
          pt.vx = (pt.vx + springX) * 0.78;
          pt.vy = (pt.vy + springY) * 0.78;
          pt.x += pt.vx;
          pt.y += pt.vy;
        }
      }

      for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath();
        for (let c = 0; c <= COLS; c++) {
          const pt = meshRef.current[r][c];
          if (c === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        const centerY = (r / ROWS) * H;
        const rowDist = Math.abs(centerY - my);
        const rowProx = Math.max(0, 1 - rowDist / (H * 0.45));
        const alpha = 0.04 + rowProx * 0.18;
        const blend = r / ROWS;
        const g_c = Math.round(colors.lineStart[1] + blend * (colors.lineEnd[1] - colors.lineStart[1]));
        const b_c = Math.round(colors.lineStart[2] + blend * (colors.lineEnd[2] - colors.lineStart[2]));
        ctx.strokeStyle = `rgba(${colors.lineStart[0]}, ${g_c}, ${b_c}, ${alpha})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }

      for (let c = 0; c <= COLS; c++) {
        ctx.beginPath();
        for (let r = 0; r <= ROWS; r++) {
          const pt = meshRef.current[r][c];
          if (r === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        const centerX = (c / COLS) * W;
        const colDist = Math.abs(centerX - mx);
        const colProx = Math.max(0, 1 - colDist / (W * 0.45));
        const alpha = 0.04 + colProx * 0.18;
        const blend = c / COLS;
        const g_c = Math.round(colors.lineStart[1] + blend * (colors.lineEnd[1] - colors.lineStart[1]));
        const b_c = Math.round(colors.lineStart[2] + blend * (colors.lineEnd[2] - colors.lineStart[2]));
        ctx.strokeStyle = `rgba(${colors.lineStart[0]}, ${g_c}, ${b_c}, ${alpha})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }

      for (let r = 0; r <= ROWS; r++) {
        for (let c = 0; c <= COLS; c++) {
          const pt = meshRef.current[r][c];
          const d = Math.hypot(pt.ox - mx, pt.oy - my);
          if (d < INFLUENCE_RADIUS * 0.7) {
            const t = 1 - d / (INFLUENCE_RADIUS * 0.7);
            const displaced = Math.hypot(pt.x - pt.ox, pt.y - pt.oy);
            const dotAlpha = t * 0.8 * Math.min(displaced / 5, 1);
            if (dotAlpha > 0.05) {
              ctx.beginPath();
              ctx.arc(pt.x, pt.y, 1.2, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(${colors.dot[0]}, ${colors.dot[1]}, ${colors.dot[2]}, ${dotAlpha})`;
              ctx.fill();
            }
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.85,
      }}
    />
  );
}
