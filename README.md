# Interactive 3D Vision-Driven Portfolio & Mobile Web Application

**Live Domain:** [drunet.xyz](https://drunet.xyz)  
**System Architect:** Dhruv Agnihotri (CS · AI · Robotics Lead @ VIT Chennai)  
**GitHub Repository:** [github.com/dru15/portfolio-drunet](https://github.com/dru15/portfolio-drunet)  
**Architecture Specification (Word .docx):** [Interactive_3D_Vision_Driven_Portfolio_Architecture_Specification.docx](./Interactive_3D_Vision_Driven_Portfolio_Architecture_Specification.docx)  
**Technical Architecture Guide (Markdown):** [ARCHITECTURE.md](./ARCHITECTURE.md)  

---

## Technical Overview

The Interactive 3D Vision-Driven Portfolio is a GPU-accelerated web software architecture designed and engineered by Dhruv Agnihotri (Computer Science Student and Robotics Software Lead at VIT Chennai). The platform unifies browser-side edge machine learning computer vision, numerical fluid dynamics physics solvers, WebGL 3D rendering, zero-dependency procedural Web Audio synthesis, and an artificial intelligence companion into a single-page web architecture.

### Key Architectural Systems

1. **Decoupled 60 FPS RequestAnimationFrame Input Injector Engine (`JediMode.jsx`):** Converts raw ~15 FPS camera inputs from client-side WebAssembly ML models into sub-pixel 60-144 FPS input streams, eliminating visual micro-stuttering in 3D parallax tracking and fluid simulation splats.
2. **160x160 Eulerian Navier-Stokes Fluid Physics Engine (`LiquidGlassBg.jsx`):** Custom numerical fluid dynamics solver executing on HTML5 2D Canvas utilizing Gauss-Seidel pressure relaxation and velocity advection at 60+ FPS under 5% CPU overhead.
3. **Edge ML Computer Vision Perception Engine (`JediMode.jsx`):** Integrates Google MediaPipe Hands WebAssembly binaries to track 21 3D hand landmarks in real time, classifying Pointing, Force Push, Zero-Gravity Floating, and Fist gestures.
4. **Dedicated Custom Mobile Web Architecture (`MobilePortfolio.jsx`):** Engineered smartphone layout with fixed cyberpunk top headers, sticky segmented category selectors, full-height natural page flow cards, and floating ambient aurora color gradients.
5. **Zero-Dependency Procedural Web Audio Synthesizer (`audio.js`):** Generates interactive UI sound effects dynamically using browser `AudioContext` frequency ramps, gain envelopes, and oscillator nodes without loading external MP3 or WAV media assets.
6. **AI Oracle Conversational Companion System (`AIOracle.jsx`):** Integrated AI companion trained on academic metrics, robotics lead experience at Team Genesis, C++ maze algorithms, and technical projects.
7. **Automated CI/CD Deployment Pipeline (`.github/workflows/deploy.yml`):** GitHub Actions workflow compiling Vite production bundles and deploying directly to GitHub Pages bound to custom domain `drunet.xyz`.

---

## Project Structure

```
drunet-portfolio/
├── .github/workflows/deploy.yml   # GitHub Actions CI/CD deployment pipeline
├── Interactive_3D_Vision_Driven_Portfolio_Architecture_Specification.docx  # Full Word Specification
├── ARCHITECTURE.md                 # Markdown Architecture Specification
├── README.md                       # Repository Overview
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

## Technology Stack

- **Core Framework:** React 18, Vite 8, JavaScript (ES6+), HTML5, CSS3 / Custom Token System
- **Computer Vision:** Google MediaPipe Hands, WebAssembly, WebCam API
- **3D Graphics:** Spline 3D Runtime (`@splinetool/react-spline`), WebGL
- **Physics Simulation:** Eulerian Navier-Stokes Solver ($160 \times 160$ Grid), Zero-Gravity DOM Physics
- **Audio Engine:** Web Audio API (`AudioContext`, Oscillators, Gain Nodes)
- **Deployment:** GitHub Actions (`deploy.yml`), GitHub Pages (`gh-pages`), Custom Domain (`drunet.xyz`)

---

## License & Credits

- **Architect & Developer:** Dhruv Agnihotri (CS · AI · Robotics Lead @ VIT Chennai)
- **3D Assets & Characters:** Powered by Spline 3D ([spline.design](https://spline.design)) and Spline Creators
- **Vision Engine:** Google MediaPipe Hands
