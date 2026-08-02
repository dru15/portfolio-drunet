import React, { useState, useEffect, useCallback, useRef } from 'react';
import PortfolioCanvas from './components/PortfolioCanvas';
import Navigation from './components/Navigation';
import ResumeContent from './components/ResumeContent';
import AIOracle from './components/AIOracle';
import JediMode from './components/JediMode';
import { getMuteState, playSound } from './utils/audio';
import MouseBacklight from './components/MouseBacklight';
import LoadingScreen from './components/LoadingScreen';

export const SECTIONS = [
  { id: 'home',       label: '00 · Home' },
  { id: 'about',      label: '01 · Dossier' },
  { id: 'skills',     label: '02 · Matrix' },
  { id: 'projects',   label: '03 · Operations' },
  { id: 'experience', label: '04 · Field Record' },
  { id: 'contact',    label: '05 · Contact' },
];

const SECTION_IDS = SECTIONS.map((s) => s.id);

function getInitialTheme() {
  const stored = localStorage.getItem('vision-feed-theme');
  if (stored === 'light' || stored === 'dark') return stored;
  if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
  return 'dark';
}

// ── Mode-switch toast particles ──────────────────────────────────────────────
const DARK_LABELS  = ['DARK FEED', 'NIGHT MODE', 'OPTIC DEPTH', 'VISION: DARK'];
const LIGHT_LABELS = ['SOLAR FEED', 'DAY MODE',  'OPTIC CLEAR', 'VISION: LIGHT'];

function ModeToast({ label, originX, originY, onDone }) {
  return (
    <div
      className="mode-toast"
      style={{ left: originX, top: originY }}
      onAnimationEnd={onDone}
    >
      {label}
    </div>
  );
}

