import React, { useState, useEffect } from 'react';
import {
  ArrowRight, Send, MapPin, Mail, Phone, Code2, Link2, ExternalLink,
  Sparkles, Sun, Moon, Volume2, VolumeX, Terminal, Cpu, Briefcase,
  GraduationCap, User, Layers, ShieldCheck, ChevronRight, MessageSquare
} from 'lucide-react';
import { playSound, toggleMute } from '../utils/audio';

const RESUME = {
  name: 'Dhruv Agnihotri',
  title: 'CS · AI · Robotics Lead',
  tagline: 'Undergraduate engineer at VIT Chennai specialising in AI, computer vision, and robotics — turning algorithms into hardware that moves in the real world.',
  location: 'Chennai, Tamil Nadu',
  email: 'dhruv150326@gmail.com',
  phone: '(+91) 9650235636',
  linkedin: 'https://linkedin.com/in/dhruv-agnihotri',
  github: 'https://github.com/dhruv150326',

  stats: [
    { label: 'CGPA', val: '8.74 / 10' },
    { label: 'ROLE', val: 'Software Lead @ Team Genesis' },
    { label: 'COLLEGE', val: 'VIT Chennai' },
    { label: 'FOCUS', val: 'AI & Robotics' },
  ],

  education: [
    {
      degree: 'B.Tech — Computer Science Engineering',
      institution: 'Vellore Institute of Technology, Chennai',
      period: 'July 2024 – Present',
      detail: 'CGPA · 8.74',
    },
    {
      degree: '12th Grade (CBSE)',
      institution: 'Delhi Public School, Sector-45, Gurgaon',
      period: 'May 2024',
      detail: 'Percentage · 82.4%',
    },
  ],

  experience: [
    {
      role: 'Software Lead',
      company: 'Team Genesis (VIT Robotics Team)',
      period: 'July 2026 – Present',
      bullets: [
        'Directing a team to architect core software infrastructure for a humanoid robotics platform, integrating advanced computer vision and sensor feedback for real-time environment perception.',
      ],
    },
    {
      role: 'Software & AI Team Member',
      company: 'Team Genesis (VIT Robotics Team)',
      period: 'Aug 2024 – June 2026',
      bullets: [
        'Architected optimized 3D adjacency matrices in C++ to process shortest-path logic for real-time maze-solving navigation.',
        'Engineered and fine-tuned PID control algorithms for low-latency line-following robots, maximizing system resilience at national-level competitions (IIT Bombay Techfest).',
      ],
    },
    {
      role: 'Management Team Member',
      company: 'Android Club – VIT Chennai',
      period: 'Apr 2025 – May 2026',
      bullets: [
        'Managed cross-functional communication and on-ground logistics for large-scale technical hackathons, fostering a collaborative environment for student developers.',
      ],
    },
  ],

  projects: [
    {
      title: 'Handwritten Digit Recognition',
      subtitle: 'Advanced CNN Architecture',
      desc: 'Designed and trained a custom multi-layer Convolutional Neural Network on the MNIST dataset for robust digit recognition. Evaluated model generalization across distorted inputs, achieving reliable predictions on real-world handwriting samples.',
      tags: ['Python', 'TensorFlow', 'CNN', 'MNIST', 'Computer Vision'],
    },
    {
      title: 'Real-Time Multiplayer Game',
      subtitle: 'Mobile Application',
      desc: 'Developed an intermediate-level real-time multiplayer mobile application using Kotlin and Android Studio. Integrated a Firebase backend to handle low-latency database syncing, user authentication, and concurrent state management.',
      tags: ['Kotlin', 'Android Studio', 'Firebase', 'Real-time DB'],
    },
  ],

  skills: {
    technical: [
      { name: 'Python', level: '90%' },
      { name: 'C / C++', level: '88%' },
      { name: 'Java', level: '82%' },
      { name: 'Kotlin', level: '80%' },
      { name: 'JavaScript', level: '85%' },
      { name: 'HTML / CSS', level: '90%' },
    ],
    tools: ['TensorFlow', 'n8n', 'MySQL', 'Git', 'GitHub', 'Android Studio', 'PyGame', 'Firebase'],
    soft: ['DSA', 'OOP', 'SDLC', 'Problem Solving', 'Team Collaboration', 'Robotics Systems'],
  },
};

