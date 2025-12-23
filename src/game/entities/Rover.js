import Phaser from "phaser";
import { TUNING } from "../constants.js";

export class Rover extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);

    this.isCrashed = false;

    this.bodyGfx = scene.add.rectangle(0, 0, 90, 36, 0xc8d4e3).setStrokeStyle(2, 0x2a3b50);
    this.cabin = scene.add.rectangle(16, -18, 34, 20, 0x7fb6d1).setStrokeStyle(2, 0x2a3b50);
    this.w1 = scene.add.circle(-26, 18, 12, 0x2a3b50);
    this.w2 = scene.add.circle(26, 18, 12, 0x2a3b50);
    this.add([this.bodyGfx, this.cabin, this.w1, this.w2]);

    scene.physics.world.enable(this);
    this.body.setSize(90, 50);
    this.body.setOffset(-45, -10);
    this.body.setCollideWorldBounds(true);
    this.body.setMaxVelocity(1000, 2000);

    this._speed = 260;
    this._onGround = false;
    this._coyoteUntil = 0;
    this._jumpBufferedUntil = 0;
    this._lastFireAt = 0;
    this._wormhole = false;
  }

  setOnGround(on) {
  const wasOnGround = this._onGround;
  this._onGround = on;

  if (on) this._coyoteUntil = this.scene.time.now + TUNING.COYOTE_MS;

  // Fire a one-shot "land" event for juice (dust + thunk + tiny shake)
  if (on && !wasOnGround) {
    this.scene?.onRoverLanded?.();
  }
}


  setWormhole(on) {
    this._wormhole = !!on;
    this.cabin.setFillStyle(on ? 0xa56eff : 0x7fb6d1);
  }

  currentSpeed() {
    const cap = this._wormhole ? TUNING.MAX_SPEED + 160 : TUNING.MAX_SPEED;
    return Phaser.Math.Clamp(this._speed, TUNING.MIN_SPEED, cap);
  }

  handleInput(input, dt) {
    if (this.isCrashed) return;

    const cap = this._wormhole ? TUNING.MAX_SPEED + 160 : TUNING.MAX_SPEED;

    if (input.right && !input.brake) this._speed += (TUNING.ACCEL * dt) / 1000;
    if (input.brake || input.left) this._speed -= (TUNING.BRAKE * dt) / 1000;
    this._speed = Phaser.Math.Clamp(this._speed, TUNING.MIN_SPEED, cap);

    if (input.jump) this._jumpBufferedUntil = this.scene.time.now + TUNING.JUMP_BUFFER_MS;

    const canJump = this._onGround || (this.scene.time.now <= this._coyoteUntil);
    const wantsJump = this.scene.time.now <= this._jumpBufferedUntil;

    if (canJump && wantsJump) {
      this.body.setVelocityY(-TUNING.JUMP_VELOCITY * (this._wormhole ? 1.08 : 1.0));
      this._onGround = false;
      this._jumpBufferedUntil = 0;
      this.scene.audioBus?.sfxJump();
    }

    if (input.shoot) this.tryShoot();
  }

  tryShoot() {
    const now = this.scene.time.now;
    if (now - this._lastFireAt < TUNING.FIRE_COOLDOWN_MS) return;
    this._lastFireAt = now;

    const b = this.scene.bullets.get();
    if (!b) return;

    b.fire(this.x + 60, this.y - 10, TUNING.BULLET_SPEED);
    this.scene.audioBus?.sfxShoot();
  }

  crash() {
    this.isCrashed = true;
    this.body.setVelocity(0, -220);
    this.bodyGfx.setFillStyle(0xffccd5);
    this.cabin.setFillStyle(0xff9db0);
    this.scene.tweens.add({ targets: this, angle: { from: 0, to: 18 }, duration: 220, yoyo: true, repeat: 2 });
  }
}
