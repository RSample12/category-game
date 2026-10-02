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

// Gavel knock: a short low thump plus a dry click.
const knock = (at) => [
  tone(190, at, 0.14, 0.55, { to: 70 }),
  noise('lowpass', 1800, at, 0.05, 0.35),
];
// Arpeggio notes for the win jingle (C major: C5 E5 G5 C6).
const jingle = [523.25, 659.25, 783.99, 1046.5].map((f, i) =>
  tone(f, 0.42 + i * 0.12, i === 3 ? 0.5 : 0.22, 0.17, { wave: 'triangle' }),
);

export const SOUNDS = {
  // an elimination stamp landing on a tag: heavy thump + paper slap
  stamp: [tone(150, 0, 0.2, 0.7, { to: 42 }), noise('lowpass', 1100, 0, 0.07, 0.4)],
  // taking a stamp back
  undo: [tone(560, 0, 0.08, 0.16, { wave: 'triangle', to: 380 })],
  // the accuse confirmation opening
  sheet: [tone(300, 0, 0.12, 0.14, { to: 380 })],
  // turning a card over for a private reveal
  flip: [noise('highpass', 2500, 0, 0.14, 0.14)],
  // picking a category
  select: [tone(880, 0, 0.05, 0.09)],
  // shuffling the deck before the deal
  shuffle: Array.from({ length: 7 }, (_, i) =>
    noise('bandpass', 2800 + (i % 3) * 500, i * 0.11, 0.09, 0.13, { q: 0.8 }),
  ),
  // phone changes hands: two rising notes
  handoff: [tone(523.25, 0, 0.18, 0.16), tone(783.99, 0.1, 0.26, 0.16)],
  // wrong accusation: a low buzzer
  wrong: [tone(170, 0, 0.34, 0.16, { wave: 'sawtooth', to: 105, lowpass: 900 })],
  // case closed: two gavel knocks, then a short rising jingle
  win: [...knock(0), ...knock(0.2), ...jingle],
  // out of suspects: three falling notes
  lose: [392, 329.63, 261.63].map((f, i) => tone(f, i * 0.16, 0.3, 0.16, { wave: 'triangle' })),
};

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
      master.connect(limiter);
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

function renderVoice(v, t0) {
  const t = t0 + v.at;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(v.gain, t + 0.008);
  env.gain.exponentialRampToValueAtTime(0.0001, t + v.dur);

  let src;
  let tail = env;
  if (v.kind === 'tone') {
    src = ctx.createOscillator();
    src.type = v.wave;
    src.frequency.setValueAtTime(v.freq, t);
    if (v.to) src.frequency.exponentialRampToValueAtTime(v.to, t + v.dur);
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
    f.frequency.value = v.freq;
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
    for (const v of SOUNDS[name]) renderVoice(v, t0);
  } catch {
    /* never let audio break the game */
  }
}
