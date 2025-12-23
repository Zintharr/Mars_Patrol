import Phaser from "phaser";

export class Obstacle extends Phaser.GameObjects.Rectangle {
  constructor(scene, x, y) {
    super(scene, x, y, 44, 34, 0x6f7f8f);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setImmovable(true);
    this.body.setAllowGravity(false);

    this.setActive(false);
    this.setVisible(false);
  }

  spawn(x, y) {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.body.enable = true;
  }

  onHit() { this.kill(); }

  preUpdate() {
    if (!this.active) return;
    if (this.x < -160) this.kill();
  }

  scroll(scrollX) {
    if (!this.active) return;
    this.x -= scrollX;
    this.body.updateFromGameObject();
  }

  kill() {
    this.setActive(false);
    this.setVisible(false);
    this.body.enable = false;
    this.x = -9999; this.y = -9999;
  }
}
