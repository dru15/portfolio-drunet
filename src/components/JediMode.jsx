import React, { useState, useRef, useEffect, useCallback } from 'react';
import { playSound } from '../utils/audio';

// ─── MediaPipe CDN loader ─────────────────────────────────────────────────────
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (window.Hands) { resolve(); return; }
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (window.Hands) resolve();
      else {
        existing.addEventListener('load', resolve);
        existing.addEventListener('error', reject);
      }
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.crossOrigin = 'anonymous';
    s.onload = () => {
      // Small timeout to allow global assignment if needed
      setTimeout(resolve, 50);
    };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// ─── Gesture detection ────────────────────────────────────────────────────────
// MediaPipe landmark indices:
// 4=thumb tip, 8=index tip, 12=middle tip, 16=ring tip, 20=pinky tip
// 6=index PIP, 10=mid PIP, 14=ring PIP, 18=pinky PIP
// 3=thumb IP, 2=thumb MCP

function detectGesture(lm) {
  const tips = [8, 12, 16, 20];
  const pips = [6, 10, 14, 18];

  const extended = tips.map((t, i) => lm[t].y < lm[pips[i]].y);
  const [idx, mid, ring, pinky] = extended;
  const extendedCount = extended.filter(Boolean).length;

  // Thumb relative to joints
  const thumbUp   = lm[4].y < lm[3].y && lm[4].y < lm[5].y - 0.02;
  const thumbDown = lm[4].y > lm[3].y && lm[4].y > lm[5].y + 0.02;

  // If 4 main fingers are folded into palm
  if (extendedCount === 0) {
    if (thumbUp)   return 'THUMBS_UP';
    if (thumbDown) return 'THUMBS_DOWN';
    return 'UNKNOWN';
  }

  // 1 finger extended (Index only) -> POINT
  if (idx && !mid && !ring && !pinky) return 'POINT';

  // 2 fingers extended (Index + Middle) -> PEACE
  if (idx && mid && !ring && !pinky) return 'PEACE';

  // 3 fingers extended (Index + Middle + Ring) -> THREE_FINGERS
  if (idx && mid && ring && !pinky) return 'THREE_FINGERS';

  // 4 fingers extended -> OPEN_PALM
  if (extendedCount >= 4) return 'OPEN_PALM';

  return 'UNKNOWN';
}

// ─── Hand skeleton drawing ────────────────────────────────────────────────────
const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],
  [5,9],[9,13],[13,17],
];

function drawSkeleton(ctx, lm, w, h, color = '#00FF88') {
  // Mirror x since camera is flipped
  const px = (l) => ({ x: (1 - l.x) * w, y: l.y * h });

  ctx.strokeStyle = color + 'CC';
  ctx.lineWidth = 1.8;
  for (const [a, b] of HAND_CONNECTIONS) {
    const pa = px(lm[a]), pb = px(lm[b]);
    ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
  }

  for (let i = 0; i < lm.length; i++) {
    const p = px(lm[i]);
    ctx.beginPath();
    ctx.arc(p.x, p.y, i === 8 ? 5 : 2.5, 0, Math.PI * 2);
    ctx.fillStyle = i === 8 ? '#00D4FF' : color;
    ctx.fill();
  }
}

