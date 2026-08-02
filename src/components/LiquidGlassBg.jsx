import React, { useEffect, useRef } from 'react';

// ─── Fluid Simulation — Simplified Stable Fluids (Jos Stam) ──────────────────
// Single resolution for both velocity and dye for correctness and simplicity.
// Resolution set to a sweet spot: vivid colour at 60fps on modern hardware.

const N         = 160;   // grid cells (N×N)
const ITER      = 12;    // Gauss-Seidel pressure iterations
const DT        = 0.016;
const VISCOSITY = 0.00005;
const DIFFUSION = 0.00004;
const SPLAT_R   = 0.055; // tight radius — close to cursor
const DECAY     = 0.988; // silky fade — effect dissolves smoothly

// Dark-mode palette — vivid neons, medium brightness (not blinding)
const DARK_PALETTE = [
  [0.00, 0.82, 0.45],  // green
  [0.00, 0.65, 0.90],  // cyan
  [0.38, 0.32, 0.95],  // violet
  [0.88, 0.18, 0.88],  // magenta
  [0.90, 0.62, 0.00],  // amber
  [0.00, 0.42, 0.92],  // electric blue
];

// Light-mode palette — DARK ink tones on a light background
// Think: fountain pen ink colours — deep, rich, contrasted
const LIGHT_PALETTE = [
  [0.00, 0.40, 0.22],  // deep forest green (ink)
  [0.00, 0.22, 0.65],  // navy blue (ink)
  [0.28, 0.10, 0.65],  // deep indigo (ink)
  [0.55, 0.00, 0.50],  // deep plum (ink)
  [0.55, 0.28, 0.00],  // dark amber (ink)
  [0.00, 0.30, 0.60],  // dark teal (ink)
];

// ─── Field utils ──────────────────────────────────────────────────────────────
const NN  = (N + 2) * (N + 2);
const IX  = (x, y) => x + (N + 2) * y;
const mk  = ()     => new Float32Array(NN);

function setBnd(b, x) {
  for (let i = 1; i <= N; i++) {
    x[IX(0,     i)] = b === 1 ? -x[IX(1,     i)] : x[IX(1,     i)];
    x[IX(N + 1, i)] = b === 1 ? -x[IX(N,     i)] : x[IX(N,     i)];
    x[IX(i,     0)] = b === 2 ? -x[IX(i,     1)] : x[IX(i,     1)];
    x[IX(i, N + 1)] = b === 2 ? -x[IX(i,     N)] : x[IX(i,     N)];
  }
  x[IX(0,     0)]     = 0.5 * (x[IX(1, 0)]     + x[IX(0,     1)]);
  x[IX(N + 1, 0)]     = 0.5 * (x[IX(N, 0)]     + x[IX(N + 1, 1)]);
  x[IX(0,     N + 1)] = 0.5 * (x[IX(1, N + 1)] + x[IX(0,     N)]);
  x[IX(N + 1, N + 1)] = 0.5 * (x[IX(N, N + 1)] + x[IX(N + 1, N)]);
}

function linSolve(b, x, x0, a, c) {
  for (let k = 0; k < ITER; k++) {
    for (let j = 1; j <= N; j++)
      for (let i = 1; i <= N; i++)
        x[IX(i, j)] = (x0[IX(i, j)] + a * (x[IX(i-1,j)] + x[IX(i+1,j)] + x[IX(i,j-1)] + x[IX(i,j+1)])) / c;
    setBnd(b, x);
  }
}

function diffuse(b, x, x0, diff) {
  const a = DT * diff * N * N;
  linSolve(b, x, x0, a, 1 + 4 * a);
}

function advect(b, d, d0, u, v) {
  const dt0 = DT * N;
  for (let j = 1; j <= N; j++) {
    for (let i = 1; i <= N; i++) {
      let x = i - dt0 * u[IX(i, j)];
      let y = j - dt0 * v[IX(i, j)];
      x = Math.max(0.5, Math.min(N + 0.5, x));
      y = Math.max(0.5, Math.min(N + 0.5, y));
      const i0 = x | 0, i1 = i0 + 1;
      const j0 = y | 0, j1 = j0 + 1;
      const s1 = x - i0, s0 = 1 - s1;
      const t1 = y - j0, t0 = 1 - t1;
      d[IX(i, j)] =
        s0 * (t0 * d0[IX(i0, j0)] + t1 * d0[IX(i0, j1)]) +
        s1 * (t0 * d0[IX(i1, j0)] + t1 * d0[IX(i1, j1)]);
    }
  }
  setBnd(b, d);
}

function project(u, v, p, div) {
  const h = 1.0 / N;
  for (let j = 1; j <= N; j++)
    for (let i = 1; i <= N; i++) {
      div[IX(i, j)] = -0.5 * h * (u[IX(i+1,j)] - u[IX(i-1,j)] + v[IX(i,j+1)] - v[IX(i,j-1)]);
      p[IX(i, j)]   = 0;
    }
  setBnd(0, div); setBnd(0, p);
  linSolve(0, p, div, 1, 4);
  for (let j = 1; j <= N; j++)
    for (let i = 1; i <= N; i++) {
      u[IX(i, j)] -= 0.5 * (p[IX(i+1,j)] - p[IX(i-1,j)]) / h;
      v[IX(i, j)] -= 0.5 * (p[IX(i,j+1)] - p[IX(i,j-1)]) / h;
    }
  setBnd(1, u); setBnd(2, v);
}

