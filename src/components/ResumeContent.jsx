import React, { useState, useRef, useCallback } from 'react';
import {
  ArrowRight, Send, MapPin, Mail, Phone, Code2, Link2, ExternalLink, Sparkles,
} from 'lucide-react';
import { playSound } from '../utils/audio';
import RedactedText from './RedactedText';
import TargetWrap from './TargetWrap';
import HoloCard from './HoloCard';

const RESUME = {
  name: 'Dhruv Agnihotri',
  title: 'CS · AI · Robotics',
  tagline: 'Undergraduate engineer at VIT Chennai specialising in AI, computer vision, and robotics — turning algorithms into hardware that moves in the real world.',
  location: 'Chennai, Tamil Nadu',
  email: 'dhruv150326@gmail.com',
  phone: '(+91) 9650235636',
  linkedin: 'https://linkedin.com/in/dhruv-agnihotri',
  github: 'https://github.com/dhruv150326',

  education: [
    {
      degree: 'B.Tech — Computer Science Engineering',
      institution: 'Vellore Institute of Technology, Chennai',
      period: 'July 2024 – Present',
      detail: 'CGPA · 8.74',
    },
    {
      degree: '12th (CBSE)',
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
      subtitle: 'Advanced CNN',
      desc: 'Designed and trained a custom, multi-layer Convolutional Neural Network on the MNIST dataset to process and analyse image data for robust digit recognition. Evaluated model generalization across varied real-world inputs, achieving reliable predictions on poor-quality and distorted handwriting samples.',
      tags: ['Python', 'TensorFlow', 'CNN', 'MNIST'],
    },
    {
      title: 'Real-Time Multiplayer Game',
      subtitle: 'Mobile Application',
      desc: 'Developed an intermediate-level real-time multiplayer mobile application using Kotlin and Android Studio. Integrated a Firebase backend to handle low-latency database syncing, user authentication, and concurrent state management, ensuring robust performance.',
      tags: ['Kotlin', 'Android Studio', 'Firebase', 'Mobile Dev'],
    },
  ],

  skills: {
    technical: ['Python', 'C / C++', 'Java', 'Kotlin', 'JavaScript', 'HTML / CSS', 'Assembly'],
    tools: ['TensorFlow', 'n8n', 'MySQL', 'Git', 'GitHub', 'Android Studio', 'PyGame', 'Firebase'],
    soft: ['DSA', 'OOP', 'SDLC', 'Problem Solving', 'Team Collaboration'],
  },
};

function SectionPanel({ id, activeSection, panelClass, children }) {
  const isActive = activeSection === id;
  return (
    <div
      data-section-id={id}
      className={`section-panel ${panelClass} ${isActive ? 'visible' : ''}`}
      aria-hidden={!isActive}
    >
      {children}
    </div>
  );
}

