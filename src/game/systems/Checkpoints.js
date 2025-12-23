import { CHECKPOINTS } from "../constants.js";

export class Checkpoints {
  constructor(scene) {
    this.scene = scene;
    this.letters = CHECKPOINTS.LETTERS;
    this.stageLetters = CHECKPOINTS.STAGE_LETTERS;
    this.currentIndex = 0;
  }

  currentLetter() { return this.letters[this.currentIndex] ?? "Z"; }

  currentStage() {
    const major = ["A", "E", "J", "O", "T", "Z"];
    const cur = this.currentLetter();
    let stage = 1;
    for (let i = 1; i < major.length; i++) if (cur >= major[i]) stage = i + 1;
    return stage;
  }

  update(distance) {
    const idx = Math.min(Math.floor(distance / CHECKPOINTS.DISTANCE_PER_LETTER), 25);
    if (idx !== this.currentIndex) {
      this.currentIndex = idx;
      const letter = this.currentLetter();
      const isStage = this.stageLetters.has(letter);
      this.scene.addScore(100 + Math.floor(this.scene.difficulty * 20));
      return { letter, stage: isStage };
    }
    return null;
  }
}