export default function MobilePortfolio({ theme, onToggleTheme, isMuted, setIsMuted, onOpenAI }) {
  const [activeTab, setActiveTab] = useState('all');
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [transmitting, setTransmitting] = useState(false);

  const handleMuteToggle = () => {
    const nextMuted = toggleMute();
    setIsMuted(nextMuted);
    playSound(nextMuted ? 'click' : 'startup');
  };

  const handleTabClick = (tabId) => {
    playSound('click');
    setActiveTab(tabId);
    if (tabId !== 'all') {
      const el = document.getElementById(`mobile-sec-${tabId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formState.name || !formState.email || !formState.message) return;
    setTransmitting(true);
    playSound('transition');

    try {
      const res = await fetch('https://formsubmit.co/ajax/dhruv150326@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          name: formState.name,
          email: formState.email,
          message: formState.message,
          _subject: `⚡ Mobile Uplink from ${formState.name}`,
        }),
      });

      if (!res.ok) {
        window.location.href = `mailto:${RESUME.email}?subject=${encodeURIComponent(`Mobile Uplink from ${formState.name}`)}&body=${encodeURIComponent(`Name: ${formState.name}\nEmail: ${formState.email}\n\n${formState.message}`)}`;
      }
    } catch {
      window.location.href = `mailto:${RESUME.email}?subject=${encodeURIComponent(`Mobile Uplink from ${formState.name}`)}&body=${encodeURIComponent(`Name: ${formState.name}\nEmail: ${formState.email}\n\n${formState.message}`)}`;
    } finally {
      setTransmitting(false);
      setFormSubmitted(true);
      playSound('startup');
    }
  };

  return (
    <div className="mobile-app-root">
      {/* ── Top Fixed Header ── */}
      <header className="mobile-header-bar">
        <div className="mobile-brand">
          <span className="mobile-brand-dot" />
          <span className="mobile-brand-name">DA // DHRUV</span>
        </div>
        <div className="mobile-header-actions">
          <button className="mobile-icon-btn" onClick={onToggleTheme} title="Toggle Theme">
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button className="mobile-icon-btn" onClick={handleMuteToggle} title="Toggle Mute">
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} style={{ color: 'var(--accent)' }} />}
          </button>
        </div>
      </header>

      {/* ── Sticky Segmented Category Navigation Bar ── */}
      <div className="mobile-category-bar">
        {[
          { id: 'all', label: 'Overview' },
          { id: 'about', label: 'Dossier' },
          { id: 'skills', label: 'Skills' },
          { id: 'projects', label: 'Ops' },
          { id: 'experience', label: 'Experience' },
          { id: 'contact', label: 'Uplink' },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`mobile-cat-chip ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Main Mobile Content Feed ── */}
      <main className="mobile-feed-container">
        
        {/* ── HERO BANNER CARD ── */}
        <section className="mobile-card mobile-hero-card">
          <div className="mobile-hero-badge">
            <span className="status-dot" />
            Available for Opportunities · VIT Chennai
          </div>

          <h1 className="mobile-hero-name">
            <span className="gradient-text">Dhruv</span> Agnihotri
          </h1>
          <p className="mobile-hero-title">{RESUME.title}</p>
          <p className="mobile-hero-tagline">{RESUME.tagline}</p>

          <div className="mobile-stats-pills">
            {RESUME.stats.map((s, i) => (
              <div key={i} className="mobile-stat-pill">
                <span className="mobile-stat-key">{s.label}:</span>
                <span className="mobile-stat-val">{s.val}</span>
              </div>
            ))}
          </div>

          <div className="mobile-hero-cta">
            <button
              className="mobile-btn mobile-btn-primary"
              onClick={() => handleTabClick('contact')}
            >
              <span>Establish Uplink</span>
              <ArrowRight size={14} />
            </button>
            <button
              className="mobile-btn mobile-btn-secondary"
              onClick={() => handleTabClick('projects')}
            >
              <span>View Active Ops</span>
            </button>
          </div>
        </section>

        {/* ── DOSSIER (ABOUT & EDUCATION) ── */}
        <section id="mobile-sec-about" className="mobile-card">
          <div className="mobile-card-header">
            <User size={18} className="mobile-sec-icon" />
            <div>
              <span className="mobile-sec-tag">01 // DOSSIER</span>
              <h2 className="mobile-sec-title">Who I Am</h2>
            </div>
          </div>

          <p className="mobile-body-text">
            Undergraduate Computer Science student at VIT Chennai with deep passion for{' '}
            <strong style={{ color: 'var(--accent)' }}>AI</strong>,{' '}
            <strong style={{ color: 'var(--accent-2)' }}>Computer Vision</strong>, and{' '}
            <strong style={{ color: 'var(--vision-green)' }}>Robotics Systems</strong>. Software Lead at Team Genesis working on humanoid robotics platforms.
          </p>

          <h3 className="mobile-sub-heading">Education History</h3>
          <div className="mobile-edu-list">
            {RESUME.education.map((edu, i) => (
              <div key={i} className="mobile-edu-item">
                <div className="mobile-edu-top">
                  <span className="mobile-edu-degree">{edu.degree}</span>
                  <span className="mobile-edu-badge">{edu.period}</span>
                </div>
                <div className="mobile-edu-inst">{edu.institution}</div>
                <div className="mobile-edu-detail">{edu.detail}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SKILLS MATRIX ── */}
        <section id="mobile-sec-skills" className="mobile-card">
          <div className="mobile-card-header">
            <Cpu size={18} className="mobile-sec-icon" />
            <div>
              <span className="mobile-sec-tag">02 // MATRIX</span>
              <h2 className="mobile-sec-title">Skill Matrix</h2>
            </div>
          </div>

          <h3 className="mobile-sub-heading">Programming Languages</h3>
          <div className="mobile-skill-meters">
            {RESUME.skills.technical.map((sk, i) => (
              <div key={i} className="mobile-skill-row">
                <div className="mobile-skill-info">
                  <span className="mobile-skill-name">{sk.name}</span>
                  <span className="mobile-skill-pct">{sk.level}</span>
                </div>
                <div className="mobile-skill-track">
                  <div className="mobile-skill-fill" style={{ width: sk.level }} />
                </div>
              </div>
            ))}
          </div>

          <h3 className="mobile-sub-heading" style={{ marginTop: '1.25rem' }}>Frameworks & Tools</h3>
          <div className="mobile-tags-wrap">
            {RESUME.skills.tools.map((t, i) => (
              <span key={i} className="mobile-chip">{t}</span>
            ))}
          </div>

          <h3 className="mobile-sub-heading" style={{ marginTop: '1rem' }}>Core Fundamentals</h3>
          <div className="mobile-tags-wrap">
            {RESUME.skills.soft.map((s, i) => (
              <span key={i} className="mobile-chip mobile-chip-sensor">{s}</span>
            ))}
          </div>
        </section>

        {/* ── OPERATIONS (PROJECTS) ── */}
        <section id="mobile-sec-projects" className="mobile-card">
          <div className="mobile-card-header">
            <Briefcase size={18} className="mobile-sec-icon" />
            <div>
              <span className="mobile-sec-tag">03 // OPERATIONS</span>
              <h2 className="mobile-sec-title">Active Projects</h2>
            </div>
          </div>

          <div className="mobile-projects-list">
            {RESUME.projects.map((proj, i) => (
              <div key={i} className="mobile-proj-box">
                <div className="mobile-proj-sub">{proj.subtitle}</div>
                <h3 className="mobile-proj-title">{proj.title}</h3>
                <p className="mobile-proj-desc">{proj.desc}</p>
                <div className="mobile-tags-wrap">
                  {proj.tags.map((tg, ti) => (
                    <span key={ti} className="mobile-chip">{tg}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FIELD RECORD (EXPERIENCE) ── */}
        <section id="mobile-sec-experience" className="mobile-card">
          <div className="mobile-card-header">
            <Layers size={18} className="mobile-sec-icon" />
            <div>
              <span className="mobile-sec-tag">04 // FIELD RECORD</span>
              <h2 className="mobile-sec-title">Deployment Log</h2>
            </div>
          </div>

          <div className="mobile-timeline">
            {RESUME.experience.map((exp, i) => (
              <div key={i} className="mobile-timeline-item">
                <div className="mobile-tl-dot" />
                <div className="mobile-tl-date">{exp.period}</div>
                <h3 className="mobile-tl-role">{exp.role}</h3>
                <div className="mobile-tl-company">{exp.company}</div>
                <ul className="mobile-tl-bullets">
                  {exp.bullets.map((b, bi) => (
                    <li key={bi}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── UPLINK (CONTACT) ── */}
        <section id="mobile-sec-contact" className="mobile-card">
          <div className="mobile-card-header">
            <Mail size={18} className="mobile-sec-icon" />
            <div>
              <span className="mobile-sec-tag">05 // UPLINK</span>
              <h2 className="mobile-sec-title">Establish Uplink</h2>
            </div>
          </div>

          <div className="mobile-contact-links">
            <a href={`mailto:${RESUME.email}`} className="mobile-contact-pill">
              <Mail size={16} />
              <span>{RESUME.email}</span>
            </a>
            <a href="tel:+919650235636" className="mobile-contact-pill">
              <Phone size={16} />
              <span>{RESUME.phone}</span>
            </a>
            <a href={RESUME.linkedin} target="_blank" rel="noreferrer" className="mobile-contact-pill">
              <Link2 size={16} />
              <span>LinkedIn</span>
              <ExternalLink size={12} />
            </a>
            <a href={RESUME.github} target="_blank" rel="noreferrer" className="mobile-contact-pill">
              <Code2 size={16} />
              <span>GitHub</span>
              <ExternalLink size={12} />
            </a>
          </div>

          <div className="mobile-form-wrap">
            {formSubmitted ? (
              <div className="mobile-form-success">
                <Sparkles size={24} className="success-icon" />
                <h3>Uplink Established</h3>
                <p>Message transmitted. Standing by for response.</p>
                <button className="mobile-btn mobile-btn-secondary" onClick={() => setFormSubmitted(false)}>
                  Send Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="mobile-form">
                <div className="mobile-input-group">
                  <label>Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  />
                </div>
                <div className="mobile-input-group">
                  <label>Your Email</label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                  />
                </div>
                <div className="mobile-input-group">
                  <label>Message</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Write your message..."
                    value={formState.message}
                    onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                  />
                </div>
                <button type="submit" className="mobile-btn mobile-btn-primary" disabled={transmitting}>
                  {transmitting ? 'Transmitting...' : <><span>Transmit Message</span><Send size={14} /></>}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="mobile-footer">
          <p>© {new Date().getFullYear()} Dhruv Agnihotri · Designed for Mobile Excellence</p>
        </footer>

      </main>
    </div>
  );
}
