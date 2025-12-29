# Mars Patrol 🚀

> A high-speed, procedural endless runner built with Phaser 3 and Vite.
> **No sprites. No MP3s. 100% Code.**

![Version](httpsjh://img.shields.io/badge/version-1.0.0-blue)
![Stack](https://img.shields.io/badge/tech-Phaser%203%20%7C%20Vite-orange)
![License](https://img.shields.io/badge/license-MIT-green)

## 📖 Overview

**Mars Patrol** is a retro-styled arcade game that challenges players to navigate a rover across the Martian surface.

Unlike traditional game development, this project adheres to a strict **"Zero-Asset" Architecture**. Every visual element is drawn at runtime using the `Canvas API` / `Phaser.Graphics`, and every sound effect is synthesized in real-time using the `Web Audio API`. This results in a near-instant load time and a microscopic bundle size.

## ✨ Key Features

* **Zero External Assets:** No images, sprite sheets, or audio files are loaded over the network.
* **Procedural Generation:** Infinite terrain, starfields, and obstacle placement driven by a seeded XORShift RNG.
* **Synthesized Audio Engine:** Custom `AudioBus` class utilizing Oscillators (Sawtooth, Square, Triangle) and Noise Buffers for SFX.
* **"Juice" Mechanics:** Implements "Coyote Time" jumping, jump buffering, screen shake, and glitch shaders for a responsive, modern feel.
* **Responsive Inputs:** Supports Keyboard (Desktop) and Touch Controls (Mobile).
* **High Performance:** Optimized object pooling for projectiles and particles to maintain 60FPS+.

## 🛠️ Tech Stack

* **Engine:** [Phaser 3.80](https://phaser.io/)
* **Build Tool:** [Vite 5.4](https://vitejs.dev/)
* **Language:** Modern JavaScript (ES Modules)

## 🚀 Getting Started

### Prerequisites
* Node.js (v18+ recommended)
* npm

### Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/YourUsername/mars-patrol.git](https://github.com/YourUsername/mars-patrol.git)
    cd mars-patrol
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Run the development server**
    ```bash
    npm run dev
    ```
    Open your browser to `http://localhost:5173`.

### Building for Production

To create an optimized build for deployment:
```bash
npm run build
