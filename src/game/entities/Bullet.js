import Phaser from "phaser";
import { GAME } from "../constants.js";

export class Bullet extends Phaser.GameObjects.Rectangle {
  constructor(scene, x, y) {
    super(scene, x, y, 18, 6, 0xe7f0ff);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setAllowGravity(false);
    this.setActive(false);
    this.setVisible(false);
  }

  fire(x, y, speed) {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.body.setVelocityX(speed);
  }

  preUpdate() {
    if (!this.active) return;
    if (this.x > GAME.W + 120) this.kill();
  }

  onHit() { this.kill(); }

  kill() {
    this.setActive(false);
    this.setVisible(false);
    this.body.setVelocity(0, 0);
    this.x = -9999; this.y = -9999;
  }

  scroll() {}
}