function velStep(u, v, u0, v0) {
  // Add external force
  for (let i = 0; i < NN; i++) { u[i] += DT * u0[i]; v[i] += DT * v0[i]; }
  // Diffuse
  const tu = u.slice(), tv = v.slice();
  diffuse(1, u, tu, VISCOSITY);
  diffuse(2, v, tv, VISCOSITY);
  project(u, v, u0, v0);
  // Advect
  const pu = u.slice(), pv = v.slice();
  advect(1, u, pu, pu, pv);
  advect(2, v, pv, pu, pv);
  project(u, v, u0, v0);
  u0.fill(0); v0.fill(0);
}

function densStep(x, x0, u, v) {
  for (let i = 0; i < NN; i++) x[i] += DT * x0[i];
  const t = x.slice();
  diffuse(0, x, t, DIFFUSION);
  const p = x.slice();
  advect(0, x, p, u, v);
  x0.fill(0);
}

// Gaussian blob injection
function splat(field, cx, cy, r, amount) {
  const r2 = r * r;
  for (let j = 1; j <= N; j++)
    for (let i = 1; i <= N; i++) {
      const dx = i - cx, dy = j - cy;
      field[IX(i, j)] += amount * Math.exp(-(dx*dx + dy*dy) / r2);
    }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function LiquidGlassBg({ theme = 'dark' }) {
  const canvasRef    = useRef(null);
  const rafRef       = useRef(null);
  const prevMouse    = useRef({ x: -1, y: -1 });
  const mouseRef     = useRef({ x: -1, y: -1 });
  const themeRef     = useRef(theme);
  const colIdxRef    = useRef(0);
  const frameRef     = useRef(0);
  const fieldsRef    = useRef(null);

  useEffect(() => { themeRef.current = theme; },    [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Allocate fluid fields
    const u  = mk(), v  = mk(), u0 = mk(), v0 = mk();
    const r  = mk(), g  = mk(), b  = mk();
    const r0 = mk(), g0 = mk(), b0 = mk();
    fieldsRef.current = { u, v, u0, v0, r, g, b, r0, g0, b0 };

    let W = window.innerWidth;
    let H = window.innerHeight;
    // We render at N×N and CSS stretches it — crisp bilinear upscale
    canvas.width  = N + 2;
    canvas.height = N + 2;

    let imgData = ctx.createImageData(N + 2, N + 2);

    const onResize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const onMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('pointermove', onMouseMove, { passive: true });

    // Map screen px → grid cell (1..N)
    const toGrid = (sx, sy) => ({
      gx: 1 + (sx / W) * (N - 1),
      gy: 1 + (sy / H) * (N - 1),
    });

    const tick = () => {
      frameRef.current++;
      const f = fieldsRef.current;
      const mx  = mouseRef.current.x;
      const my  = mouseRef.current.y;
      const isDark  = themeRef.current === 'dark';
      const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;

      // ── Mouse input ─────────────────────────────────────────────────────────
      const pmx = prevMouse.current.x;
      const pmy = prevMouse.current.y;
      const dmx = mx - pmx;
      const dmy = my - pmy;
      const spd = Math.sqrt(dmx * dmx + dmy * dmy);

      if (spd > 0.15 && pmx >= 0) {
        const { gx, gy } = toGrid(mx, my);
        const sR = SPLAT_R * N;

        // Inject velocity — proportional to speed, capped
        const force = Math.min(spd * 0.38, 70);
        splat(f.u0, gx, gy, sR, (dmx / spd) * force);
        splat(f.v0, gx, gy, sR, (dmy / spd) * force);

        // Cycle colour every few frames of movement
        if (frameRef.current % 6 === 0)
          colIdxRef.current = (colIdxRef.current + 1) % palette.length;

        const col = palette[colIdxRef.current];
        // Dim amount: less bright, tighter trail
        const amt = Math.min(spd * 0.48, 50);

        splat(f.r0, gx, gy, sR, col[0] * amt);
        splat(f.g0, gx, gy, sR, col[1] * amt);
        splat(f.b0, gx, gy, sR, col[2] * amt);
      }
      prevMouse.current = { x: mx, y: my };

      // ── Simulate ────────────────────────────────────────────────────────────
      velStep (f.u, f.v, f.u0, f.v0);
      densStep(f.r, f.r0, f.u, f.v);
      densStep(f.g, f.g0, f.u, f.v);
      densStep(f.b, f.b0, f.u, f.v);

      // ── Render ──────────────────────────────────────────────────────────────
      // Background base colour per mode
      const bgR = isDark ?  4 : 238;
      const bgG = isDark ?  6 : 240;
      const bgB = isDark ? 14 : 246;

      const data = imgData.data;
      for (let j = 0; j <= N + 1; j++) {
        for (let i = 0; i <= N + 1; i++) {
          const ii = IX(i, j);
          let rr = Math.max(0, Math.min(1, f.r[ii]));
          let gg = Math.max(0, Math.min(1, f.g[ii]));
          let bb = Math.max(0, Math.min(1, f.b[ii]));
          const density = Math.min(rr + gg + bb, 1.0);
          const k = (j * (N + 2) + i) * 4;

          if (isDark) {
            // Dark mode: additive neon glow on near-black
            data[k]     = bgR + rr * 255 * density;
            data[k + 1] = bgG + gg * 255 * density;
            data[k + 2] = bgB + bb * 255 * density;
          } else {
            // Light mode: dark ink subtracted from white — dye darkens the bg
            data[k]     = bgR - rr * 200 * density;
            data[k + 1] = bgG - gg * 200 * density;
            data[k + 2] = bgB - bb * 200 * density;
          }
          data[k + 3] = 255;

          // Decay dye each frame
          f.r[ii] *= DECAY;
          f.g[ii] *= DECAY;
          f.b[ii] *= DECAY;
        }
      }
      ctx.putImageData(imgData, 0, 0);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
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
        imageRendering: 'auto', // bilinear upscale → smooth fluid look
      }}
    />
  );
}