// ─── Gesture label map ────────────────────────────────────────────────────────
const GESTURE_UI = {
  POINT:         { emoji: '☝', label: 'CURSOR CONTROL',    hint: 'Move your hand to control the robot' },
  PEACE:         { emoji: '✌', label: 'THEME TOGGLE',      hint: 'Hold 1.5s to switch dark/light mode' },
  THUMBS_UP:     { emoji: '👍', label: 'NEXT SECTION',      hint: 'Thumbs up = go forward' },
  THUMBS_DOWN:   { emoji: '👎', label: 'PREV SECTION',       hint: 'Thumbs down = go back' },
  OPEN_PALM:     { emoji: '🖐', label: 'FORCE PUSH',        hint: 'Hold 1.5s for a surprise' },
  THREE_FINGERS: { emoji: '🤟', label: 'TOGGLE AI',         hint: 'Hold 1.5s to open AI chat' },
  UNKNOWN:       { emoji: '—', label: 'DETECTING...',       hint: 'Show me a clear hand gesture' },
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function JediMode({ onNavigate, onToggleTheme, onToggleAI }) {
  const [status, setStatus]         = useState('idle');   // idle | loading | active | error | denied
  const [showWarning, setShowWarning]= useState(false);
  const [gesture, setGesture]       = useState(null);
  const [actionFlash, setFlash]     = useState(null);
  const [holdProgress, setHoldProg] = useState(0);        // 0–100 for hold ring

  const videoRef      = useRef(null);
  const canvasRef     = useRef(null);
  const handsRef      = useRef(null);
  const streamRef     = useRef(null);
  const rafRef        = useRef(null);
  const isRunningRef  = useRef(false);
  const prevPos       = useRef({ x: 0.5, y: 0.5, t: 0 });
  const smoothMouse   = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const rawHand       = useRef({ x: 0.5, y: 0.5 }); // latest raw camera landmark
  const injectRafRef  = useRef(null);                 // RAF for continuous event injection
  const swipeCool     = useRef(false);
  const actionCool    = useRef(false);
  const holdRef       = useRef({ g: null, start: 0 });
  const thumbCool     = useRef(false);
  const HOLD_DURATION = 1500; // ms to hold gesture before triggering

  // Callback refs to prevent stale closure in MediaPipe frame loop
  const onNavigateRef    = useRef(onNavigate);
  const onToggleThemeRef = useRef(onToggleTheme);
  const onToggleAIRef    = useRef(onToggleAI);

  useEffect(() => {
    onNavigateRef.current    = onNavigate;
    onToggleThemeRef.current = onToggleTheme;
    onToggleAIRef.current    = onToggleAI;
  });

  const flash = useCallback((text) => {
    setFlash(text);
    playSound('transition');
    setTimeout(() => setFlash(null), 2000);
  }, []);

  const lastEmittedPos = useRef({ x: -1, y: -1 });

  // ── Continuous 60fps injection loop ───────────────────────────────────────
  // MediaPipe only fires at ~15fps. Without this, the robot and fluid bg only
  // update on camera frames → looks jerky. This RAF keeps feeding the pre-smoothed
  // position every frame so motion is perfectly continuous between camera updates.
  useEffect(() => {
    if (status !== 'active') {
      cancelAnimationFrame(injectRafRef.current);
      return;
    }

    const inject = () => {
      const LERP = 0.09; // slightly faster — user asked for a touch more speed
      const mapCam = (v, min, max) => (Math.max(min, Math.min(max, v)) - min) / (max - min);
      const mappedX = mapCam(rawHand.current.x, 0.20, 0.80);
      const mappedY = mapCam(rawHand.current.y, 0.16, 0.84);
      const cx = (1 - mappedX) * window.innerWidth;
      const cy = mappedY * window.innerHeight;

      smoothMouse.current.x += (cx - smoothMouse.current.x) * LERP;
      smoothMouse.current.y += (cy - smoothMouse.current.y) * LERP;

      // Use float coords — no Math.round — eliminates 1px quantisation jitter
      const fx = smoothMouse.current.x;
      const fy = smoothMouse.current.y;

      // Dispatch on any sub-pixel movement (0.15px threshold feeds fluid bg on slow hand motion)
      const dx = Math.abs(fx - lastEmittedPos.current.x);
      const dy = Math.abs(fy - lastEmittedPos.current.y);
      if (dx >= 0.15 || dy >= 0.15) {
        lastEmittedPos.current = { x: fx, y: fy };
        const ev = { bubbles: true, cancelable: true, clientX: fx, clientY: fy, screenX: fx, screenY: fy, pageX: fx, pageY: fy, pointerId: 1, pointerType: 'mouse', isPrimary: true };
        const splineCanvas = document.querySelector('#spline-canvas canvas') || document.querySelector('#spline-canvas');
        if (splineCanvas) {
          splineCanvas.dispatchEvent(new PointerEvent('pointermove', ev));
          splineCanvas.dispatchEvent(new MouseEvent('mousemove', ev));
        }
        window.dispatchEvent(new PointerEvent('pointermove', ev));
        window.dispatchEvent(new MouseEvent('mousemove', ev));
      }

      injectRafRef.current = requestAnimationFrame(inject);
    };

    injectRafRef.current = requestAnimationFrame(inject);
    return () => cancelAnimationFrame(injectRafRef.current);
  }, [status]);

  // emitMouse just updates the raw target — the RAF injector does the lerp + dispatch every frame
  const emitMouse = useCallback((nx, ny) => {
    rawHand.current = { x: nx, y: ny };
  }, []);

  // Handle each frame's results
  const onResults = useCallback((results) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw camera feed (mirrored, semi-transparent)
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);
    ctx.globalAlpha = 0.35;
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    ctx.restore();
    ctx.globalAlpha = 1;

    if (!results.multiHandLandmarks?.length) {
      setGesture(null);
      holdRef.current = { g: null, start: 0 };
      setHoldProg(0);
      return;
    }

    const lm = results.multiHandLandmarks[0];
    drawSkeleton(ctx, lm, canvas.width, canvas.height);

    const g = detectGesture(lm);
    setGesture(g);

    // ── POINT mode = pure cursor control, skip all gesture actions ──────────
    if (g === 'POINT') {
      // Store raw index-fingertip so RAF injector targets it
      rawHand.current = { x: lm[8].x, y: lm[8].y };
      emitMouse(lm[8].x, lm[8].y);
      holdRef.current = { g: null, start: 0 };
      setHoldProg(0);
      prevPos.current = { x: lm[9].x, y: lm[9].y, t: Date.now() };
      return; // cursor-only mode — skip all other gesture checks
    }

    // For non-POINT gestures track wrist so robot still responds
    rawHand.current = { x: lm[0].x, y: lm[0].y };
    emitMouse(lm[0].x, lm[0].y);

    // ── Swipe detection (via hand center velocity) ──────────────────────────
    const center = lm[9]; // middle MCP
    const now    = Date.now();
    const dt     = now - prevPos.current.t;
    const dx     = center.x - prevPos.current.x;

    if (dt > 0 && dt < 250 && Math.abs(dx) > 0.18 && !swipeCool.current && !actionCool.current) {
      swipeCool.current = true;
      actionCool.current = true;
      setTimeout(() => { swipeCool.current = false; }, 1000);
      setTimeout(() => { actionCool.current = false; }, 700);
      if (dx < 0) {
        flash('⚡ NEXT SECTION');
        onNavigateRef.current('next');
      } else {
        flash('⚡ PREV SECTION');
        onNavigateRef.current('prev');
      }
    }
    prevPos.current = { x: center.x, y: center.y, t: now };

    // ── Held-gesture actions ────────────────────────────────────────────────
    const hold = holdRef.current;
    if (g === hold.g && g !== 'UNKNOWN') {
      const elapsed = now - hold.start;
      const progress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setHoldProg(progress);

      if (elapsed >= HOLD_DURATION && !actionCool.current) {
        actionCool.current = true;
        setTimeout(() => { actionCool.current = false; }, 3200);
        holdRef.current = { g: null, start: 0 };
        setHoldProg(0);

        if (g === 'PEACE')         { flash('🎨 THEME TOGGLED'); onToggleThemeRef.current(window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / 2); }
        if (g === 'THREE_FINGERS') { flash('🤖 AI CIPHER TOGGLED'); onToggleAIRef.current(); }
      }
    } else {
      holdRef.current = { g, start: now };
      setHoldProg(0);
    }

    // ── Instant gesture actions (tap-style with cooldown) ───────────────────
    if (g === 'THUMBS_UP' && !thumbCool.current && !actionCool.current) {
      thumbCool.current = true;
      setTimeout(() => { thumbCool.current = false; }, 1000);
      flash('👍 NEXT SECTION');
      onNavigateRef.current('next');
    }
    if (g === 'THUMBS_DOWN' && !thumbCool.current && !actionCool.current) {
      thumbCool.current = true;
      setTimeout(() => { thumbCool.current = false; }, 1000);
      flash('👎 PREV SECTION');
      onNavigateRef.current('prev');
    }
  }, [emitMouse, flash]);

  // ── Start / Stop ──────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    isRunningRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    handsRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStatus('idle');
    setGesture(null);
    setFlash(null);
    setHoldProg(0);
  }, []);

  const start = useCallback(async () => {
    setStatus('loading');
    try {
      // 1. Request camera permission first
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      streamRef.current = stream;

      // 2. Create offscreen video element if ref is not mounted yet
      let video = videoRef.current;
      if (!video) {
        video = document.createElement('video');
        video.style.display = 'none';
        document.body.appendChild(video);
        videoRef.current = video;
      }
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();

      // 3. Load MediaPipe Hands script
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');

      if (!window.Hands) {
        throw new Error('MediaPipe Hands failed to load from CDN');
      }

      // 4. Init MediaPipe Hands instance
      const hands = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0,
        minDetectionConfidence: 0.55,
        minTrackingConfidence: 0.5,
      });
      hands.onResults(onResults);
      handsRef.current = hands;

      isRunningRef.current = true;

      // 5. Throttled Frame Loop — process at ~30 FPS max to save CPU/GPU on low-end systems
      let lastInferenceTime = 0;
      const INFERENCE_INTERVAL = 1000 / 30; // 33.3ms = 30 FPS inference target

      const loop = async (timestamp) => {
        if (!isRunningRef.current || !handsRef.current) return;
        
        if (timestamp - lastInferenceTime >= INFERENCE_INTERVAL) {
          lastInferenceTime = timestamp;
          if (videoRef.current && videoRef.current.readyState >= 2) {
            try { await handsRef.current.send({ image: videoRef.current }); } catch (_) {}
          }
        }
        
        if (isRunningRef.current) rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);

      setStatus('active');
    } catch (err) {
      console.error('JediMode start error:', err);
      stop();
      setStatus(err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' ? 'denied' : 'error');
    }
  }, [onResults, stop]);

  useEffect(() => () => stop(), [stop]);

  // ── UI Rendering ──────────────────────────────────────────────────────────
  return (
    <>
      {/* Hidden video element always mounted so ref is never null */}
      <video ref={videoRef} style={{ display: 'none' }} playsInline muted />

      {/* ── High Performance Resource Advisory Warning Modal ── */}
      {showWarning && (
        <div className="jedi-modal-backdrop" onClick={() => setShowWarning(false)}>
          <div className="jedi-warning-modal" onClick={(e) => e.stopPropagation()}>
            <div className="jedi-modal-header">
              <span className="jedi-warning-icon">⚡</span>
              <div>
                <h3 className="mono jedi-modal-title">PERFORMANCE & RESOURCE ADVISORY</h3>
                <span className="mono jedi-modal-sub">EXPERIMENTAL JEDI MODE</span>
              </div>
            </div>

            <div className="jedi-modal-body">
              <p className="jedi-modal-desc">
                Activating <strong>Jedi Mode</strong> runs real-time computer vision AI models (MediaPipe Hands) directly in your browser to track hand gestures via your webcam.
              </p>

              <div className="jedi-modal-bullets">
                <div className="jedi-bullet-item">
                  <span className="jedi-bullet-tag">CPU / GPU INTENSIVE</span>
                  <span>Continuous frame analysis requires higher hardware utilization. May impact battery & fan speed.</span>
                </div>
                <div className="jedi-bullet-item">
                  <span className="jedi-bullet-tag">100% PRIVATE & LOCAL</span>
                  <span>Camera feed is processed entirely on your device. Zero video or image data is ever uploaded.</span>
                </div>
                <div className="jedi-bullet-item">
                  <span className="jedi-bullet-tag">GESTURE CONTROLS</span>
                  <span>Index Point (☝) = Cursor · Thumbs Up (👍) = Next · Thumbs Down (👎) = Prev · Open Palm (🖐) = Force Push</span>
                </div>
              </div>
            </div>

            <div className="jedi-modal-actions">
              <button className="jedi-btn-cancel" onClick={() => setShowWarning(false)}>
                CANCEL
              </button>
              <button
                className="jedi-btn-proceed"
                onClick={() => {
                  setShowWarning(false);
                  start();
                }}
              >
                PROCEED & ACTIVATE ✦
              </button>
            </div>
          </div>
        </div>
      )}

      {(status === 'idle' || status === 'denied' || status === 'error') && (
        <button
          className={`jedi-fab${status !== 'idle' ? ' jedi-fab-error' : ''}`}
          onClick={() => setShowWarning(true)}
          title={status === 'denied' ? 'Camera access denied — click to retry' : 'Activate Jedi Mode ✦'}
        >
          <span className="jedi-fab-icon">
            {status === 'denied' ? '⊘' : status === 'error' ? '!' : '✦'}
          </span>
          {status === 'idle' && <span className="jedi-fab-label">JEDI</span>}
          {status === 'denied' && <span className="jedi-fab-label">DENIED</span>}
          {status === 'error'  && <span className="jedi-fab-label">ERROR (RETRY)</span>}
        </button>
      )}

      {status === 'loading' && (
        <div className="jedi-loading">
          <div className="jedi-loading-ring" />
          <span className="mono jedi-loading-text">INITIALISING FORCE LINK…</span>
        </div>
      )}

      {status === 'active' && (
        <div className="jedi-overlay">
          <div className="jedi-overlay-header">
            <span className="jedi-live-dot" />
            <span className="mono jedi-live-label">JEDI MODE</span>
            <button className="jedi-close-btn" onClick={stop} title="Deactivate">✕</button>
          </div>

          <div className="jedi-canvas-wrap">
            <canvas ref={canvasRef} className="jedi-canvas" width={160} height={120} />
            {/* Hold progress ring */}
            {holdProgress > 0 && (
              <svg className="jedi-hold-ring" viewBox="0 0 50 50">
                <circle cx="25" cy="25" r="20" className="jedi-hold-track" />
                <circle
                  cx="25" cy="25" r="20"
                  className="jedi-hold-fill"
                  strokeDasharray={`${holdProgress * 1.257} 125.7`}
                />
              </svg>
            )}
          </div>

          {/* Controls reference listed right under the live video stream in bottom-right */}
          <div className="jedi-controls-mini">
            <div className="jedi-ctrl-row"><span>☝ Point</span><span>cursor</span></div>
            <div className="jedi-ctrl-row"><span>✌ Peace (hold)</span><span>theme</span></div>
            <div className="jedi-ctrl-row"><span>👍 Thumbs up</span><span>next</span></div>
            <div className="jedi-ctrl-row"><span>👎 Thumbs down</span><span>prev</span></div>
            <div className="jedi-ctrl-row"><span>🤟 3-finger (hold)</span><span>AI</span></div>
            <div className="jedi-ctrl-row"><span>↔ Swipe</span><span>navigate</span></div>
          </div>
        </div>
      )}

      {/* ── Action flash notification ── */}
      {actionFlash && (
        <div className="jedi-action-flash" key={actionFlash}>
          {actionFlash}
        </div>
      )}
    </>
  );
}
