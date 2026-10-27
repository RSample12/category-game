/**
 * Synthesized sound effects (Web Audio). No audio files to load or license.
 *
 * Each sound is plain data: a list of voices ("tone" oscillators or filtered
 * "noise" bursts) scheduled relative to now. `play(name)` renders them.
 * Audio only starts after the first tap (`unlock`), because browsers block it
 * before a user gesture, and it stays silent when muted.
 */

const MUTE_KEY = 'category-detectives:muted';

const tone = (freq, at, dur, gain, o = {}) => ({ kind: 'tone', wave: 'sine', freq, at, dur, gain, ...o });
const noise = (filter, freq, at, dur, gain, o = {}) => ({ kind: 'noise', filter, freq, at, dur, gain, ...o });

// Everything is soft on purpose: sines and triangles, low-passed noise, gentle attacks.
// The master chain also runs through a low-pass (see unlock), so nothing comes out bright or clacky.

// A muffled knock: a low thump plus a dull, filtered tap.
const knock = (at, gain = 0.5) => [
  tone(150, at, 0.16, gain, { to: 60 }),
  noise('lowpass', 700, at, 0.05, gain * 0.55),
];
// Paper moving: low-passed noise that swells in rather than snapping.
const rustle = (at, dur = 0.14, gain = 0.06, freq = 800) => noise('lowpass', freq, at, dur, gain, { attack: 0.04 });
// Card edges: a little papery texture in the mids, soft attack, so cards don't sound muffled.
const paper = (at, dur, gain, freq = 1800) => noise('bandpass', freq, at, dur, gain, { q: 0.6, attack: 0.012 });
// Arpeggio notes for the win jingle (C major: C5 E5 G5 C6), soft sine.
const jingle = [523.25, 659.25, 783.99, 1046.5].map((f, i) =>
  tone(f, 0.42 + i * 0.12, i === 3 ? 0.55 : 0.24, i === 3 ? 0.12 : 0.13, { wave: i === 3 ? 'sine' : 'triangle', attack: 0.015, lowpass: 1800 }),
);

export const SOUNDS = {
  // an elimination stamp landing on a card: a rubbery thump, no click
  stamp: [tone(140, 0, 0.18, 0.62, { to: 45 }), noise('lowpass', 650, 0, 0.06, 0.32)],
  // taking a stamp back
  undo: [tone(480, 0, 0.09, 0.11, { to: 340 })],
  // the guess prompt rising
  sheet: [tone(300, 0, 0.14, 0.12, { to: 370, attack: 0.02 }), rustle(0, 0.14, 0.04, 600)],
  // turning a card over for a private reveal
  flip: [
    rustle(0, 0.16, 0.07, 1500),
    paper(0, 0.06, 0.05, 1900),
    paper(0.06, 0.07, 0.04, 1600),
    tone(240, 0.02, 0.12, 0.045, { to: 170, attack: 0.02 }),
  ],
  // picking an option (category, players, rules, timer)
  select: [tone(660, 0, 0.07, 0.07, { attack: 0.006 })],
  // any plain button
  tap: [tone(520, 0, 0.05, 0.05), rustle(0, 0.03, 0.05, 700)],
  // a group, sheet or prompt opening, and closing
  open: [rustle(0, 0.16, 0.055, 700), tone(330, 0.01, 0.15, 0.05, { to: 392, attack: 0.03 })],
  close: [rustle(0, 0.14, 0.05, 600), tone(392, 0.01, 0.14, 0.045, { to: 330, attack: 0.03 })],
  // shuffling the deck: a soft riffle, then the deck squared on the table
  shuffle: [
    ...Array.from({ length: 7 }, (_, i) => rustle(i * 0.1, 0.09, 0.05 + (i % 2) * 0.01, 1400 + (i % 3) * 250)),
    ...Array.from({ length: 7 }, (_, i) => paper(i * 0.1 + 0.01, 0.05, 0.03, 1700 + (i % 2) * 300)),
    ...knock(0.74, 0.07),
  ],
  // phone changes hands: two rising notes
  handoff: [tone(523.25, 0, 0.2, 0.13, { attack: 0.015 }), tone(783.99, 0.1, 0.28, 0.12, { attack: 0.015 })],
  // "Start my turn": two lower notes, warm
  start: [rustle(0, 0.14, 0.04, 700), tone(392, 0.03, 0.16, 0.09, { wave: 'triangle', lowpass: 1400 }), tone(523.25, 0.12, 0.24, 0.09, { wave: 'triangle', lowpass: 1400 })],
  // switching to Guess (a low, serious note) and back to ruling out
  guessmode: [tone(262, 0, 0.16, 0.08, { wave: 'triangle', lowpass: 700 }), tone(196, 0.03, 0.2, 0.06)],
  elimmode: [tone(392, 0, 0.09, 0.06)],
  // holding a peek button down, and letting go
  peek: [rustle(0, 0.1, 0.05, 600), tone(440, 0, 0.12, 0.05, { to: 494, attack: 0.03 })],
  unpeek: [tone(494, 0, 0.1, 0.035, { to: 440, attack: 0.02 })],
  // each card turning over on the game-over screen
  cardflip: [rustle(0, 0.09, 0.055, 1500), paper(0, 0.05, 0.04, 1900), tone(200, 0.04, 0.08, 0.035, { to: 150 })],
  // wrong guess: a low, dull "nope"
  wrong: [tone(196, 0, 0.3, 0.15, { wave: 'triangle', to: 147, lowpass: 500 }), tone(98, 0, 0.22, 0.09, { to: 70 })],
  // case closed: two muffled knocks, then a short rising jingle
  win: [...knock(0), ...knock(0.2), ...jingle],
  // out of cards: three falling notes
  lose: [392, 329.63, 261.63].map((f, i) => tone(f, i * 0.16, 0.32, 0.14, { wave: 'triangle', lowpass: 1200 })),
  // turn timer, last five seconds: a soft wooden tick
  tick: [tone(880, 0, 0.05, 0.07), rustle(0, 0.02, 0.035, 1200)],
  // turn timer ran out: two quick low notes
  timeup: [tone(330, 0, 0.16, 0.13, { wave: 'triangle', lowpass: 900 }), tone(220, 0.14, 0.32, 0.14, { wave: 'triangle', lowpass: 900 })],
};

