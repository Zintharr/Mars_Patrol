import Phaser from "phaser";
import { GAME } from "../constants.js";

export class GameOverScene extends Phaser.Scene {
  constructor() { super("GameOver"); }

  init(data) {
    this.finalScore = data?.score ?? 0;
    this.finalCheckpoint = data?.checkpoint ?? "A";
  }

  create() {
    const cx = GAME.W / 2;
    const cy = GAME.H / 2;

    this.add.rectangle(cx, cy, 620, 260, 0x0b0f14, 0.85).setStrokeStyle(2, 0x2a3b50);

    this.add.text(cx, cy - 70, "MISSION FAILED", {
      fontFamily: "system-ui, Segoe UI, Arial",
      fontSize: "42px",
      color: "#ffccd5"
    }).setOrigin(0.5);

    this.add.text(cx, cy - 10, `Score: ${this.finalScore}\nCheckpoint: ${this.finalCheckpoint}`, {
      fontFamily: "system-ui, Segoe UI, Arial",
      fontSize: "20px",
      color: "#b7c7d9",
      align: "center"
    }).setOrigin(0.5);

    this.add.text(cx, cy + 80, "Press ENTER to retry • ESC for menu", {
      fontFamily: "system-ui, Segoe UI, Arial",
      fontSize: "18px",
      color: "#e7f0ff"
    }).setOrigin(0.5);

    this.input.keyboard.once("keydown-ENTER", () => this.scene.start("Play"));
    this.input.keyboard.once("keydown-ESC", () => this.scene.start("Menu"));
    this.input.once("pointerdown", () => this.scene.start("Play"));
  }
}
