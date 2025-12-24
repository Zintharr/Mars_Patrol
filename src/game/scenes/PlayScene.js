import Phaser from "phaser";
import { GAME, TUNING } from "../constants.js";
import { RNG } from "../util/rng.js";
import { AudioBus } from "../util/audio.js";
import { DebugHUD } from "../util/debugHud.js";

import { Rover } from "../entities/Rover.js";
import { Bullet } from "../entities/Bullet.js";
import { Obstacle } from "../entities/Obstacle.js";
import { Ufo } from "../entities/Ufo.js";

import { Spawner } from "../systems/Spawner.js";
import { Checkpoints } from "../systems/Checkpoints.js";
import { TouchControls } from "../systems/TouchControls.js";

export class PlayScene extends Phaser.Scene {
  constructor() { super("Play"); }

  create() {
    this.seed = (Date.now() & 0xffffffff) >>> 0;
    this.rng = new RNG(this.seed);

    this.audioBus = new AudioBus();
    this.muted = false;

    this.debugHUD = new DebugHUD(this);
    this.debugHUD.setEnabled(false);

    this.worldDistance = 0;
    this.score = 0;
    this.timeAlive = 0;
    this.difficulty = 1;

    // Background
    this.bg = this.add.graphics().setDepth(-10);
    this.stars = this.makeStars();

    // Ground
    this.ground = this.add.rectangle(GAME.W / 2, GAME.GROUND_Y + 60, GAME.W * 2, 200, 0x1a242e).setDepth(-1);
    this.physics.add.existing(this.ground, true);

    // Rover
    this.rover = new Rover(this, 160, GAME.GROUND_Y - 40);
    this.add.existing(this.rover);

    // Groups
    this.bullets = this.physics.add.group({ classType: Bullet, maxSize: 40, runChildUpdate: true });
    this.obstacles = this.physics.add.group({ classType: Obstacle, maxSize: 30, runChildUpdate: true });
    this.ufos = this.physics.add.group({ classType: Ufo, maxSize: 18, runChildUpdate: true });

    // Collisions
    this.physics.add.collider(this.rover, this.ground, () => this.rover.setOnGround(true));
    this.physics.add.collider(this.obstacles, this.ground);
    this.physics.add.collider(this.rover, this.obstacles, () => this.crash());

    this.physics.add.overlap(this.bullets, this.obstacles, (b, o) => {
      b.onHit(); o.onHit();
      this.addScore(50);
      this.audioBus.sfxHit();
    });

    this.physics.add.overlap(this.bullets, this.ufos, (b, u) => {
      b.onHit(); u.onHit();
      this.addScore(80);
      this.audioBus.sfxHit();
    });

    this.physics.add.overlap(this.rover, this.ufos, () => this.crash());

    // Systems
    this.checkpoints = new Checkpoints(this);
    this.spawner = new Spawner(this);
    this.touch = new TouchControls(this);

    // UI
    this.uiText = this.add.text(12, 12, "", {
      fontFamily: "system-ui, Segoe UI, Arial",
      fontSize: "18px",
      color: "#e7f0ff"
    }).setScrollFactor(0).setDepth(1500);

    this.wormhole = { active: false, endsAt: 0 };

    // Inputs
    this.keys = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
      shoot1: Phaser.Input.Keyboard.KeyCodes.CTRL,
      shoot2: Phaser.Input.Keyboard.KeyCodes.ENTER,
      debug: Phaser.Input.Keyboard.KeyCodes.TILDE,
      mute: Phaser.Input.Keyboard.KeyCodes.M,
      esc: Phaser.Input.Keyboard.KeyCodes.ESC
    });

    this.input.keyboard.on("keydown-TILDE", () => this.debugHUD.toggle());
    this.input.keyboard.on("keydown-M", () => {
      this.muted = !this.muted;
      this.audioBus.setEnabled(!this.muted);
    });
    this.input.keyboard.on("keydown-ESC", () => this.scene.start("Menu"));

    // JUICE PACK (procedural textures + emitters + overlays)
    this.makeFxTextures();
    this.setupJuiceFx();

    // Make sure audio can start after a user gesture
    this.audioBus.ensure();
  }

  addScore(amt) { this.score += amt; }

  makeStars() {
    const g = this.add.graphics().setDepth(-20);
    g.fillStyle(0x9fb6d1, 1);
    const stars = [];
    for (let i = 0; i < 120; i++) {
      stars.push({
        x: this.rng.range(0, GAME.W),
        y: this.rng.range(0, GAME.H * 0.7),
        r: this.rng.range(0.6, 2.2),
        s: this.rng.range(20, 90)
      });
    }
    return { g, stars };
  }

  // ===== JUICE HELPERS =====

  makeFxTextures() {
    // Prevent duplicate texture key errors on hot reload
    if (this.textures.exists("fx_dot") && this.textures.exists("fx_scanline")) return;

    const g = this.add.graphics();

    // Dot for dust/trail
    g.fillStyle(0xffffff, 1);
    g.fillCircle(2, 2, 2);
    g.generateTexture("fx_dot", 4, 4);
    g.clear();

    // Scanline strip
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 64, 2);
    g.generateTexture("fx_scanline", 64, 2);

    g.destroy();
  }

  setupJuiceFx() {
  // Rover trail emitter (direct ParticleEmitter)
  this.trailEmitter = this.add.particles(
    0, 0,
    "fx_dot",
    {
      x: this.rover.x - 40,
      y: this.rover.y + 18,
      lifespan: { min: 180, max: 320 },
      speedX: { min: -80, max: -240 },
      speedY: { min: -40, max: 40 },
      scale: { start: 0.9, end: 0 },
      quantity: 1,
      frequency: 35,
      alpha: { start: 0.12, end: 0 }
    }
  ).setDepth(900);

  // Landing puff emitter (off by default; we use explode)
  this.landPuff = this.add.particles(
    0, 0,
    "fx_dot",
    {
      x: this.rover.x - 10,
      y: this.rover.y + 22,
      lifespan: { min: 220, max: 420 },
      speedX: { min: -60, max: -240 },
      speedY: { min: -140, max: -40 },
      scale: { start: 1.0, end: 0 },
      quantity: 10,
      alpha: { start: 0.18, end: 0 },
      emitting: false
    }
  ).setDepth(900);

  // Screen-space scanlines (subtle)
  this.scan = this.add.tileSprite(0, 0, GAME.W, GAME.H, "fx_scanline")
    .setOrigin(0)
    .setScrollFactor(0)
    .setDepth(1200)
    .setAlpha(0.06);
  this.scan.setBlendMode(Phaser.BlendModes.ADD);

  // Wormhole glitch overlays
  this.glitchA = this.add.rectangle(GAME.W / 2, GAME.H / 2, GAME.W, GAME.H, 0x6f3cff)
    .setScrollFactor(0).setDepth(1300).setAlpha(0);
  this.glitchB = this.add.rectangle(GAME.W / 2, GAME.H / 2, GAME.W, GAME.H, 0x00d2ff)
    .setScrollFactor(0).setDepth(1301).setAlpha(0);

  this.glitchA.setBlendMode(Phaser.BlendModes.ADD);
  this.glitchB.setBlendMode(Phaser.BlendModes.ADD);
}


  onRoverLanded() {
  this.cameras.main.shake(60, 0.003);
  this.landPuff?.explode(12, this.rover.x - 10, this.rover.y + 20);
}

  // ===== GAME LOOP =====

  crash() {
    if (this.rover.isCrashed) return;
    this.rover.crash();
    this.audioBus.sfxHit();
    this.cameras.main.shake(180, 0.008);

    this.time.delayedCall(700, () => {
      this.scene.start("GameOver", { score: this.score, checkpoint: this.checkpoints.currentLetter() });
    });
  }

  tryWormhole(dt) {
    if (this.wormhole.active) return;
    const chance = TUNING.WORMHOLE_CHANCE_PER_SEC * (dt / 1000) * (0.65 + this.difficulty * 0.35);
    if (this.rng.next() < chance) {
      this.wormhole.active = true;
      this.wormhole.endsAt = this.time.now + TUNING.WORMHOLE_DURATION_MS;

      this.audioBus.sfxWormhole();
      this.addScore(200);

      this.physics.world.gravity.y = 950;
      this.rover.setWormhole(true);
    }
  }

  renderBackground(scrollX) {
    this.bg.clear();
    const { g, stars } = this.stars;

    g.clear();
    g.fillStyle(0x9fb6d1, 1);
    for (const s of stars) {
      s.x -= (scrollX / s.s) * 60;
      if (s.x < -5) s.x = GAME.W + 5;
      g.fillCircle(s.x, s.y, s.r);
    }
    g.setAlpha(0.3);

    this.bg.fillStyle(0x14202b, 1);
    for (let i = 0; i < 8; i++) {
      const x = (i * 160) - ((this.worldDistance / 8) % 160);
      this.bg.fillTriangle(x, 330, x + 120, 280, x + 240, 330);
    }

    this.bg.fillStyle(0x1b2a36, 1);
    for (let i = 0; i < 9; i++) {
      const x = (i * 140) - ((this.worldDistance / 3.5) % 140);
      this.bg.fillTriangle(x, 390, x + 90, 340, x + 180, 390);
    }

    // Scanline drift
    if (this.scan) this.scan.tilePositionY += 0.2;
  }

  update(_time, delta) {
    const dt = Math.min(delta, 50);
    this.timeAlive += dt / 1000;
    this.difficulty = 1 + this.timeAlive * TUNING.DIFFICULTY_RAMP_PER_SEC;

    if (this.wormhole.active && this.time.now >= this.wormhole.endsAt) {
      this.wormhole.active = false;
      this.physics.world.gravity.y = 1400;
      this.rover.setWormhole(false);
    }

    const left = this.keys.left.isDown || this.keys.a.isDown || this.touch.left;
    const right = this.keys.right.isDown || this.keys.d.isDown || this.touch.right;
    const brake = this.keys.down.isDown || this.keys.s.isDown || this.touch.brake;
    const jump = this.keys.jump.isDown || this.touch.jump;
    const shoot = this.keys.shoot1.isDown || this.keys.shoot2.isDown || this.touch.shoot;

    this.rover.handleInput({ left, right, brake, jump, shoot }, dt);

    const speed = this.rover.currentSpeed();
    this.worldDistance += (speed * dt) / 1000;

    const scrollX = (speed * dt) / 1000;
    this.obstacles.children.each((o) => o?.scroll(scrollX));
    this.ufos.children.each((u) => u?.scroll(scrollX));

    // Trail pinned to rover
    if (this.trailEmitter) {
      this.trailEmitter.setPosition(this.rover.x - 42, this.rover.y + 18);
      this.trailEmitter.frequency = Phaser.Math.Clamp(70 - (speed * 0.08), 18, 70);

// Phaser build differences: alpha may not be an object. Use emitter-level alpha instead.
if (typeof this.trailEmitter.setAlpha === "function") {
  this.trailEmitter.setAlpha(this.wormhole.active ? 0.22 : 0.12);
}

    }

    this.spawner.update(dt, this.difficulty);

    const cpEvent = this.checkpoints.update(this.worldDistance);
    if (cpEvent?.stage) this.audioBus.sfxStage();

    this.tryWormhole(dt);
    this.renderBackground(scrollX);

    // Wormhole glitch overlays
    if (this.wormhole.active) {
      const t = this.time.now;
      this.glitchA.setAlpha(0.05 + (Math.sin(t / 55) * 0.02));
      this.glitchB.setAlpha(0.04 + (Math.cos(t / 70) * 0.02));
      this.glitchA.x = GAME.W / 2 + (Math.sin(t / 33) * 2);
      this.glitchB.x = GAME.W / 2 + (Math.cos(t / 41) * -2);
      this.cameras.main.rotation = Math.sin(t / 180) * 0.0025;
    } else {
      this.glitchA?.setAlpha(0);
      this.glitchB?.setAlpha(0);
      this.cameras.main.rotation = 0;
    }

    const cp = this.checkpoints.currentLetter();
    const stage = this.checkpoints.currentStage();
    const worm = this.wormhole.active ? " • WORMHOLE!" : "";
    this.uiText.setText(`Score ${this.score}   CP ${cp}   Stage ${stage}${worm}`);

    this.debugHUD.update([
      `seed=${this.seed}`,
      `dist=${this.worldDistance.toFixed(1)} speed=${speed.toFixed(0)} diff=${this.difficulty.toFixed(2)}`
    ]);
  }
}