// Small pitch drift so sounds that repeat a lot don't sound robotic.
const VARY = new Set(['stamp', 'undo', 'tap', 'select', 'tick', 'cardflip']);

let ctx = null;
let master = null;
let noiseBuffer = null;
let muted = false;
try {
  muted = localStorage.getItem(MUTE_KEY) === '1';
} catch {
  /* storage unavailable */
}

export const isMuted = () => muted;

export function setMuted(value) {
  muted = !!value;
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    /* ignore */
  }
}

/** Create / resume the audio context. Call from a user gesture. */
export function unlock() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      const limiter = ctx.createDynamicsCompressor(); // keeps stacked sounds from clipping
      master = ctx.createGain();
      master.gain.value = 0.8;
      // Everything passes through a gentle low-pass: muffled, never bright or harsh.
      const soften = ctx.createBiquadFilter();
      soften.type = 'lowpass';
      soften.frequency.value = 2600;
      soften.Q.value = 0.5;
      master.connect(soften);
      soften.connect(limiter);
      limiter.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
  } catch {
    /* audio unavailable */
  }
}

function getNoise() {
  if (!noiseBuffer) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

function renderVoice(v, t0, k = 1) {
  const t = t0 + v.at;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(v.gain, t + (v.attack ?? 0.008));
  env.gain.exponentialRampToValueAtTime(0.0001, t + v.dur);

  let src;
  let tail = env;
  if (v.kind === 'tone') {
    src = ctx.createOscillator();
    src.type = v.wave;
    src.frequency.setValueAtTime(v.freq * k, t);
    if (v.to) src.frequency.exponentialRampToValueAtTime(v.to * k, t + v.dur);
    if (v.lowpass) {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = v.lowpass;
      src.connect(lp);
      lp.connect(env);
    } else {
      src.connect(env);
    }
  } else {
    src = ctx.createBufferSource();
    src.buffer = getNoise();
    const f = ctx.createBiquadFilter();
    f.type = v.filter;
    f.frequency.value = v.freq * k;
    if (v.q) f.Q.value = v.q;
    src.connect(f);
    f.connect(env);
  }
  tail.connect(master);
  src.start(t, v.kind === 'noise' ? Math.random() : 0);
  src.stop(t + v.dur + 0.05);
}

export function play(name) {
  if (muted || !ctx || !SOUNDS[name]) return;
  if (ctx.state !== 'running') {
    ctx.resume?.();
    return;
  }
  try {
    const t0 = ctx.currentTime + 0.01;
    const k = VARY.has(name) ? 1 + (Math.random() - 0.5) * 0.06 : 1;
    for (const v of SOUNDS[name]) renderVoice(v, t0, k);
  } catch {
    /* never let audio break the game */
  }
}
