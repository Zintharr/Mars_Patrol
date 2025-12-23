import Phaser from "phaser";
import { GAME } from "../constants.js";

export class MenuScene extends Phaser.Scene {
  constructor() { super("Menu"); }

  create() {
    const cx = GAME.W / 2;
    const cy = GAME.H / 2;

    this.add.text(cx, cy - 70, "MARS PATROL", {
      fontFamily: "system-ui, Segoe UI, Arial",
      fontSize: "56px",
      color: "#e7f0ff",
      fontStyle: "700"
    }).setOrigin(0.5);

    this.add.text(
      cx,
      cy + 10,
      "Arrow keys / A-D to steer • Space to jump • Ctrl/Enter to shoot\nOn mobile: on-screen controls\n\nPress ENTER to launch",
      { fontFamily: "system-ui, Segoe UI, Arial", fontSize: "18px", color: "#b7c7d9", align: "center" }
    ).setOrigin(0.5);

    this.add.text(
      cx,
      GAME.H - 40,
      "Tip: press M to mute • press ~ for debug HUD",
      { fontFamily: "system-ui, Segoe UI, Arial", fontSize: "14px", color: "#7f93aa" }
    ).setOrigin(0.5);

    this.input.keyboard.once("keydown-ENTER", () => this.scene.start("Play"));
    this.input.once("pointerdown", () => this.scene.start("Play"));

    // simple starfield
    const g = this.add.graphics();
    g.fillStyle(0x9fb6d1, 1);
    for (let i = 0; i < 90; i++) {
      const x = Phaser.Math.Between(0, GAME.W);
      const y = Phaser.Math.Between(0, GAME.H);
      g.fillCircle(x, y, Math.random() < 0.8 ? 1 : 2);
    }
    g.setAlpha(0.25);
  }
}
