import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Minimize2, Maximize2, Zap, Cpu } from 'lucide-react';
import { playSound } from '../utils/audio';

// ─── KNOWLEDGE BASE ───────────────────────────────────────────────────────────
// Each rule has:
//   k  — keyword array (substring match, padded with spaces)
//   r  — response function
//   w  — optional weight boost (default 1). High-specificity rules get boost.
//   id — unique string ID for context tracking

const KB = [
  // ── Identity / Who is Dhruv ──────────────────────────────────────────────
  {
    id: 'identity',
    k: ['who is dhruv', 'tell me about dhruv', 'about him', 'introduce dhruv', 'who made this', 'portfolio owner', 'dhruv agnihotri'],
    w: 3,
    r: () => `Dhruv Agnihotri — B.Tech Computer Science student at VIT Chennai (CGPA 8.74).
He specialises in AI, computer vision & robotics — not just theory, but hardware that actually moves.
Currently Software Lead at Team Genesis (humanoid robotics) and formerly part of Android Club VIT.
He's the kind of engineer who ships: idea → simulation → hardware.`,
  },

  // ── CIPHER identity ───────────────────────────────────────────────────────
  {
    id: 'cipher_id',
    k: ['who are you', 'what are you', 'your name', 'are you ai', 'are you a bot', 'are you real', 'cipher', 'what is cipher'],
    w: 3,
    r: () => `I'm CIPHER — Dhruv's embedded AI built into this portfolio.
I'm a rule-based + context-aware system trained on everything about him.
Think of me as his always-online briefing system — faster than an email, smarter than a FAQ page.
Ask me anything: skills, projects, experience, or just have a conversation.`,
  },

  // ── Greetings ─────────────────────────────────────────────────────────────
  {
    id: 'greeting',
    k: ['hello', 'hi ', ' hi!', 'hey', 'sup ', 'yo ', "what's up", 'hiya', 'howdy', 'helo', 'hii', 'good morning', 'good evening', 'good afternoon', 'namaste', 'wassup'],
    r: (ctx) => {
      const hour = new Date().getHours();
      const timeGreet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
      return `${timeGreet}! I'm CIPHER — Dhruv's AI.
I have full intel on his skills, projects, experience, and more.
What would you like to know?`;
    },
  },

  // ── Skills — general ──────────────────────────────────────────────────────
  {
    id: 'skills',
    k: ['skill', 'tech stack', 'technologies', 'what can he', 'what does he know', 'coding', 'program', 'framework', 'tools', 'software', 'hard skill', 'expertise', 'capable', 'ability'],
    r: () => `Tech arsenal:

Languages: Python · C/C++ · Java · Kotlin · JavaScript · HTML/CSS · Assembly
Frameworks & Libs: TensorFlow · n8n · MySQL · Firebase · PyGame
Tools: Git · GitHub · Android Studio · VS Code
Domains: Computer Vision · PID Control · Robotics · AI/ML · Embedded Systems · Mobile Dev

Want a deep-dive on any specific skill?`,
  },

  // ── Python ────────────────────────────────────────────────────────────────
  {
    id: 'python',
    k: ['python'],
    r: () => `Python is Dhruv's primary language.
He's used it for:
• ML model training (TensorFlow/Keras CNNs)
• Robotics simulations (Pygame + PID control)
• Algorithm development and data processing
• Computer vision pipelines (OpenCV)
Comfortable from quick scripts to full production pipelines.`,
  },

  // ── C++ ───────────────────────────────────────────────────────────────────
  {
    id: 'cpp',
    k: ['c++', 'cpp', ' c ', 'c/c'],
    r: () => `C/C++ is Dhruv's systems language.
Used specifically for:
• 3D adjacency matrix implementations for maze-solving
• Shortest-path algorithms (real-time navigation logic)
• Performance-critical robotics code at Team Genesis
He writes clean, optimised C++ for hardware-constrained environments.`,
  },

  // ── Kotlin / Android ─────────────────────────────────────────────────────
  {
    id: 'kotlin',
    k: ['kotlin', 'android', 'mobile', 'app dev'],
    r: () => `Dhruv is competent in mobile development:
• Built a real-time multiplayer game in Kotlin + Android Studio
• Firebase backend for low-latency state sync & auth
• Managed full app lifecycle from design → deployment
He knows his way around the Android ecosystem end-to-end.`,
  },

  // ── JavaScript / Web ─────────────────────────────────────────────────────
  {
    id: 'web',
    k: ['javascript', 'react', 'frontend', 'web dev', 'html', 'css', 'vite', 'js ', 'website'],
    r: () => `Dhruv builds on the web too — this portfolio runs on React + Vite.
He knows HTML/CSS/JS deeply and can ship polished, animated frontends.
The dark/light mode, 3D parallax, holographic cards, and this chat — all his work.
Core passion is AI and robotics, but he builds premium web experiences too.`,
  },

  // ── TensorFlow / ML ──────────────────────────────────────────────────────
  {
    id: 'ml',
    k: ['tensorflow', 'machine learning', ' ml ', 'neural', 'deep learning', 'computer vision', 'model', 'training', 'dataset', 'inference', 'cnn', 'mnist', 'artificial intelligence', ' ai '],
    w: 2,
    r: () => `AI/ML is Dhruv's primary domain:
• CNNs trained on MNIST — handles distorted, multi-digit, aged handwriting
• Computer vision pipelines for humanoid robot perception at Team Genesis
• TensorFlow/Keras for end-to-end model design, training & inference
• Applied ML in real embedded hardware contexts — not just Jupyter notebooks
He's built models that actually run on physical systems, not just benchmarks.`,
  },

  // ── Robotics ─────────────────────────────────────────────────────────────
  {
    id: 'robotics',
    k: ['robot', 'robotic', 'hardware', 'sensor', 'embedded', 'lfr', 'line follow', 'humanoid', 'wiring', 'power system', 'actuator', 'pid', 'control system'],
    w: 2,
    r: () => `Robotics is where Dhruv truly shines:
• Software Lead at Team Genesis — directing a team building a humanoid robot platform
• Integrated computer vision for real-time environment perception
• Built & deployed LFR bots with PID-tuned control loops
• Competed at IIT Bombay Techfest — national-level pressure
• Handles the full stack: code → sensor integration → power management → wiring
He's the rare engineer who can code AND hold a circuit board.`,
  },

  // ── Projects — general ───────────────────────────────────────────────────
  {
    id: 'projects',
    k: ['project', 'built', 'made', 'creation', 'what has he', 'portfolio project', 'work done', 'what did he build'],
    r: () => `Active operations:

① Handwritten Digit Recognition (Advanced CNN)
   Custom multi-layer CNN on MNIST — handles distorted, multi-digit & aged handwriting samples.
   Stack: Python · TensorFlow · OpenCV
   Evaluated generalization across poor-quality real-world inputs.

② Real-Time Multiplayer Game (Firebase)
   Android multiplayer game in Kotlin + Android Studio.
   Firebase backend handles low-latency sync, auth & concurrent state management.
   Stack: Kotlin · Android Studio · Firebase

Ask about either one for a deeper breakdown.`,
  },

  // ── Project: Digit Recognition ───────────────────────────────────────────
  {
    id: 'project_digit',
    k: ['digit', 'handwritten', 'recognition', 'mnist', 'cnn', 'image classification'],
    w: 2,
    r: () => `Handwritten Digit Recognition — deep dive:
• Architecture: custom multi-layer CNN (Convolutional Neural Network)
• Dataset: MNIST — 60,000+ training images
• Challenge solved: generalization on poor-quality, distorted, multi-digit, and aged handwriting
• Key achievement: reliable predictions far beyond clean test-set accuracy
• Stack: Python · TensorFlow/Keras · OpenCV
This wasn't just "run the tutorial" — it involved real evaluation on degraded inputs.`,
  },

  // ── Project: Multiplayer Game ────────────────────────────────────────────
  {
    id: 'project_game',
    k: ['multiplayer', 'game', 'firebase', 'kotlin', 'android studio', 'real-time game'],
    w: 2,
    r: () => `Real-Time Multiplayer Game — deep dive:
• Platform: Android (Kotlin + Android Studio)
• Backend: Firebase Realtime Database for state sync
• Features: user authentication, concurrent session management, low-latency game state
• Scope: full lifecycle — initial design through final deployment
• Challenge: ensuring consistent state across players with minimal lag
A complete end-to-end mobile project, not just a demo.`,
  },

  // ── Experience ───────────────────────────────────────────────────────────
  {
    id: 'experience',
    k: ['experience', 'work experience', 'job', 'career', 'club', 'team genesis', 'android club', 'techfest', 'iit bombay', 'event', 'management', 'member', 'field record', 'internship history'],
    r: () => `Field record:

▸ Software Lead — Team Genesis (July 2026–Present)
  Directing team building a humanoid robot platform. Core software architecture, computer vision pipelines, and sensor integration for real-time environment perception.

▸ Software & AI — Team Genesis (Aug 2024–June 2026)
  Built 3D adjacency matrix maze-solvers in C++. Tuned PID controllers for LFR bots. Competed at IIT Bombay Techfest (national level).

▸ Management — Android Club VIT Chennai (Apr 2025–May 2026)
  Cross-functional communication, on-ground logistics for large-scale hackathons, fostering collaborative developer environment.`,
  },

  // ── Team Genesis specific ─────────────────────────────────────────────────
  {
    id: 'team_genesis',
    k: ['team genesis', 'genesis', 'vit robotics', 'robotics team'],
    w: 3,
    r: () => `Team Genesis is VIT Chennai's competitive robotics team.
Dhruv's role:
• Started as Software & AI Member (Aug 2024) — built LFR & maze-solving algorithms in C++, competed at IIT Bombay Techfest
• Promoted to Software Lead (July 2026) — now directing the team building a full humanoid robot
Responsibilities span: software architecture · computer vision · sensor fusion · power systems
This isn't a hobby club. This is engineering under competition pressure.`,
  },

  // ── Education ────────────────────────────────────────────────────────────
  {
    id: 'education',
    k: ['education', 'degree', 'university', 'vit', 'college', 'cgpa', 'gpa', 'grade', 'study', 'student', 'academic', 'course', 'b.tech', 'btech', 'school', '12th', 'cbse', 'dps', 'delhi public'],
    r: () => `Education profile:

🎓 B.Tech — Computer Science Engineering
   Vellore Institute of Technology, Chennai
   Intake: July 2024 · CGPA: 8.74 / 10 · Status: Active

📚 12th Standard (CBSE)
   Delhi Public School, Sector-45, Gurgaon
   Percentage: 82.4% · Completed: May 2024`,
  },

  // ── Contact / Hire ────────────────────────────────────────────────────────
  {
    id: 'contact',
    k: ['contact', 'email', 'reach', 'hire', 'recruit', 'connect', 'linkedin', 'github', 'phone', 'number', 'social', 'link', 'message him', 'talk to him', 'get in touch'],
    r: () => `Uplink channels:
📧 dhruv150326@gmail.com
📞 (+91) 9650235636
🔗 linkedin.com/in/dhruv-agnihotri
💻 github.com/dhruv150326
📍 Chennai, Tamil Nadu, India

Or scroll to the Contact section here and send a message directly — he responds fast.`,
  },

  // ── Location ─────────────────────────────────────────────────────────────
  {
    id: 'location',
    k: ['location', 'where is he', 'where does he live', 'city', 'india', 'chennai', 'based in', 'vit campus'],
    r: () => `📍 Currently based in Chennai, Tamil Nadu — embedded in the VIT campus grid.
Originally from Delhi NCR (DPS Gurgaon), relocated to Chennai for his B.Tech in 2024.`,
  },

  // ── Availability / Hiring ────────────────────────────────────────────────
  {
    id: 'available',
    k: ['available', 'open to', 'opportunity', 'intern', 'full time', 'freelance', 'collab', 'looking for', 'hire him', 'can i hire', 'is he available', 'hiring'],
    r: () => `✦ STATUS: OPEN TO OPPORTUNITIES
Dhruv is actively looking for:
→ Internships in AI/ML & Robotics
→ Research collaborations
→ Software engineering roles
→ Freelance / project-based work

He moves fast — email him at dhruv150326@gmail.com or hit the Contact section.`,
  },

  // ── Why hire ──────────────────────────────────────────────────────────────
  {
    id: 'why_hire',
    k: ['why hire', 'why should', 'best quality', 'strength', 'standout', 'different', 'unique', 'what makes him', 'why dhruv'],
    w: 2,
    r: () => `What sets Dhruv apart:

① He ships — projects go from idea → simulation → hardware, not just theory
② He competes — IIT Bombay Techfest isn't theory, it's national-level execution under pressure
③ He bridges AI & hardware — rare combination in undergrads
④ CGPA 8.74 while leading a robotics team and running club activities
⑤ Fast learner — Kotlin, Firebase, humanoid robotics, all picked up and applied in real products

He doesn't just know the stack. He executes.`,
  },

  // ── Weakness / honest ─────────────────────────────────────────────────────
  {
    id: 'weakness',
    k: ['weakness', 'bad at', 'what he cant', 'limitation', 'honest', 'disadvantage', 'downside'],
    r: () => `Honest answer: Dhruv is early-career — 2024 intake, so industry exposure is limited vs a 3–5 year professional.
But what he lacks in years, he compensates with:
• Velocity — fast learner, quick shipper
• Real competition experience — national level robotics
• Breadth — AI, web, mobile, embedded systems
Give him a well-defined problem and he will execute.`,
  },

  // ── Portfolio / website ───────────────────────────────────────────────────
  {
    id: 'portfolio',
    k: ['portfolio', 'this site', 'this website', 'who built this', 'how did you make', 'spline', '3d robot', 'theme', 'dark mode', 'light mode', 'design', 'built in'],
    r: () => `This portfolio is 100% Dhruv's own work:
• Framework: React + Vite
• 3D robot: rendered via Spline, with parallax mouse tracking
• Transitions: custom ink-ripple dark/light mode switch
• Effects: holographic 3D cards, backlight, liquid glass, mouse backlight
• AI: CIPHER (me) — custom rule-based + context engine
Not a template. Every pixel was deliberate.`,
  },

  // ── Personality / fun ─────────────────────────────────────────────────────
  {
    id: 'personality',
    k: ['personality', 'fun fact', 'hobby', 'interest', 'outside work', 'personal', 'vibe', 'human side', 'who is he really', 'beyond code'],
    r: () => `Beyond the code:
Dhruv is the kind of person who designs a UI at 2am, debugs a motor driver at 9am, and makes it to a club meeting by noon.
He thrives at the edge where software meets the physical world.
Not just "how does this algorithm work?" but "how does this *move*?"
That restless curiosity is what drives the robotics, the AI, the whole portfolio.`,
  },

  // ── Compliments ───────────────────────────────────────────────────────────
  {
    id: 'compliment',
    k: ['cool', 'awesome', 'nice', 'great', 'impressive', 'wow', 'sick', 'fire ', 'amazing', 'insane', 'lit ', 'goat', 'legend', 'based', 'mad ', 'dope', 'love this', 'love it', 'beautiful', 'stunning'],
    r: () => `Acknowledged. Signal registered.
Dhruv spent a lot of late nights on this — so I'm glad it lands.
Anything specific you want to dig into? I've got full intel on the skills, projects, and experience behind it all.`,
  },

  // ── Thanks ────────────────────────────────────────────────────────────────
  {
    id: 'thanks',
    k: ['thanks', 'thank you', 'thx', 'ty ', 'appreciate', 'cheers', 'gracias', 'thank u'],
    r: () => `Anytime — that's what I'm here for.
If you want to reach Dhruv directly, the Contact section is right there. He's quick to respond.`,
  },

  // ── Help / menu ───────────────────────────────────────────────────────────
  {
    id: 'help',
    k: ['help', 'what can you', 'what do you know', 'guide', 'topics', 'menu', 'option', 'what can i ask'],
    r: () => `Here's what I can tell you:

• Who Dhruv is & his background
• Skills & tech stack (languages, tools, frameworks)
• Projects (CNN digit recognizer, multiplayer game)
• Experience & clubs (Team Genesis, Android Club)
• Education (VIT Chennai, CGPA, school)
• Contact & hiring info
• Robotics & AI specifics
• Why he stands out

Just type naturally — I'll pick it up.`,
  },

  // ── Bye / close ───────────────────────────────────────────────────────────
  {
    id: 'bye',
    k: ['bye', 'goodbye', 'see you', 'cya', 'later', 'gotta go', 'peace ', 'signing off'],
    r: () => `Signing off. Come back if you need more intel.
If you want to connect with Dhruv — dhruv150326@gmail.com or the Contact section.`,
  },

  // ── General CS / tech questions ───────────────────────────────────────────
  {
    id: 'what_is_ai',
    k: ['what is ai', 'what is artificial intelligence', 'explain ai', 'define ai'],
    r: () => `Artificial Intelligence (AI) is the field of building systems that can perform tasks that typically require human intelligence — like recognising images, understanding language, or making decisions.
Dhruv works in applied AI: training CNNs for image recognition and building computer vision systems for real robots.
Want to know specifically how he uses AI in his projects?`,
  },

  {
    id: 'what_is_ml',
    k: ['what is machine learning', 'explain machine learning', 'what is ml', 'define machine learning'],
    r: () => `Machine Learning (ML) is a subset of AI where systems learn patterns from data rather than following explicit rules.
Dhruv uses ML primarily through deep learning (CNNs) — training neural networks on labeled image datasets to recognise digits with high accuracy, even on degraded inputs.`,
  },

  {
    id: 'what_is_cnn',
    k: ['what is cnn', 'what is a cnn', 'convolutional neural network', 'explain cnn'],
    r: () => `A Convolutional Neural Network (CNN) is a type of deep learning model designed for image data.
It uses convolutional layers to detect local features (edges, shapes) and builds up to recognising complex patterns.
Dhruv built a custom multi-layer CNN on MNIST to recognise handwritten digits — including distorted, multi-digit, and aged handwriting that trips up simpler models.`,
  },

  {
    id: 'what_is_pid',
    k: ['what is pid', 'pid control', 'pid controller', 'explain pid'],
    r: () => `PID (Proportional-Integral-Derivative) is a control loop algorithm used to make a system reach and maintain a target value.
In robotics, it's used for smooth, accurate motion — like keeping a robot on a line without oscillating.
Dhruv implemented and fine-tuned PID controllers for line-following robots at Team Genesis, achieving stable performance at national-level competitions.`,
  },

  {
    id: 'what_is_firebase',
    k: ['what is firebase', 'firebase', 'explain firebase'],
    r: () => `Firebase is Google's backend-as-a-service platform. It provides realtime database, authentication, and cloud storage.
Dhruv used it in his multiplayer Android game to synchronise game state across players in real-time with low latency — handling auth and concurrent sessions without a custom server.`,
  },

  // ── Joke / casual ────────────────────────────────────────────────────────
  {
    id: 'joke',
    k: ['joke', 'tell me a joke', 'funny', 'make me laugh', 'entertain me'],
    r: () => `Why do programmers prefer dark mode?
Because light attracts bugs. 🐛

(Dhruv probably coded this portfolio in dark mode, for the record.)`,
  },

  {
    id: 'bored',
    k: ['bored', 'nothing to do', 'entertain', 'talk to me', 'chat'],
    r: () => `Let's talk then. Here are some interesting things about Dhruv you might not expect:
• He went from 12th grade directly into leading a national-level robotics team within a year
• He built an AI that talks back at you (hi, that's me)
• He debugs hardware AND writes polished CSS — not many can do both
What angle are you curious about?`,
  },

  // ── Affirmation prompts ───────────────────────────────────────────────────
  {
    id: 'more',
    k: ['tell me more', 'elaborate', 'more details', 'go on', 'and?', 'explain more', 'keep going', 'continue'],
    r: (ctx) => {
      if (ctx.lastTopic === 'ml' || ctx.lastTopic === 'project_digit') {
        return `Going deeper on the CNN project:
The main challenge wasn't achieving 99% on clean MNIST — any tutorial does that.
The real work was making it robust: poor scan quality, multi-digit inputs, ink degradation.
Dhruv evaluated the model on real-world degraded samples and iterated the architecture to maintain reliability.
That's the difference between a demo and a real system.`;
      }
      if (ctx.lastTopic === 'robotics' || ctx.lastTopic === 'team_genesis') {
        return `More on the robotics work:
At Team Genesis, Dhruv's role evolved from building specific algorithms (maze-solver, LFR controller) to architecting the entire software stack for a humanoid platform.
That means designing how modules communicate, how sensor data flows into decisions, and how vision feeds into locomotion.
It's systems engineering at a serious level for a university student.`;
      }
      if (ctx.lastTopic === 'experience') {
        return `Expanding on the experience:
What's notable is the trajectory — Aug 2024 intake, and by July 2026 he's Software Lead on a humanoid robot team.
That's a fast rise, driven by shipping real work: algorithms that competed nationally, code that runs on physical hardware.
The Android Club role added a different dimension — event management, cross-team coordination, logistics at scale.`;
      }
      return `I can go deeper on any specific topic. Which one?
• AI/ML & the CNN project
• Robotics & Team Genesis
• The multiplayer game
• His tech stack
• Why you should hire him
Just say the word.`;
    },
  },

  // ── Yes / No responses ────────────────────────────────────────────────────
  {
    id: 'yes',
    k: ['yes', 'yeah', 'yep', 'yup', 'sure', 'definitely', 'absolutely', 'ok ', 'okay', 'alright', 'go ahead'],
    r: (ctx) => {
      if (ctx.lastTopic) {
        return `Great — ask away. I'll give you the full breakdown on ${ctx.lastTopic.replace(/_/g, ' ')}.`;
      }
      return `Go for it — what do you want to know?`;
    },
  },

  {
    id: 'no',
    k: ['no ', "nah", 'nope', "don't", 'not really', 'nevermind', 'never mind', 'skip'],
    r: () => `No problem. Ask me something else — I'm standing by.`,
  },
];

