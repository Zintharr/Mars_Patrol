export class DebugHUD {
  constructor(scene) {
    this.scene = scene;
    this.text = scene.add.text(12, 10, "", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#b7c7d9"
    }).setScrollFactor(0).setDepth(2000).setAlpha(0.9);

    this.enabled = false;
    this.text.setVisible(false);
  }

  setEnabled(on) {
    this.enabled = !!on;
    this.text.setVisible(this.enabled);
  }

  toggle() { this.setEnabled(!this.enabled); }

  update(lines) {
    if (!this.enabled) return;
    this.text.setText(lines.join("\n"));
  }
}
