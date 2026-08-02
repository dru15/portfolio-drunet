import React, { useRef } from 'react';
import { Volume2, VolumeX, Sun, Moon, Home, User, Cpu, Briefcase, FileText, Mail } from 'lucide-react';
import { playSound, toggleMute } from '../utils/audio';

const SECTION_LABELS = {
  home:       'HOME',
  about:      'DOSSIER',
  skills:     'MATRIX',
  projects:   'OPERATIONS',
  experience: 'FIELD RECORD',
  contact:    'UPLINK',
};

const MOBILE_NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'about', label: 'About', icon: User },
  { id: 'skills', label: 'Skills', icon: Cpu },
  { id: 'projects', label: 'Projects', icon: Briefcase },
  { id: 'experience', label: 'Exp', icon: FileText },
  { id: 'contact', label: 'Contact', icon: Mail },
];

export default function Navigation({
  activeSection,
  sections,
  isMuted,
  setIsMuted,
  onNavigate,
  isTransitioning,
  theme,
  onToggleTheme,
  isZooming,
}) {
  const themeButtonRef = useRef(null);

  const handleMuteToggle = () => {
    const nextMuted = toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) playSound('startup');
    else playSound('click');
  };

  const handleNavClick = (sectionId) => {
    playSound('click');
    onNavigate(sectionId);
  };

  const handleNavHover = () => playSound('hover');

  const handleThemeToggle = () => {
    if (isZooming) return;
    if (themeButtonRef.current) {
      const rect = themeButtonRef.current.getBoundingClientRect();
      const cx = Math.round(rect.left + rect.width / 2);
      const cy = Math.round(rect.top + rect.height / 2);
      onToggleTheme(cx, cy, rect.bottom);
    } else {
      onToggleTheme(window.innerWidth - 80, 30, 50);
    }
  };

  const label = SECTION_LABELS[activeSection] || 'ONLINE';
  const isLight = theme === 'light';

  return (
    <>
      <div className="hud-nav-container">
        <div className="hud-nav-right">
          <div className="hud-section-display">
            <span className="hud-section-prefix mono">SECTOR //</span>
            <span
              key={activeSection}
              className={`hud-section-name ${isTransitioning ? 'glitch-text' : ''}`}
            >
              {label}
            </span>
          </div>

          <button
            ref={themeButtonRef}
            className="theme-toggle-btn"
            onClick={handleThemeToggle}
            onMouseEnter={handleNavHover}
            disabled={isZooming}
            title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
            aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {isLight ? (
              <Moon size={16} className="theme-icon-dark" />
            ) : (
              <Sun size={16} className="theme-icon-light" />
            )}
          </button>

          <button
            className="mute-button"
            onClick={handleMuteToggle}
            onMouseEnter={handleNavHover}
            title={isMuted ? 'Enable audio' : 'Mute audio'}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} style={{ color: 'var(--accent)' }} />}
          </button>
        </div>
      </div>

      {/* Desktop Sidebar Dots */}
      <div className="hud-sidebar hud-sidebar-right">
        {sections.map((sec) => (
          <div
            key={sec.id}
            className={`hud-sidebar-item ${activeSection === sec.id ? 'active' : ''}`}
            onClick={() => handleNavClick(sec.id)}
            onMouseEnter={handleNavHover}
          >
            <div className="hud-dot-label">{sec.label}</div>
            <div className="hud-dot" />
          </div>
        ))}
      </div>

      {/* Mobile Glass Bottom Navigation Dock */}
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {MOBILE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
              aria-label={item.label}
            >
              <Icon size={18} />
              <span className="mobile-nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
