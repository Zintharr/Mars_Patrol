import Phaser from "phaser";

export class Ufo extends Phaser.GameObjects.Ellipse {
  constructor(scene, x, y) {
    super(scene, x, y, 54, 24, 0xa8c7ff);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setAllowGravity(false);
    this.body.setCircle(14);
    this.body.setOffset(-14, -14);

    this.setActive(false);
    this.setVisible(false);

    this._vy = 0;
    this._wiggle = 0;
  }

  spawn(x, y, speedFactor = 1) {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.body.enable = true;

    this._vy = Phaser.Math.Between(-40, 40) * speedFactor;
    this._wiggle = Phaser.Math.Between(0, 1000);
  }

  preUpdate(time) {
    if (!this.active) return;
    this.y += Math.sin((time + this._wiggle) / 180) * 0.6 + this._vy * 0.01;
    if (this.x < -200) this.kill();
    this.body.updateFromGameObject();
  }

  onHit() { this.kill(); }

  scroll(scrollX) {
    if (!this.active) return;
    this.x -= scrollX * 1.05;
    this.body.updateFromGameObject();
  }

  kill() {
    this.setActive(false);
    this.setVisible(false);
    this.body.enable = false;
    this.x = -9999; this.y = -9999;
  }
}