export default function App() {
  const [booting, setBooting] = useState(true);
  const [splineLoaded, setSplineLoaded] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMuted, setIsMuted] = useState(getMuteState());
  const [aiOpen, setAiOpen] = useState(false);
  const transitioningRef = useRef(false);
  const touchStartRef = useRef(null);
  const isMobileRef = useRef(window.innerWidth <= 600);

  // Track mobile breakpoint
  useEffect(() => {
    const check = () => { isMobileRef.current = window.innerWidth <= 600; };
    window.addEventListener('resize', check, { passive: true });
    return () => window.removeEventListener('resize', check);
  }, []);

  const [theme, setTheme] = useState(getInitialTheme);

  // ── Ripple state ─────────────────────────────────────────────────────────
  // phase: 'idle' | 'in' | 'hold' | 'out'
  const [ripple, setRipple]           = useState(null);
  const [ripplePhase, setRipplePhase] = useState('idle');
  const isRippling                    = ripplePhase !== 'idle';

  // ── Toast state ──────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null); // { toTheme, x, y }

  const timersRef = useRef([]);
  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const push = (fn, ms) => {
    timersRef.current.push(setTimeout(fn, ms));
  };

  const toggleTheme = useCallback((originX, originY, btnBottom) => {
    if (isRippling) return;
    playSound('transition');

    const toTheme = theme === 'dark' ? 'light' : 'dark';

    clearTimers();
    setRipple({ x: originX, y: originY, toTheme });

    // Phase 1 — expand in (0 → full)
    setRipplePhase('in');

    // Midpoint — swap theme while ripple covers screen
    push(() => {
      setTheme(toTheme);
      localStorage.setItem('vision-feed-theme', toTheme);
    }, 520);

    // Phase 2 — hold a beat, then fade out
    push(() => setRipplePhase('out'), 620);

    // Phase 3 — ripple done, show toast BELOW the button
    push(() => {
      setRipplePhase('idle');
      setRipple(null);
      // Pick the label NOW (once) so it never changes during display
      const labels = toTheme === 'dark' ? DARK_LABELS : LIGHT_LABELS;
      const label  = labels[Math.floor(Math.random() * labels.length)];
      setToast({ label, x: originX, y: (btnBottom ?? originY) + 10 });
    }, 1050);

  }, [isRippling, theme, clearTimers]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  useEffect(() => {
    const isLight = theme === 'light';
    let color = isLight ? '#007A52' : '#00FF88';
    let rgb   = isLight ? '0, 122, 82' : '0, 255, 136';
    
    switch (activeSection) {
      case 'about':      color = isLight ? '#006699' : '#00D4FF'; rgb = isLight ? '0, 102, 153' : '0, 212, 255'; break;
      case 'skills':     color = isLight ? '#007A52' : '#00FF88'; rgb = isLight ? '0, 122, 82' : '0, 255, 136'; break;
      case 'projects':   color = isLight ? '#006699' : '#00D4FF'; rgb = isLight ? '0, 102, 153' : '0, 212, 255'; break;
      case 'experience': color = isLight ? '#007A52' : '#00FF88'; rgb = isLight ? '0, 122, 82' : '0, 255, 136'; break;
      case 'contact':    color = isLight ? '#006699' : '#00D4FF'; rgb = isLight ? '0, 102, 153' : '0, 212, 255'; break;
      default:           color = isLight ? '#007A52' : '#00FF88'; rgb = isLight ? '0, 122, 82' : '0, 255, 136'; break;
    }
    
    document.documentElement.style.setProperty('--accent', color);
    document.documentElement.style.setProperty('--accent-rgb', rgb);
    document.documentElement.style.setProperty('--accent-active', color);
    document.documentElement.style.setProperty('--accent-active-rgb', rgb);
  }, [activeSection, theme]);

  const activeSectionRef = useRef(activeSection);
  useEffect(() => {
    activeSectionRef.current = activeSection;
  }, [activeSection]);

  const navigateToSection = useCallback((sectionId) => {
    if (!SECTION_IDS.includes(sectionId)) return;
    if (transitioningRef.current || sectionId === activeSectionRef.current) return;
    transitioningRef.current = true;
    setIsTransitioning(true);
    playSound('transition');
    setTimeout(() => setActiveSection(sectionId), 220);
    setTimeout(() => { setIsTransitioning(false); transitioningRef.current = false; }, 580);
  }, []);

  const goNext = useCallback(() => {
    const idx = SECTION_IDS.indexOf(activeSectionRef.current);
    if (idx < SECTION_IDS.length - 1) navigateToSection(SECTION_IDS[idx + 1]);
  }, [navigateToSection]);

  const goPrev = useCallback(() => {
    const idx = SECTION_IDS.indexOf(activeSectionRef.current);
    if (idx > 0) navigateToSection(SECTION_IDS[idx - 1]);
  }, [navigateToSection]);

  // Jedi mode handlers — always call latest goNext/goPrev
  const jediNavigate = useCallback((dir) => {
    if (dir === 'next') goNext();
    else if (dir === 'prev') goPrev();
  }, [goNext, goPrev]);

  const jediToggleAI = useCallback(() => {
    setAiOpen((v) => !v);
  }, []);

  useEffect(() => {
    let accumulated = 0;
    const THRESHOLD = 80;
    const handleWheel = (e) => {
      if (isMobileRef.current) return; // mobile uses native scroll snap
      if (e.target.closest('.terminal-bar, .form-input, .form-textarea, .terminal-input, .cipher-messages, .cipher-input')) return;
      e.preventDefault();
      if (transitioningRef.current || isRippling) return;
      accumulated += e.deltaY;
      if (accumulated > THRESHOLD)       { accumulated = 0; goNext(); }
      else if (accumulated < -THRESHOLD) { accumulated = 0; goPrev(); }
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [goNext, goPrev, isRippling]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isMobileRef.current) return; // mobile uses native scroll snap
      if (e.target.closest('.terminal-bar, .form-input, .form-textarea, .terminal-input, .cipher-input')) return;
      if (isRippling) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); goNext(); }
      else if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); goPrev(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev, isRippling]);

  // Touch swipe only on desktop (mobile uses CSS scroll snap)
  useEffect(() => {
    const handleTouchStart = (e) => {
      if (isMobileRef.current) return;
      touchStartRef.current = { y: e.touches[0].clientY, x: e.touches[0].clientX };
    };
    const handleTouchEnd = (e) => {
      if (isMobileRef.current || !touchStartRef.current || isRippling) return;
      const dy = touchStartRef.current.y - e.changedTouches[0].clientY;
      const dx = touchStartRef.current.x - e.changedTouches[0].clientX;
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 50) {
        if (dy > 0) goNext(); else goPrev();
      }
      touchStartRef.current = null;
    };
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend',   handleTouchEnd,   { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend',   handleTouchEnd);
    };
  }, [goNext, goPrev, isRippling]);

  // Radius to fully cover screen from the ripple origin
  const rippleRadius = ripple
    ? Math.ceil(Math.hypot(
        Math.max(ripple.x, window.innerWidth  - ripple.x),
        Math.max(ripple.y, window.innerHeight - ripple.y)
      ) * 1.08)
    : 0;

  return (
    <div className={`app-container ${theme}-mode`}>
      <MouseBacklight theme={theme} />
      <div className="dot-grid-bg" />
      <div className="scanlines-overlay" />

      <PortfolioCanvas
        activeSection={activeSection}
        isTransitioning={isTransitioning}
        isZooming={false}
        theme={theme}
        onSplineLoad={() => setSplineLoaded(true)}
      />

      <div className="ui-layer">
        <ResumeContent
          activeSection={activeSection}
          isTransitioning={isTransitioning}
          onNavigate={navigateToSection}
        />
        <Navigation
          activeSection={activeSection}
          sections={SECTIONS}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          onNavigate={navigateToSection}
          isTransitioning={isTransitioning}
          theme={theme}
          onToggleTheme={toggleTheme}
          isZooming={isRippling}
        />
      </div>

      <AIOracle theme={theme} forceOpen={aiOpen} onOpenChange={setAiOpen} />

      <JediMode
        onNavigate={jediNavigate}
        onToggleTheme={toggleTheme}
        onToggleAI={jediToggleAI}
      />

      {/* ── Two-phase ink ripple ── */}
      {ripple && (
        <div
          className={`theme-ripple-overlay ripple-${ripplePhase}`}
          style={{
            left: ripple.x,
            top:  ripple.y,
            '--ripple-r':  `${rippleRadius}px`,
            '--ripple-bg': ripple.toTheme === 'light' ? '#eef2f7' : '#040608',
          }}
        />
      )}

      {/* ── Mode-switch floating toast ── */}
      {toast && (
        <ModeToast
          label={toast.label}
          originX={toast.x}
          originY={toast.y}
          onDone={() => setToast(null)}
        />
      )}
      {/* ── Boot / Reload Cyberpunk Loading Screen ── */}
      {booting && (
        <LoadingScreen
          splineLoaded={splineLoaded}
          theme={theme}
          onComplete={() => setBooting(false)}
        />
      )}
    </div>
  );
}
