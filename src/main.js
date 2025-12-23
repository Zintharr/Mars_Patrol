import Phaser from "phaser";

const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: 800,
  height: 450,
  backgroundColor: "#102030",
  scene: {
    create() {
      this.add.text(200, 200, "Mars Patrol 🚀", {
        fontSize: "32px",
        color: "#ffffff"
      });
    }
  }
};

new Phaser.Game(config);