export default function ResumeContent({ activeSection, onNavigate, onMobileActiveChange }) {
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [transmitting, setTransmitting] = useState(false);

  // ── Mobile IntersectionObserver ──────────────────────────────────────
  // On mobile, all sections are rendered in a snap-scroll column.
  // The observer watches which section enters the viewport and:
  //  1. adds `.in-view` class  → triggers CSS reveal animation
  //  2. calls onMobileActiveChange → keeps nav dots in sync
  useEffect(() => {
    const isMobile = () => window.innerWidth <= 600;
    if (!isMobile()) return;

    const sections = document.querySelectorAll('[data-section-id]');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.dataset.sectionId;
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            if (entry.intersectionRatio >= 0.45) {
              onMobileActiveChange?.(id);
            }
          } else {
            // Re-trigger animation when scrolling back
            entry.target.classList.remove('in-view');
          }
        });
      },
      { threshold: [0.1, 0.45, 0.9] }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [onMobileActiveChange]);

  const handleClick = () => playSound('click');

  const handleInputChange = (e) => {
    setFormState((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formState.name || !formState.email || !formState.message) return;
    setTransmitting(true);
    playSound('transition');

    try {
      // Send real email directly to dhruv150326@gmail.com via FormSubmit AJAX API
      const res = await fetch('https://formsubmit.co/ajax/dhruv150326@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: formState.name,
          email: formState.email,
          message: formState.message,
          _subject: `⚡ Portfolio Uplink from ${formState.name}`,
        }),
      });

      if (!res.ok) {
        // Fallback: trigger direct mailto link
        window.location.href = `mailto:${RESUME.email}?subject=${encodeURIComponent(`Uplink from ${formState.name}`)}&body=${encodeURIComponent(`Name: ${formState.name}\nEmail: ${formState.email}\n\nMessage:\n${formState.message}`)}`;
      }
    } catch (err) {
      console.warn('FormSubmit API offline, triggering mailto fallback:', err);
      window.location.href = `mailto:${RESUME.email}?subject=${encodeURIComponent(`Uplink from ${formState.name}`)}&body=${encodeURIComponent(`Name: ${formState.name}\nEmail: ${formState.email}\n\nMessage:\n${formState.message}`)}`;
    } finally {
      setTransmitting(false);
      setFormSubmitted(true);
      playSound('startup');
    }
  };

  const resetForm = () => {
    setFormState({ name: '', email: '', message: '' });
    setFormSubmitted(false);
  };

  const isActive = (id) => activeSection === id;

  return (
    <div className="section-ui">

      {/* ── HOME ── */}
      <SectionPanel id="home" activeSection={activeSection} panelClass="panel-home">
        <div className="liquid-glass hero-glass">
          <div className="hero-badge">
            <span className="status-dot" />
            Available for opportunities
          </div>

          <h1 className="hero-title">
            <span className="gradient-text">Dhruv</span>
            <br />
            <span className="hero-surname">Agnihotri</span>
          </h1>

          <div className="hero-meta">
            <div className="section-divider" />
            <span className="mono hero-subtitle">{RESUME.title}</span>
          </div>

          <p className="hero-tagline">{RESUME.tagline}</p>

          <div className="hero-actions">
            <TargetWrap
              as="button"
              className="cyber-button cyber-button-primary"
              onClick={() => { handleClick(); onNavigate('about'); }}
            >
              <span>View dossier</span>
              <ArrowRight size={14} />
            </TargetWrap>
            <TargetWrap
              as="button"
              className="cyber-button"
              onClick={() => { handleClick(); onNavigate('contact'); }}
            >
              <span>Uplink</span>
            </TargetWrap>
          </div>

          <div className="scroll-indicator">
            <span>scroll / arrow keys to navigate</span>
            <span className="scroll-arrow">↓</span>
          </div>
        </div>
      </SectionPanel>

      {/* ── DOSSIER (ABOUT) ── */}
      <SectionPanel id="about" activeSection={activeSection} panelClass="panel-dossier">
        <div className="liquid-glass panel-glass">
          <span className="section-tag">01 — Dossier</span>
          <h2 className="panel-heading">Who I am</h2>
          <div className="section-divider" style={{ marginBottom: '0.75rem' }} />

          <HoloCard className="glass-panel" style={{ padding: '1.25rem', marginBottom: '0.75rem' }}>
            <p className="panel-body" style={{ marginBottom: '0.5rem', fontSize: '0.78rem' }}>
              Undergraduate Computer Engineering student at VIT Chennai with hands-on experience in{' '}
              <RedactedText active={isActive('about')} delay={200}>AI</RedactedText>,{' '}
              <RedactedText active={isActive('about')} delay={350}>computer vision</RedactedText>, and{' '}
              <RedactedText active={isActive('about')} delay={500}>robotics</RedactedText> — developing
              end-to-end projects that combine algorithms with real-world hardware deployment.
            </p>
            <p className="panel-body" style={{ marginBottom: '1rem', fontSize: '0.78rem' }}>
              Thrives on solving complex problems through practical implementation and collaborative teamwork.
            </p>

            <div className="panel-stats">
              <div className="stagger stats-grid">
                {[
                  ['Status', 'Active · Student'],
                  ['Location', RESUME.location],
                  ['CGPA', '8.74 / 10'],
                  ['Intake', 'July 2024'],
                ].map(([k, v]) => (
                  <div key={k} className="stat-item" style={{ marginBottom: '0.25rem' }}>
                    <span className="mono stat-key">{k}</span>
                    <span className="stat-val">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </HoloCard>

          <h3 className="mono panel-subheading" style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>EDUCATION</h3>
          {RESUME.education.map((edu, i) => (
            <HoloCard key={i} className="glass-panel glass-panel-compact" style={{ padding: '1rem' }}>
              <div className="edu-row">
                <div>
                  <h3 className="edu-degree" style={{ fontSize: '0.85rem' }}>{edu.degree}</h3>
                  <p className="edu-inst" style={{ fontSize: '0.75rem' }}>{edu.institution}</p>
                </div>
                <span className="project-tag" style={{ fontSize: '0.65rem' }}>{edu.period}</span>
              </div>
              <span className="mono edu-detail" style={{ fontSize: '0.75rem', marginTop: '0.35rem' }}>{edu.detail}</span>
            </HoloCard>
          ))}
        </div>
      </SectionPanel>

      {/* ── SKILLS (MATRIX) ── */}
      <SectionPanel id="skills" activeSection={activeSection} panelClass="panel-matrix">
        <div className="liquid-glass panel-glass">
          <span className="section-tag">02 — Matrix</span>
          <h2 className="panel-heading">Skill Matrix</h2>
          <div className="section-divider" />

          <HoloCard className="glass-panel matrix-panel">
            <h4 className="mono matrix-label">LANGUAGES</h4>
            <div className="skills-grid">
              {RESUME.skills.technical.map((s, i) => (
                <TargetWrap key={i} className="skill-card">
                  <span className="mono skill-name">{s}</span>
                  <div className="skill-level-bg">
                    <div className="skill-level-fill" style={{ width: isActive('skills') ? '80%' : '0%' }} />
                  </div>
                </TargetWrap>
              ))}
            </div>

            <h4 className="mono matrix-label">TOOLS &amp; FRAMEWORKS</h4>
            <div className="project-tags">
              {RESUME.skills.tools.map((t, i) => (
                <span key={i} className="project-tag">{t}</span>
              ))}
            </div>

            <h4 className="mono matrix-label">CORE FUNDAMENTALS</h4>
            <div className="project-tags">
              {RESUME.skills.soft.map((s, i) => (
                <span key={i} className="project-tag tag-sensor">{s}</span>
              ))}
            </div>
          </HoloCard>
        </div>
      </SectionPanel>

      {/* ── PROJECTS (OPS) ── */}
      <SectionPanel id="projects" activeSection={activeSection} panelClass="panel-ops">
        <div className="liquid-glass panel-glass">
          <span className="section-tag">03 — Operations</span>
          <h2 className="panel-heading">Active Ops</h2>
          <div className="section-divider" />

          <div className="ops-cards stagger">
            {RESUME.projects.map((proj, i) => (
              <HoloCard key={i} className="glass-panel project-card ops-card">
                <TargetWrap className="">
                  <h3 className="proj-title">
                    <RedactedText active={isActive('projects')} delay={i * 180 + 100}>
                      {proj.title}
                    </RedactedText>
                  </h3>
                  <span className="mono proj-sub">{proj.subtitle}</span>
                  <p className="proj-desc">{proj.desc}</p>
                  <div className="project-tags">
                    {proj.tags.map((tag, ti) => <span key={ti} className="project-tag">{tag}</span>)}
                  </div>
                </TargetWrap>
              </HoloCard>
            ))}
          </div>
        </div>
      </SectionPanel>

      {/* ── EXPERIENCE (FIELD RECORD) ── */}
      <SectionPanel id="experience" activeSection={activeSection} panelClass="panel-record">
        <div className="liquid-glass panel-glass">
          <span className="section-tag">04 — Field Record</span>
          <h2 className="panel-heading">Deployment Log</h2>
          <div className="section-divider" />

          <div className="glass-panel record-panel">
            <div className="timeline timeline-horizontal">
              {RESUME.experience.map((exp, i) => (
                <TargetWrap
                  key={i}
                  className="timeline-item timeline-h-item"
                >
                  <div className="timeline-node" />
                  <div className="timeline-date">{exp.period}</div>
                  <h3 className="exp-role">
                    <RedactedText active={isActive('experience')} delay={i * 200}>
                      {exp.role}
                    </RedactedText>
                  </h3>
                  <h4 className="exp-company">{exp.company}</h4>
                  <ul className="exp-bullets">
                    {exp.bullets.slice(0, 2).map((b, bi) => (
                      <li key={bi}>{b}</li>
                    ))}
                  </ul>
                </TargetWrap>
              ))}
            </div>
          </div>
        </div>
      </SectionPanel>

      {/* ── CONTACT (UPLINK) ── */}
      <SectionPanel id="contact" activeSection={activeSection} panelClass="panel-contact">
        <div className="liquid-glass contact-glass">
          <div className="contact-two-col">

            {/* Left: info */}
            <div className="contact-col-info">
              <span className="section-tag">05 — Uplink</span>
              <h2 className="panel-heading" style={{ marginBottom: '0.5rem' }}>Establish Uplink</h2>
              <div className="section-divider" style={{ marginBottom: '1.2rem' }} />

              <div className="contact-info-row">
                <Mail size={14} />
                <a href={`mailto:${RESUME.email}`} className="mono contact-link">{RESUME.email}</a>
              </div>
              <div className="contact-info-row">
                <Phone size={14} />
                <a href="tel:+919650235636" className="mono contact-link">{RESUME.phone}</a>
              </div>
              <div className="contact-info-row">
                <MapPin size={14} />
                <span className="mono contact-link-text">{RESUME.location}</span>
              </div>
              <div className="contact-info-row">
                <Link2 size={14} />
                <a href={RESUME.linkedin} target="_blank" rel="noopener noreferrer" className="mono contact-link">
                  LinkedIn <ExternalLink size={10} />
                </a>
              </div>
              <div className="contact-info-row">
                <Code2 size={14} />
                <a href={RESUME.github} target="_blank" rel="noopener noreferrer" className="mono contact-link">
                  GitHub <ExternalLink size={10} />
                </a>
              </div>
            </div>

            {/* Divider */}
            <div className="contact-col-divider" />

            {/* Right: form */}
            <div className="contact-col-form">
              {formSubmitted ? (
                <div className="form-success">
                  <Sparkles size={28} className="success-icon" />
                  <h3>Uplink established</h3>
                  <p>Message transmitted. Stand by for response.</p>
                  <TargetWrap as="button" className="cyber-button" onClick={resetForm}>
                    Send another
                  </TargetWrap>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="contact-form">
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input type="text" name="name" className="form-input" required placeholder="Your name"
                      value={formState.name} onChange={handleInputChange} disabled={transmitting} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" name="email" className="form-input" required placeholder="your@email.com"
                      value={formState.email} onChange={handleInputChange} disabled={transmitting} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Message</label>
                    <textarea name="message" className="form-textarea contact-textarea" required placeholder="Transmit message..."
                      value={formState.message} onChange={handleInputChange} disabled={transmitting} />
                  </div>
                  <TargetWrap
                    as="button"
                    type="submit"
                    className="cyber-button cyber-button-primary submit-btn"
                    disabled={transmitting}
                  >
                    {transmitting ? 'Transmitting…' : <><span>Transmit</span><Send size={14} /></>}
                  </TargetWrap>
                </form>
              )}
            </div>

          </div>
        </div>
      </SectionPanel>

    </div>
  );
}