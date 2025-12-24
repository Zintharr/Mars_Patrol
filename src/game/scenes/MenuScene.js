import Phaser from "phaser";
import { GAME } from "../constants.js";

export class MenuScene extends Phaser.Scene {
  constructor() { super("Menu"); }

  create() {
    const cx = GAME.W / 2;
    const cy = GAME.H / 2;

    this.cameras.main.setBackgroundColor("#0b0f14");

    this.add.text(cx, cy - 70, "MARS PATROL", {
      fontFamily: "system-ui, Segoe UI, Arial",
      fontSize: "56px",
      color: "#e7f0ff",
      fontStyle: "700"
    }).setOrigin(0.5);

    this.add.text(cx, cy + 10,
      "Click the game once, then press ENTER or SPACE\n(Click/tap also starts)",
      { fontFamily: "system-ui, Segoe UI, Arial", fontSize: "20px", color: "#b7c7d9", align: "center" }
    ).setOrigin(0.5);

    // Hard-focus the canvas so keys go to Phaser (Chrome can keep focus in the address bar)
    const c = this.game.canvas;
    if (c) {
      c.setAttribute("tabindex", "0");
      c.style.outline = "none";
      c.addEventListener("pointerdown", () => c.focus());
      c.focus();
    }

    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.input.on("pointerdown", () => this.startGame());

    // Visual focus hint
    this.focusHint = this.add.text(cx, GAME.H - 40, "Tip: click the game canvas once to capture keyboard focus", {
      fontFamily: "system-ui, Segoe UI, Arial",
      fontSize: "14px",
      color: "#7f93aa"
    }).setOrigin(0.5);
  }

  startGame() {
    console.log("[Menu] start -> Play");
    this.scene.start("Play");
  }

  update() {
    if (this.input.keyboard.checkDown(this.enterKey, 0)) console.log("ENTER DOWN");

	if (Phaser.Input.Keyboard.JustDown(this.enterKey) || Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.startGame();
    }
  }
}
