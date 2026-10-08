let ctx: AudioContext | null = null;
let muted = localStorage.getItem("sfq_muted") === "1";

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType, vol = 0.15, delay = 0, slide = 0) {
  if (muted) return;
  try {
    const c = ac();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    const t = c.currentTime + delay;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  } catch {
    /* ignore */
  }
}

export const sfx = {
  isMuted: () => muted,
  toggle() {
    muted = !muted;
    localStorage.setItem("sfq_muted", muted ? "1" : "0");
    return muted;
  },
  unlock() {
    try {
      ac();
    } catch {
      /* ignore */
    }
  },
  tap() {
    tone(600, 0.06, "square", 0.05);
  },
  correct() {
    tone(523, 0.12, "triangle", 0.18);
    tone(659, 0.12, "triangle", 0.18, 0.08);
    tone(784, 0.2, "triangle", 0.2, 0.16);
  },
  wrong() {
    tone(220, 0.25, "sawtooth", 0.14, 0, -120);
    tone(160, 0.3, "square", 0.08, 0.05, -80);
  },
  streak() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.15, "triangle", 0.16, i * 0.06));
  },
  levelUp() {
    [392, 523, 659, 784].forEach((f, i) => tone(f, 0.18, "square", 0.08, i * 0.09));
  },
  gameOver() {
    [392, 349, 311, 262].forEach((f, i) => tone(f, 0.3, "triangle", 0.15, i * 0.2));
  },
  victory() {
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.2, "triangle", 0.16, i * 0.12));
  },
  tick() {
    tone(1200, 0.03, "square", 0.04);
  },
};
