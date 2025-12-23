import Phaser from "phaser";
import { BootScene } from "./game/scenes/BootScene.js";
import { MenuScene } from "./game/scenes/MenuScene.js";
import { PlayScene } from "./game/scenes/PlayScene.js";
import { GameOverScene } from "./game/scenes/GameOverScene.js";

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#0b0f14",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 540
  },
  physics: {
    default: "arcade",
    arcade: { gravity: { y: 1400 }, debug: false }
  },
  scene: [BootScene, MenuScene, PlayScene, GameOverScene]
});
