import { GAME } from "../constants.js";

export class TouchControls {
  constructor(scene) {
    this.scene = scene;
    this.left = false; this.right = false; this.brake = false; this.jump = false; this.shoot = false;
    this.make();
  }

  make() {
    const s = this.scene;
    const ui = s.add.container(0, 0).setScrollFactor(0).setDepth(3000);

    const mk = (x, y, w, h, label) => {
      const bg = s.add.rectangle(x, y, w, h, 0x0b0f14, 0.55).setStrokeStyle(2, 0x2a3b50);
      const tx = s.add.text(x, y, label, { fontFamily: "system-ui, Segoe UI, Arial", fontSize: "18px", color: "#e7f0ff" }).setOrigin(0.5);
      bg.setInteractive();
      ui.add([bg, tx]);
      return bg;
    };

    const y = GAME.H - 78;
    const leftBtn  = mk(90, y, 84, 64, "◀");
    const rightBtn = mk(190, y, 84, 64, "▶");
    const brakeBtn = mk(140, y - 70, 140, 56, "BRAKE");

    const jumpBtn  = mk(GAME.W - 180, y - 18, 140, 64, "JUMP");
    const shootBtn = mk(GAME.W - 70,  y - 18, 120, 64, "SHOOT");

    const bind = (btn, onDown, onUp) => {
      btn.on("pointerdown", () => onDown());
      btn.on("pointerup", () => onUp());
      btn.on("pointerout", () => onUp());
      btn.on("pointerupoutside", () => onUp());
    };

    bind(leftBtn,  () => (this.left = true),  () => (this.left = false));
    bind(rightBtn, () => (this.right = true), () => (this.right = false));
    bind(brakeBtn, () => (this.brake = true), () => (this.brake = false));
    bind(jumpBtn,  () => (this.jump = true),  () => (this.jump = false));
    bind(shootBtn, () => (this.shoot = true), () => (this.shoot = false));

    const isTouch = ("ontouchstart" in window) || (navigator.maxTouchPoints > 0);
    ui.setAlpha(isTouch ? 1 : 0.0);
  }
}