// ─── SCORING ENGINE ──────────────────────────────────────────────────────────
// Score each rule against the input. Higher score = better match.
// Weights: exact phrase match > keyword hit frequency > rule weight boost.

function score(rule, lower) {
  let s = 0;
  for (const kw of rule.k) {
    const padded = ' ' + kw + ' ';
    if (lower.includes(padded)) {
      // Longer keyword = more specific = higher value
      s += kw.length * 2 * (rule.w || 1);
    } else if (lower.includes(kw)) {
      s += kw.length * (rule.w || 1);
    }
  }
  return s;
}

// ─── FUZZY / TYPO TOLERANCE ──────────────────────────────────────────────────
// Simple character-level substitution map for common typos

const TYPO_MAP = {
  'skilsl': 'skills', 'skils': 'skills', 'skiils': 'skills',
  'projecst': 'projects', 'projcts': 'projects', 'proejcts': 'projects',
  'experince': 'experience', 'experiecne': 'experience', 'expereince': 'experience',
  'educaiton': 'education', 'eductaion': 'education',
  'contatc': 'contact', 'contcat': 'contact',
  'rubotics': 'robotics', 'robtics': 'robotics',
  'machien': 'machine', 'machin': 'machine',
  'learing': 'learning', 'learnig': 'learning',
  'intellgence': 'intelligence', 'intlligence': 'intelligence',
  'artifical': 'artificial', 'artifcial': 'artificial',
  'netowrk': 'network', 'nueural': 'neural', 'nueral': 'neural',
  'pythoon': 'python', 'pytohn': 'python',
  'javascritp': 'javascript', 'javacript': 'javascript',
  'firebse': 'firebase', 'firebae': 'firebase',
  'availble': 'available', 'avialble': 'available',
};

