export class AudioBus {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.enabled = true;
  }

  ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.18;
    this.master.connect(this.ctx.destination);

    const resume = async () => {
      try { await this.ctx.resume(); } catch {}
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
    };
    window.addEventListener("pointerdown", resume, { once: true });
    window.addEventListener("keydown", resume, { once: true });
  }

  setEnabled(on) { this.enabled = !!on; }

  beep({ freq = 440, dur = 0.08, type = "square", gain = 0.6, sweep = 0 }) {
    if (!this.enabled) return;
    this.ensure();
    const t0 = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (sweep !== 0) osc.frequency.linearRampToValueAtTime(Math.max(20, freq + sweep), t0 + dur);

    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(g);
    g.connect(this.master);

    osc.start(t0);
    osc.stop(t0 + dur);
  }

  noise({ dur = 0.18, gain = 0.35 }) {
    if (!this.enabled) return;
    this.ensure();
    const t0 = this.ctx.currentTime;

    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    const g = this.ctx.createGain();
    g.gain.value = gain;

    src.connect(g);
    g.connect(this.master);

    src.start(t0);
    src.stop(t0 + dur);
  }

  sfxShoot() { this.beep({ freq: 880, dur: 0.05, type: "square", gain: 0.5, sweep: -180 }); }
  sfxJump()  { this.beep({ freq: 420, dur: 0.08, type: "triangle", gain: 0.45, sweep: +140 }); }
  sfxHit()   { this.noise({ dur: 0.16, gain: 0.42 }); this.beep({ freq: 140, dur: 0.12, type: "sawtooth", gain: 0.25, sweep: -40 }); }
  sfxStage() { this.beep({ freq: 523, dur: 0.09, type: "square", gain: 0.4 }); this.beep({ freq: 784, dur: 0.09, type: "square", gain: 0.4 }); }
  sfxWormhole() {
    this.beep({ freq: 220, dur: 0.18, type: "sine", gain: 0.35, sweep: +420 });
    this.beep({ freq: 660, dur: 0.22, type: "sine", gain: 0.25, sweep: -520 });
  }
}
