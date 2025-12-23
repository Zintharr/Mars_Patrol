import { GAME, TUNING } from "../constants.js";

export class Spawner {
  constructor(scene) {
    this.scene = scene;
    this._obsAcc = 0;
    this._ufoAcc = 0;
  }

  update(dt, difficulty) {
    const obstacleRate = TUNING.BASE_OBSTACLE_RATE * (0.75 + difficulty * 0.35);
    const ufoRate = TUNING.BASE_UFO_RATE * (0.75 + difficulty * 0.28);

    this._obsAcc += (obstacleRate * dt) / 1000;
    this._ufoAcc += (ufoRate * dt) / 1000;

    while (this._obsAcc >= 1) { this._obsAcc -= 1; this.spawnObstacle(); }
    while (this._ufoAcc >= 1) { this._ufoAcc -= 1; this.spawnUfo(); }
  }

  spawnObstacle() {
    const s = this.scene;
    const o = s.obstacles.get();
    if (!o) return;
    const x = GAME.W + s.rng.range(60, 240);
    const y = GAME.GROUND_Y - 18;
    o.spawn(x, y);
  }

  spawnUfo() {
    const s = this.scene;
    const u = s.ufos.get();
    if (!u) return;
    const x = GAME.W + s.rng.range(80, 320);
    const y = s.rng.range(140, 300);
    u.spawn(x, y, 0.8 + s.difficulty * 0.06);
  }
}
