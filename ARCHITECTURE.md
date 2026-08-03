# Software Architecture Specification: Interactive 3D Vision-Driven Portfolio

**System Identifier:** DRUNET-PORTFOLIO-V2.5-SPEC  
**System Architect:** Dhruv Agnihotri (CS · AI · Robotics Lead @ VIT Chennai)  
**Academic Institution:** Vellore Institute of Technology, Chennai  
**Production Domain:** [drunet.xyz](https://drunet.xyz)  
**Source Repository:** [github.com/dru15/portfolio-drunet](https://github.com/dru15/portfolio-drunet)  
**Specification Document (Word):** [Interactive_3D_Vision_Driven_Portfolio_Architecture_Specification.docx](./Interactive_3D_Vision_Driven_Portfolio_Architecture_Specification.docx)  

---

## 1. Executive System Summary

The Interactive 3D Vision-Driven Portfolio & Mobile Web Application is a high-performance web software architecture designed by Dhruv Agnihotri (Computer Science Engineering Student and Robotics Software Lead at VIT Chennai). The platform unifies client-side edge machine learning computer vision, numerical fluid dynamics physics solvers, WebGL 3D rendering, zero-dependency procedural Web Audio synthesis, and an artificial intelligence companion into a unified single-page web architecture.

Desktop clients execute WebGL 3D mascot rigs, glassmorphic HUD overlay panels, and real-time computer vision hand tracking loops. Mobile smartphone clients automatically transition to a custom-built, dedicated application layout featuring floating ambient aurora color gradients, sticky category navigation selectors, and full-height natural page flow cards.

---

## 2. End-to-End System Architecture

```
  +-----------------------------------------------------------------------------------+
  |                            INPUT & PERCEPTION LAYER                               |
  |                                                                                   |
  |   [ Webcam ] ---> [ MediaPipe Hands WASM Engine ] ---> 21 Hand Landmarks (3D)    |
  |   [ Mouse / Pointer ] --------------------------------> Raw Pointer (x, y)          |
  |   [ Touch Screen ] ---------------------------------> Screen Touch Events          |
  +-------------------+---------------------------+-----------------------------------+
                      |                           |
                      v                           v
  +-----------------------------------------------------------------------------------+
  |                   DECOUPLED 60 FPS RAF INJECTOR PIPELINE                          |
  |                                                                                   |
  |   Raw Ref Buffer (rawHand) ---> RAF Loop (60-144 FPS) ---> Lerp Smooth (0.09)     |
  |   (Eliminates ~15 FPS camera gap)                      Sub-pixel Float (0.15px)   |
  +-------------------+---------------------------+-----------------------------------+
                      |                           |
                      v                           v
  +-----------------------+   +-----------------------+   +---------------------------+
  | 3D WEBGL SCENE RIG    |   | NAVIER-STOKES ENGINE  |   | ZERO-GRAVITY DOM PHYSICS  |
  | (PortfolioCanvas.jsx) |   | (LiquidGlassBg.jsx)   |   | (JediMode.jsx Gravity)    |
  | Lerp: 0.15            |   | Grid: 160x160 Dye     |   | Rect Snapshots &          |
  | Parallax Tilt Angle   |   | Decay: 0.988 Spd>0.15 |   | Impulse Collision Solver  |
  +-----------------------+   +-----------------------+   +---------------------------+
                      |                           |
                      +---------------------------+
                                                  v
  +-----------------------------------------------------------------------------------+
  |                        PRESENTATION & VIEWPORT CONTROLLER                         |
  |                                                                                   |
  |  Desktop ( > 768px ) : 3D WebGL Canvas + Glass Cards + AI Oracle Companion        |
  |  Mobile  ( <= 768px) : MobilePortfolio.jsx + Ambient Aurora Orbs + Sticky Dock    |
  +-----------------------------------------------------------------------------------+
```

---

## 3. Key Subsystems Specifications

### 3.1 Decoupled 60 FPS RAF Input Injector Pipeline (`JediMode.jsx`)
MediaPipe inference callbacks write raw normalized hand coordinates directly to an un-rendered `useRef` target buffer (`rawHand.current`). A continuous `requestAnimationFrame` loop runs independently at display refresh rate (60 Hz to 144 Hz), computing exponential lerp convergence:

$$\text{smoothX}(t) = \text{smoothX}(t - 1) + (\text{targetX}(t) - \text{smoothX}(t - 1)) \times 0.09$$

Synthetic pointer events are dispatched only when spatial movement exceeds a `0.15px` threshold, preventing redundant CPU processing while providing silky sub-pixel precision.

### 3.2 Eulerian Navier-Stokes Liquid Physics Engine (`LiquidGlassBg.jsx`)
Implements Jos Stam's Stable Fluids algorithm on a $160 \times 160$ grid running on an HTML5 2D Canvas context:
1. Momentum Advection: $\frac{\partial \mathbf{u}}{\partial t} = -(\mathbf{u} \cdot \nabla)\mathbf{u} + \nu \nabla^2 \mathbf{u} + \mathbf{F}_{\text{ext}}$
2. Zero-Divergence Incompressibility: $\nabla \cdot \mathbf{u} = 0$ (Solved via 12 Gauss-Seidel pressure relaxation iterations).
3. Density Transport: $\frac{\partial d}{\partial t} = -(\mathbf{u} \cdot \nabla)d + \kappa \nabla^2 d - \text{decay} \cdot d$ ($\text{decay} = 0.988$).

### 3.3 Computer Vision & Edge ML Gesture Classifier (`JediMode.jsx`)
Integrates Google MediaPipe Hands WebAssembly binaries to track 21 3D hand landmarks in real time:
- **POINTING:** Index Tip extended; drives 60 FPS WebGL head tracking & fluid splats.
- **FORCE PUSH:** Palm forward Z-velocity spike; triggers kinetic flare and applies outward force impulses to UI elements.
- **OPEN PALM:** All 5 fingertips extended; activates zero-gravity DOM physics mode.
- **FIST:** All 5 fingertips folded; restores rigid gravity and layout snapping.

### 3.4 Dedicated Custom Mobile Architecture (`MobilePortfolio.jsx`)
On displays $\le 768\text{px}$, desktop overlays are bypassed in favor of a dedicated smartphone view:
- Fixed Cyberpunk Top Header (`mobile-header-bar`) with logo, status pulse dot, theme toggle, and audio toggle.
- Sticky Segmented Category Chip Bar (`mobile-category-bar`) with `scroll-margin-top: 118px`.
- Full-height natural page flow cards with zero hidden content or inner card scroll traps.
- Ambient floating aurora gradient orbs replacing heavy WebGL canvas for battery optimization.

### 3.5 AI Oracle Conversational Core (`AIOracle.jsx`)
Integrated AI companion pre-configured with Dhruv Agnihotri's resume context, VIT Chennai CGPA (8.74), robotics team leadership at Team Genesis, C++ 3D maze algorithms, and project portfolio.

### 3.6 Zero-Dependency Procedural Web Audio Engine (`audio.js`)
Synthesizes UI sound effects dynamically using browser `AudioContext` frequency ramps, gain envelopes, and oscillator nodes without loading external MP3 or WAV files.

---

## 4. Source Directory Mapping

```
drunet-portfolio/
├── .github/workflows/deploy.yml   # GitHub Actions CI/CD deployment pipeline
├── Interactive_3D_Vision_Driven_Portfolio_Architecture_Specification.docx  # Full Word Specification
├── ARCHITECTURE.md                 # Markdown Architecture Specification
├── README.md                       # Project Repository Summary
├── src/
│   ├── components/
│   │   ├── AIOracle.jsx            # Gemini AI chat assistant interface
│   │   ├── HoloCard.jsx            # 3D interactive tilt glass card wrapper
│   │   ├── JediMode.jsx            # MediaPipe hand tracking, 60fps RAF injector, DOM physics
│   │   ├── LiquidGlassBg.jsx       # 160x160 Eulerian Navier-Stokes fluid canvas
│   │   ├── LoadingScreen.jsx       # Cyberpunk boot telemetry loading screen & credits
│   │   ├── MobilePortfolio.jsx     # Custom mobile application view & category bar
│   │   ├── Navigation.jsx         # Desktop HUD header & sidebar dot navigation
│   │   ├── PortfolioCanvas.jsx     # 3D WebGL Spline mascot canvas & parallax controller
│   │   └── ResumeContent.jsx       # Desktop glass cards, experience timeline & contact form
│   ├── utils/
│   │   └── audio.js                # Procedural Web Audio API sound synthesizer
│   ├── App.jsx                     # Application root state & view routing
│   └── index.css                   # CSS design tokens, neons & mobile media queries
└── package.json                    # Dependencies & build configuration
```

---

## 5. Technical Resume Bullet Points

- **Architected Vision-Driven 3D Web Application:** Built an interactive web app integrating local edge ML hand tracking (Google MediaPipe) with WebGL 3D mascot rotation and camera parallax.
- **Engineered 60 FPS RAF Input Injector Pipeline:** Created a RequestAnimationFrame interpolation pipeline converting ~15 FPS camera feeds into 60-144 FPS inputs with sub-pixel floating-point precision (0.15px threshold).
- **Implemented Custom Navier-Stokes Fluid Solver:** Built a zero-dependency 160x160 Eulerian Navier-Stokes fluid physics engine running on HTML5 2D Canvas with velocity advection, Jacobi pressure solving, and dynamic color splats at 60+ FPS under 5% CPU overhead.
- **Developed Custom Mobile Web Architecture:** Engineered a responsive mobile application interface (MobilePortfolio.jsx) featuring sticky category navigation, full-content card flows, floating aurora ambient backgrounds, and fixed header/dock bars.
- **Synthesized Zero-Dependency Web Audio System:** Built a procedural Web Audio API sound synthesizer generating interactive UI sound cues via AudioContext frequency ramps, eliminating 100% of external audio file dependencies.
- **Automated CI/CD Deployment Pipeline:** Configured GitHub Actions workflows (deploy.yml) to compile and deploy production builds to GitHub Pages (gh-pages) linked to custom domain drunet.xyz.