function fixTypos(input) {
  let out = input;
  for (const [typo, fix] of Object.entries(TYPO_MAP)) {
    out = out.replace(new RegExp(typo, 'gi'), fix);
  }
  return out;
}

// ─── RESOLVE ─────────────────────────────────────────────────────────────────
// Returns { text, topicId } so we can track context.

const FALLBACKS = [
  (q) => `Scanning: "${q.slice(0, 32)}…" — not in my intel banks yet.
Try asking about: skills · projects · experience · contact · education · robotics · AI
Or just rephrase — I'll figure it out.`,
  (q) => `"${q.slice(0, 32)}…" — signal unclear.
I know a lot about Dhruv, but that one doesn't match anything.
Try: "what can he build?" · "how do I hire him?" · "his AI work"`,
  (q) => `Hmm, "${q.slice(0, 28)}…" isn't quite landing.
But I've got full intel on: his tech stack · robotics work · ML projects · contact info.
What are you actually trying to find out?`,
  (q) => `No direct match. Let me know what you're after — I can cover:
skills, projects, experience, education, robotics, AI/ML, hiring, personality, and more.`,
];
let fallbackIdx = 0;

function resolve(input, ctx) {
  const fixed = fixTypos(input);
  const lower = ' ' + fixed.toLowerCase() + ' ';

  let best = null;
  let bestScore = 0;

  for (const rule of KB) {
    const s = score(rule, lower);
    if (s > bestScore) {
      bestScore = s;
      best = rule;
    }
  }

  if (best && bestScore > 0) {
    return { text: best.r(ctx), topicId: best.id };
  }

  return {
    text: FALLBACKS[fallbackIdx++ % FALLBACKS.length](input),
    topicId: null,
  };
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  'Who is Dhruv?',
  'His tech skills?',
  'Projects built',
  'How to hire?',
];

