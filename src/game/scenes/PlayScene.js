import Phaser from "phaser";
import { GAME } from "../constants.js";

export class PlayScene extends Phaser.Scene {
  constructor() { super("Play"); }

  create() {
    this.cameras.main.setBackgroundColor("#0b0f14");

    this.add.text(GAME.W / 2, GAME.H / 2 - 30, "PLAY SCENE OK ✅", {
      fontFamily: "system-ui, Segoe UI, Arial",
      fontSize: "40px",
      color: "#e7f0ff"
    }).setOrigin(0.5);

    this.add.text(GAME.W / 2, GAME.H / 2 + 30, "Press ESC to return to menu", {
      fontFamily: "system-ui, Segoe UI, Arial",
      fontSize: "18px",
      color: "#b7c7d9"
    }).setOrigin(0.5);

    this.input.keyboard.once("keydown-ESC", () => this.scene.start("Menu"));
    this.input.once("pointerdown", () => this.scene.start("Menu"));
  }
}
