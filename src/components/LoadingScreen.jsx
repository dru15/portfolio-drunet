import React, { useState, useEffect } from 'react';
import { Sparkles, Box, User, ExternalLink } from 'lucide-react';
import { playSound } from '../utils/audio';

export default function LoadingScreen({ onComplete, splineLoaded = false }) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('INITIALIZING...');
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    // Relaxed progress pace (takes ~3.5s to reach 100%)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 88 && !splineLoaded) {
          return 88; // pause briefly if Spline WebGL is still fetching
        }
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 70);

    return () => clearInterval(interval);
  }, [splineLoaded]);

  useEffect(() => {
    if (progress < 40) {
      setStatusText('INITIALIZING SYSTEM...');
    } else if (progress < 80) {
      setStatusText('LOADING 3D ASSETS FROM SPLINE...');
    } else if (progress < 100) {
      setStatusText('FINALIZING VISION FEED...');
    } else {
      setStatusText('BOOT COMPLETE');
    }

    if (progress === 100 && !isDone) {
      setIsDone(true);
      playSound('startup');
      // Give 900ms at 100% so user comfortably sees completion
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 900);
    }
  }, [progress, isDone, onComplete]);

  return (
    <div className={`boot-loading-screen ${isDone ? 'boot-fade-out' : ''}`}>
      <div className="boot-grid-overlay" />
      <div className="boot-scanlines" />

      <div className="boot-container">
        {/* Header */}
        <div className="boot-header">
          <div className="boot-badge">
            <span className="boot-dot-live" />
            SYSTEM BOOT
          </div>
          <span className="mono boot-version">DRUNET // V2.4</span>
        </div>

        {/* Center Progress Bar */}
        <div className="boot-hero-section">
          <div className="boot-percentage">
            <span className="boot-num">{progress}</span>
            <span className="boot-pct">%</span>
          </div>

          <div className="boot-status-box">
            <span className="mono boot-status-text">{statusText}</span>
            <div className="boot-bar-track">
              <div
                className="boot-bar-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Minimal Credits Card */}
        <div className="boot-credits-card">
          <div className="boot-credits-title">
            <Sparkles size={13} className="boot-icon-accent" />
            <span>CREDITS</span>
          </div>

          <div className="boot-credits-row">
            <div className="boot-credit-compact">
              <div className="boot-credit-label">
                <User size={12} />
                <span>CREATOR</span>
              </div>
              <div className="boot-credit-val highlight">Dhruv Agnihotri</div>
            </div>

            <div className="boot-credit-compact">
              <div className="boot-credit-label">
                <Box size={12} />
                <span>3D CHARACTERS &amp; SCENE</span>
              </div>
              <div className="boot-credit-val">
                Created with{' '}
                <a
                  href="https://spline.design"
                  target="_blank"
                  rel="noreferrer"
                  className="boot-link"
                >
                  Spline 3D <ExternalLink size={10} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
