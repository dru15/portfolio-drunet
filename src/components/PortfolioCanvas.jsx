import React, { useState, useEffect, useRef } from 'react';
import Spline from '@splinetool/react-spline';
import LiquidGlassBg from './LiquidGlassBg';

const SCENE_POSES = {
  home:       { scale: 1.0,  tx: 23,   ty: 0,   ry: 0,   rx: 0,   rz: 0 },
  about:      { scale: 1.94, tx: 12,   ty: 5,   ry: -6,  rx: 1.5, rz: 0 },
  skills:     { scale: 1.2,  tx: -20,  ty: 10,  ry: 4,   rx: -3,  rz: 0 },
  projects:   { scale: 2.84, tx: 10,   ty: 13,  ry: 2,   rx: 0,   rz: 0 },
  experience: { scale: 0.6, tx: 5,    ty: -45, ry: 0,   rx: 0,   rz: 0 },
  contact:    { scale: 0.3,  tx: 5,    ty: 0,   ry: 0,   rx: -2,  rz: 0 },
};

const TEXT_FOCUS_SECTIONS = new Set(['about', 'skills', 'projects', 'experience', 'contact']);

const EASE          = 'cubic-bezier(0.22, 1, 0.36, 1)';
const TRANSITION_MS = '1.15s';

export default function PortfolioCanvas({ activeSection, isTransitioning, isZooming, theme, onSplineLoad }) {
  const [loading, setLoading] = useState(true);
  
  // Refs for direct DOM manipulation (bypassing React render for mouse moves)
  const sceneRigRef   = useRef(null);
  const cameraWrapRef = useRef(null);
  const rafRef        = useRef(null);
  
  // Keep track of current pose and theme without needing them in the RAF dependency array
  const poseRef  = useRef(SCENE_POSES[activeSection] || SCENE_POSES.home);
  const themeRef = useRef(theme);
  
  useEffect(() => {
    poseRef.current = SCENE_POSES[activeSection] || SCENE_POSES.home;
  }, [activeSection]);
  
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  // Native RAF loop for ultra-smooth 144Hz+ parallax
  useEffect(() => {
    // Current mouse tracking (pure DOM, no React state)
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    
    // Smooth lerping target
    let lerpX = 0;
    let lerpY = 0;

    const handleMouseMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const tick = () => {
      const pose = poseRef.current;
      const isDark = themeRef.current !== 'light';

      const nx = mx / window.innerWidth  - 0.5;
      const ny = my / window.innerHeight - 0.5;
      const targetX = nx * 5;
      const targetY = ny * 4;

      // 0.15 = slightly snappier tilt matching tuned Jedi tracking
      lerpX += (targetX - lerpX) * 0.15;
      lerpY += (targetY - lerpY) * 0.15;

      const pMult = isDark ? 1.5 : 0.5;

      if (sceneRigRef.current) {
        sceneRigRef.current.style.transform = `perspective(1400px) rotateX(${pose.rx + lerpY * pMult}deg) rotateY(${pose.ry + lerpX * pMult}deg) rotateZ(${pose.rz}deg)`;
      }
      if (cameraWrapRef.current) {
        // We still need to calculate final scale based on defocus
        const isDefocused = TEXT_FOCUS_SECTIONS.has(Object.keys(SCENE_POSES).find(key => SCENE_POSES[key] === pose) || 'home');
        const focusScale = isDefocused ? 0.90 : 1;
        const finalScale = pose.scale * focusScale;
        
        cameraWrapRef.current.style.transform = `scale(${finalScale}) translate(${pose.tx + lerpX * 0.15}%, ${pose.ty + lerpY * 0.15}%)`;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const isDefocused = TEXT_FOCUS_SECTIONS.has(activeSection);

  // Initial transform strings (these get immediately overwritten by RAF, but good for first paint)
  const initialPose = SCENE_POSES[activeSection] || SCENE_POSES.home;
  const initialFocusScale = isDefocused ? 0.90 : 1;
  const initialFinalScale = initialPose.scale * initialFocusScale;
  
  const initialSceneTransform = `perspective(1400px) rotateX(${initialPose.rx}deg) rotateY(${initialPose.ry}deg) rotateZ(${initialPose.rz}deg)`;
  const initialCameraTransform = `scale(${initialFinalScale}) translate(${initialPose.tx}%, ${initialPose.ty}%)`;

  const transitionStyle = {
    transition: `transform ${TRANSITION_MS} ${EASE}, filter ${TRANSITION_MS} ${EASE}`,
    willChange: 'transform', // GPU acceleration for the parallax
  };

  return (
    <div
      id="spline-canvas"
      className={`cinematic-canvas ${isDefocused ? 'defocused' : ''} ${isTransitioning ? 'transitioning' : ''}`}
    >
      <LiquidGlassBg theme={theme} />

      <div className="scene-environment">
        <div className="env-orb env-orb-purple" />
        <div className="env-orb env-orb-green" />
        <div className="env-grid-floor" />
      </div>

      <div className="ambient-orb" />

      {loading && (
        <div className="canvas-loader">
          <div className="canvas-loader-ring" />
          <span className="canvas-loader-text">INITIALIZING VISION FEED...</span>
        </div>
      )}

      <div ref={sceneRigRef} className="scene-rig" style={{ transform: initialSceneTransform, ...transitionStyle }}>
        <div ref={cameraWrapRef} className="camera-wrapper" style={{ transform: initialCameraTransform, ...transitionStyle }}>
          <Spline
            scene="https://prod.spline.design/rkSaZKHGOBgAsLe7/scene.splinecode"
            onLoad={() => {
              setLoading(false);
              if (onSplineLoad) onSplineLoad();
            }}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        </div>
      </div>

      <div className="sensor-sweep"           aria-hidden />
      <div className="sensor-wireframe-pulse"  aria-hidden />

      <div className={`glitch-overlay ${isTransitioning ? 'active' : ''}`} />

      <div className="canvas-vignette" />
      <div className="depth-of-field-overlay" />
    </div>
  );
}