const SUGGESTED_AFTER = {
  identity: ['His skills?', 'Projects built', 'How to hire?'],
  skills: ['AI/ML skills?', 'Robotics work?', 'Projects built'],
  projects: ['Tell me about the CNN', 'Tell me about the game', 'His experience?'],
  experience: ['Tell me more', 'Why hire him?', 'How to contact?'],
  ml: ['Tell me more', 'Other projects?', 'His robotics work?'],
  robotics: ['Tell me more', 'His experience?', 'Why hire him?'],
  contact: ['Why hire him?', 'His strengths?', 'His projects?'],
  why_hire: ['Contact him', 'His projects?', 'His skills?'],
};

export default function AIOracle({ theme, forceOpen, onOpenChange }) {
  const [isOpen,      setIsOpen]      = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages,    setMessages]    = useState([{
    role: 'cipher',
    text: "CIPHER ONLINE — I'm Dhruv's embedded AI. Ask me anything about him: skills, projects, experience, or anything else.",
    id: 0,
    suggestions: QUICK_PROMPTS,
  }]);
  const [input,    setInput]    = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread,setHasUnread]= useState(false);
  const [pulseBtn, setPulseBtn] = useState(true);

  // Context tracking
  const ctxRef    = useRef({ lastTopic: null });
  const chatEndRef = useRef(null);
  const inputRef   = useRef(null);
  const msgIdRef   = useRef(1);

  useEffect(() => {
    const t = setTimeout(() => setPulseBtn(false), 6000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (forceOpen !== undefined && forceOpen !== isOpen) {
      setIsOpen(forceOpen);
      if (forceOpen) {
        setIsMinimized(false);
        setHasUnread(false);
        setPulseBtn(false);
      }
    }
  }, [forceOpen, isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setHasUnread(false);
    }
  }, [isOpen]);

  const addMsg = useCallback((role, text, suggestions = null) => {
    const id = msgIdRef.current++;
    setMessages((prev) => [...prev, { role, text, id, suggestions }]);
  }, []);

  const handleSend = useCallback((query) => {
    const q = (query ?? input).trim();
    if (!q || isTyping) return;
    playSound('click');
    addMsg('user', q);
    setInput('');
    setIsTyping(true);

    // Realistic typing delay — longer for longer answers
    const delay = 400 + Math.min(q.length * 15, 900) + Math.random() * 300;

    setTimeout(() => {
      setIsTyping(false);
      const ctx = ctxRef.current;
      const { text, topicId } = resolve(q, ctx);
      if (topicId) ctxRef.current = { lastTopic: topicId };

      // Pick contextual suggestions
      const sugg = topicId && SUGGESTED_AFTER[topicId]
        ? SUGGESTED_AFTER[topicId]
        : null;

      addMsg('cipher', text, sugg);
      if (!isOpen) setHasUnread(true);
    }, delay);
  }, [input, isTyping, addMsg, isOpen]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const toggleOpen = () => {
    playSound('click');
    const newState = !isOpen;
    setIsOpen(newState);
    if (onOpenChange) onOpenChange(newState);
    setIsMinimized(false);
    setHasUnread(false);
    setPulseBtn(false);
  };

  return (
    <>
      {/* FAB — hidden while panel is open */}
      <button
        className={`oracle-fab${pulseBtn ? ' oracle-fab-pulse' : ''}${hasUnread ? ' oracle-fab-unread' : ''}${isOpen ? ' oracle-fab-hidden' : ''}`}
        onClick={toggleOpen}
        aria-label="Open CIPHER"
        title="Ask CIPHER about Dhruv"
      >
        <Cpu size={20} />
        {hasUnread  && <span className="oracle-unread-dot" />}
        {pulseBtn   && <span className="oracle-fab-ring" />}
      </button>

      {/* Chat Panel */}
      <div className={`oracle-panel${isOpen ? ' oracle-panel-open' : ''}${isMinimized ? ' oracle-panel-minimized' : ''}`}>
        {/* Header */}
        <div className="oracle-header">
          <div className="oracle-header-left">
            <div className="oracle-avatar">
              <Cpu size={13} />
              <span className="oracle-status-dot" />
            </div>
            <div className="oracle-title-block">
              <span className="oracle-title">CIPHER</span>
              <span className="oracle-subtitle mono">AI · Intel Agent</span>
            </div>
          </div>
          <div className="oracle-header-actions">
            <button className="oracle-icon-btn" onClick={() => setIsMinimized((v) => !v)} title={isMinimized ? 'Expand' : 'Minimize'}>
              {isMinimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
            </button>
            <button className="oracle-icon-btn" onClick={toggleOpen} title="Close">
              <X size={13} />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="oracle-messages cipher-messages">
              {messages.map((msg) => (
                <div key={msg.id} className={`oracle-msg oracle-msg-${msg.role === 'cipher' ? 'oracle' : 'user'}`}>
                  {msg.role === 'cipher' && (
                    <div className="oracle-msg-avatar"><Zap size={9} /></div>
                  )}
                  <div className="oracle-msg-bubble">
                    {msg.text.split('\n').map((line, i, arr) => (
                      <React.Fragment key={i}>
                        {line}{i < arr.length - 1 && <br />}
                      </React.Fragment>
                    ))}
                    {/* Contextual suggestion chips under AI messages */}
                    {msg.suggestions && (
                      <div className="oracle-suggestion-chips">
                        {msg.suggestions.map((s) => (
                          <button key={s} className="oracle-chip" onClick={() => handleSend(s)}>
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="oracle-msg oracle-msg-oracle">
                  <div className="oracle-msg-avatar"><Zap size={9} /></div>
                  <div className="oracle-msg-bubble oracle-typing-bubble">
                    <span className="oracle-typing-dot" />
                    <span className="oracle-typing-dot" />
                    <span className="oracle-typing-dot" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick prompts */}
            <div className="oracle-quick-prompts">
              {QUICK_PROMPTS.map((p) => (
                <button key={p} className="oracle-quick-btn" onClick={() => handleSend(p)}>{p}</button>
              ))}
            </div>

            {/* Input */}
            <div className="oracle-input-row">
              <input
                ref={inputRef}
                className="oracle-input mono cipher-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about Dhruv…"
                disabled={isTyping}
                autoComplete="off"
                spellCheck={false}
              />
              <button
                className="oracle-send-btn"
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                aria-label="Send"
              >
                <Send size={14} />
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
