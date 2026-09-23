import React, { useReducer, useEffect, useRef, useState } from "react";
import {
  Search, LayoutGrid, Layers, RefreshCw, ArrowRight, Eye, EyeOff,
  Lock, Lightbulb, Target, Scissors, AlertTriangle, Award,
  Loader2, CheckCircle2, X, Users, Volume2, VolumeX, History, Trash2, Puzzle, Home, Calendar
} from "lucide-react";
import { CATEGORY_SETS, ITEM_FACTS, DEAL_LINES } from "./gameData";
import DailyRun from "./DailyRun.jsx";


function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function buildDeal(key, gamesPlayed) {
  const items = CATEGORY_SETS[key].items.map((name, idx) => ({ id: idx, name }));
  const forSecrets = shuffle(items);
  const secret = { p1: forSecrets[0].id, p2: forSecrets[1].id };
  const board = [...items].sort((a, b) => a.name.localeCompare(b.name));
  const turn = gamesPlayed % 2 === 0 ? "p1" : "p2";
  return { board, secret, turn };
}

function otherPlayer(p) { return p === "p1" ? "p2" : "p1"; }
const MID_GAME_SCREENS = new Set(["dealing", "handoff", "play", "solo-play"]);
function hasFreshEliminations(state, turn) {
  return Object.keys(state.eliminated[turn]).some((id) => !state.locked[turn][id]);
}

/* =========================================================================
   SOLO PUZZLE — Wordle-style single-player mode. One secret item, one
   real fun-fact clue revealed each round (origin/history, then trait,
   then appearance, then the most identifying fact). Every wrong guess is
   compared to the answer's category classification (an AKC group, a
   Pokémon type, a broad profession, a country of origin) and marked
   CLOSE or FAR — that classification is never shown as a clue itself,
   just used for the smart-guess feedback.
   ========================================================================= */

const SOLO_CATEGORIES = Object.keys(ITEM_FACTS);
const MAX_ROUNDS = 4;

function factsFor(categoryKey, name) {
  return (ITEM_FACTS[categoryKey] && ITEM_FACTS[categoryKey][name]) || { group: null, clues: [] };
}

function buildSoloPuzzle(categoryKey) {
  const items = CATEGORY_SETS[categoryKey].items.map((name, idx) => ({ id: idx, name }));
  const board = [...items].sort((a, b) => a.name.localeCompare(b.name));
  const secretItem = pickRandom(items);
  return {
    board,
    soloSecretId: secretItem.id,
    soloClues: factsFor(categoryKey, secretItem.name).clues,
    soloMaxRounds: MAX_ROUNDS
  };
}

/* =========================================================================
   SOUND — tiny Web Audio synth, no audio files. Tactile sounds fire from
   click handlers; outcome sounds fire reactively off state transitions.
   ========================================================================= */

let audioCtx = null;
function getCtx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}
function tone(freq, duration, type, startGain, delay) {
  if (!Sound.enabled) return;
  const ctx = getCtx();
  if (!ctx) return;
  const t0 = ctx.currentTime + (delay || 0);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || "sine";
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(startGain || 0.06, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.03);
}
const Sound = {
  enabled: true,
  click() { tone(720, 0.045, "square", 0.05); },
  select() { tone(560, 0.07, "sine", 0.06); },
  eliminate() { tone(240, 0.09, "square", 0.05); },
  undo() { tone(340, 0.06, "square", 0.045); },
  openGuess() { tone(880, 0.08, "triangle", 0.06); },
  deal() { tone(300, 0.06, "sine", 0.05, 0); tone(450, 0.06, "sine", 0.05, 0.07); tone(600, 0.08, "sine", 0.05, 0.14); },
  correct() { tone(523.25, 0.12, "sine", 0.07, 0); tone(659.25, 0.12, "sine", 0.07, 0.09); tone(783.99, 0.18, "sine", 0.08, 0.18); },
  wrong() { tone(220, 0.16, "sawtooth", 0.06, 0); tone(164.81, 0.22, "sawtooth", 0.06, 0.1); },
  lose() { tone(392, 0.14, "sawtooth", 0.05, 0); tone(311.13, 0.14, "sawtooth", 0.05, 0.12); tone(233.08, 0.24, "sawtooth", 0.06, 0.24); }
};

const SOUND_KEY = "category-detectives-sound";
function loadSoundPref() {
  try { return localStorage.getItem(SOUND_KEY) !== "0"; } catch { return true; }
}

/* =========================================================================
   STATS — persisted to localStorage.
   ========================================================================= */

const STATS_KEY = "category-detectives-stats-v2";
const DEFAULT_STATS = { gamesPlayed: 0, soloWins: 0, soloLosses: 0, soloStreak: 0, soloBestStreak: 0, categoryCounts: {} };

function loadStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { ...DEFAULT_STATS, categoryCounts: {} };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATS, ...parsed, categoryCounts: { ...(parsed.categoryCounts || {}) } };
  } catch {
    return { ...DEFAULT_STATS, categoryCounts: {} };
  }
}

/* =========================================================================
   STATE
   ========================================================================= */

const initialState = {
  screen: "intro",
  gameMode: "duel",       // "duel" | "solo"
  names: { p1: "Player 1", p2: "Player 2" },
  categoryKey: null,
  board: [],
  // duel fields
  secret: { p1: null, p2: null },
  eliminated: { p1: {}, p2: {} },
  locked: { p1: {}, p2: {} },
  turn: "p1",
  rounds: 0,
  mode: "eliminate",
  modalGuess: null,
  turnNotice: null,
  score: { p1: 0, p2: 0 },
  // solo fields
  soloSecretId: null,
  soloClues: [],
  soloRound: 0,
  soloMaxRounds: 0,
  soloWrongGuesses: {},
  soloModalGuess: null,
  // shared
  winner: null,
  winReason: null,
  gamesPlayed: 0
};

function resolveGuess(state, turn, opponent, id) {
  const correct = state.secret[opponent] === id;
  const remainingBeforeGuess = state.board.filter((b) => !state.eliminated[turn][b.id]);
  const wasLastOption = remainingBeforeGuess.length <= 1;

  if (correct) {
    return {
      ...state, modalGuess: null,
      winner: turn, winReason: "correct_guess",
      score: { ...state.score, [turn]: state.score[turn] + 1 },
      screen: "win"
    };
  }
  if (wasLastOption) {
    const eliminated = { ...state.eliminated, [turn]: { ...state.eliminated[turn], [id]: true } };
    return {
      ...state, modalGuess: null, eliminated,
      winner: opponent, winReason: "opponent_exhausted",
      score: { ...state.score, [opponent]: state.score[opponent] + 1 },
      screen: "win"
    };
  }
  const nextElimTurn = { ...state.eliminated[turn], [id]: true };
  const locked = { ...state.locked, [turn]: { ...state.locked[turn], ...nextElimTurn } };
  const item = state.board.find((b) => b.id === id);
  return {
    ...state, modalGuess: null,
    eliminated: { ...state.eliminated, [turn]: nextElimTurn },
    locked,
    rounds: state.rounds + 1,
    turnNotice: { wrongGuess: true, guesser: turn, itemName: item ? item.name : "" },
    turn: opponent, mode: "eliminate",
    screen: "handoff"
  };
}

function reducer(state, action) {
  switch (action.type) {
    case "SET_NAME":
      return { ...state, names: { ...state.names, [action.player]: action.value } };

    case "SET_GAME_MODE":
      return { ...state, gameMode: action.value };

    case "GO_CATEGORY":
      return { ...state, screen: "category" };

    case "ENTER_DAILY":
      return { ...state, screen: "daily" };

    case "SELECT_CATEGORY":
      return { ...state, categoryKey: action.key };

    case "DEAL": {
      if (state.gameMode === "solo") {
        const { board, soloSecretId, soloClues, soloMaxRounds } = buildSoloPuzzle(state.categoryKey);
        return {
          ...state, board, soloSecretId, soloClues, soloMaxRounds,
          soloRound: 0, soloWrongGuesses: {}, soloModalGuess: null,
          winner: null, winReason: null,
          gamesPlayed: state.gamesPlayed + 1,
          screen: "dealing"
        };
      }
      const { board, secret, turn } = buildDeal(state.categoryKey, state.gamesPlayed);
      return {
        ...state, board, secret, turn,
        eliminated: { p1: {}, p2: {} },
        locked: { p1: {}, p2: {} },
        rounds: 0, winner: null, winReason: null, mode: "eliminate",
        modalGuess: null, turnNotice: null,
        gamesPlayed: state.gamesPlayed + 1,
        screen: "dealing"
      };
    }

    case "FINISH_DEALING": {
      if (state.screen !== "dealing") return state;
      return { ...state, screen: state.gameMode === "solo" ? "solo-play" : "play" };
    }

    case "SET_MODE": {
      if (action.mode === "guess" && hasFreshEliminations(state, state.turn)) return state;
      return { ...state, mode: action.mode };
    }

    case "TOGGLE_ELIMINATE": {
      const { turn } = state;
      const id = action.id;
      const isElim = !!state.eliminated[turn][id];
      const isLocked = !!state.locked[turn][id];
      if (isLocked) return state;
      if (!isElim) {
        const remainingBefore = state.board.filter((b) => !state.eliminated[turn][b.id]);
        if (remainingBefore.length <= 1) return { ...state, modalGuess: id };
      }
      const nextElim = { ...state.eliminated[turn] };
      if (isElim) delete nextElim[id]; else nextElim[id] = true;
      const eliminated = { ...state.eliminated, [turn]: nextElim };
      const remaining = state.board.filter((b) => !eliminated[turn][b.id]);
      const modalGuess = remaining.length === 1 ? remaining[0].id : null;
      return { ...state, eliminated, modalGuess };
    }

    case "OPEN_GUESS": {
      const isElim = !!state.eliminated[state.turn][action.id];
      if (isElim) return state;
      return { ...state, modalGuess: action.id };
    }

    case "CANCEL_GUESS":
      return { ...state, modalGuess: null };

    case "CONFIRM_GUESS": {
      const { turn } = state;
      const opponent = otherPlayer(turn);
      return resolveGuess(state, turn, opponent, state.modalGuess);
    }

    case "END_TURN": {
      const { turn } = state;
      const locked = { ...state.locked, [turn]: { ...state.locked[turn], ...state.eliminated[turn] } };
      return {
        ...state, locked, rounds: state.rounds + 1,
        turn: otherPlayer(turn), mode: "eliminate",
        screen: "handoff"
      };
    }

    case "ACK_HANDOFF":
      return { ...state, turnNotice: null, screen: "play" };

    case "SOLO_OPEN_GUESS": {
      if (state.soloWrongGuesses[action.id]) return state;
      return { ...state, soloModalGuess: action.id };
    }

    case "SOLO_CANCEL_GUESS":
      return { ...state, soloModalGuess: null };

    case "SOLO_CONFIRM_GUESS": {
      const id = state.soloModalGuess;
      if (id === state.soloSecretId) {
        return { ...state, soloModalGuess: null, winner: "player", winReason: "solo_win", screen: "win" };
      }
      const guessedItem = state.board.find((b) => b.id === id);
      const secretItem = state.board.find((b) => b.id === state.soloSecretId);
      const guessedGroup = factsFor(state.categoryKey, guessedItem.name).group;
      const secretGroup = factsFor(state.categoryKey, secretItem.name).group;
      const isClose = guessedGroup !== null && guessedGroup === secretGroup;

      const nextRound = state.soloRound + 1;
      const soloWrongGuesses = { ...state.soloWrongGuesses, [id]: { isClose } };
      if (nextRound >= state.soloMaxRounds) {
        return { ...state, soloModalGuess: null, soloWrongGuesses, soloRound: nextRound, winner: null, winReason: "solo_lose", screen: "win" };
      }
      return { ...state, soloModalGuess: null, soloWrongGuesses, soloRound: nextRound };
    }

    case "SOLO_REMATCH": {
      const { board, soloSecretId, soloClues, soloMaxRounds } = buildSoloPuzzle(state.categoryKey);
      return {
        ...state, board, soloSecretId, soloClues, soloMaxRounds,
        soloRound: 0, soloWrongGuesses: {}, soloModalGuess: null,
        winner: null, winReason: null,
        gamesPlayed: state.gamesPlayed + 1,
        screen: "dealing"
      };
    }

    case "REMATCH_SAME_CATEGORY": {
      const { board, secret, turn } = buildDeal(state.categoryKey, state.gamesPlayed);
      return {
        ...state, board, secret, turn,
        eliminated: { p1: {}, p2: {} }, locked: { p1: {}, p2: {} },
        rounds: 0, winner: null, winReason: null, mode: "eliminate",
        modalGuess: null, turnNotice: null,
        gamesPlayed: state.gamesPlayed + 1, screen: "dealing"
      };
    }

    case "NEW_CATEGORY":
      return { ...state, categoryKey: null, screen: "category" };

    case "BACK_TO_START":
      return { ...state, screen: "intro", score: { p1: 0, p2: 0 }, gamesPlayed: 0 };

    default:
      return state;
  }
}

/* =========================================================================
   STYLE — Terminal Noir: near-black system, one amber signal, mono data
   readouts, condensed industrial display type.
   ========================================================================= */

function FontLoader() {
  useEffect(() => {
    if (document.getElementById("cd-terminal-fonts")) return;
    const link = document.createElement("link");
    link.id = "cd-terminal-fonts";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800;900&family=Public+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
  return null;
}

function GlobalStyles() {
  return (
    <style>{`
      html, body {
        margin: 0;
        padding: 0;
        background: #0A0A0C;
      }
      #root {
        min-height: 100vh;
        background: #0A0A0C;
      }
      .cd-root {
        --void: #0A0A0C;
        --panel: #131317;
        --panel-2: #1B1B20;
        --line: #29292F;
        --line-strong: #3B3B42;
        --ink: #F3F2EE;
        --ink-dim: #99968F;
        --ink-faint: #5C5A55;
        --amber: #FFB020;
        --amber-ink: #1A1200;
        --red: #FF5449;
        --red-dim: #402019;
        --green: #34D399;
        --green-dim: #143327;
        --focus: #FFB020;

        --font-display: 'Big Shoulders Display', 'Arial Narrow', sans-serif;
        --font-body: 'Public Sans', system-ui, sans-serif;
        --font-mono: 'JetBrains Mono', 'SFMono-Regular', Menlo, monospace;

        box-sizing: border-box;
        background: var(--void);
        color: var(--ink);
        font-family: var(--font-body);
        min-height: 100vh;
        position: relative;
        -webkit-font-smoothing: antialiased;
      }
      .cd-root *, .cd-root *::before, .cd-root *::after { box-sizing: inherit; }
      .cd-root::before {
        content: "";
        position: fixed; inset: 0; pointer-events: none; z-index: 0;
        background-image: repeating-linear-gradient(0deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 3px);
        mix-blend-mode: overlay;
      }
      .cd-shell {
        position: relative; z-index: 1;
        max-width: 520px; margin: 0 auto;
        padding: 28px 20px 56px;
      }
      @media (min-width: 720px) {
        .cd-shell { max-width: 720px; padding: 44px 32px 64px; }
      }
      @media (min-width: 1120px) {
        .cd-shell { max-width: 1180px; padding: 56px 48px 80px; }
      }

      .cd-root h1, .cd-root h2, .cd-root h3 { margin: 0; font-family: var(--font-display); font-weight: 800; letter-spacing: -0.01em; }
      .cd-root p { margin: 0; }
      .cd-root button { font-family: inherit; }
      .cd-root :focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }

      /* ---------- toolbar ---------- */
      .cd-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
      .cd-icon-btn {
        width: 40px; height: 40px; border-radius: 3px;
        border: 1px solid var(--line-strong); background: var(--panel); color: var(--ink-dim);
        display: flex; align-items: center; justify-content: center; cursor: pointer;
        transition: border-color 0.12s ease, color 0.12s ease;
      }
      .cd-icon-btn:hover { border-color: var(--amber); color: var(--amber); }

      /* ---------- kicker / eyebrow ---------- */
      .cd-kicker {
        display: inline-flex; align-items: center; gap: 8px;
        font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.16em;
        text-transform: uppercase; color: var(--amber);
      }
      .cd-kicker::after {
        content: "_"; animation: cd-blink 1.1s steps(1) infinite; color: var(--amber);
      }
      @keyframes cd-blink { 50% { opacity: 0; } }

      .cd-title {
        font-size: 44px; line-height: 0.98; margin-top: 10px;
        text-transform: uppercase;
      }
      @media (min-width: 720px) { .cd-title { font-size: 60px; } }
      .cd-subtitle { color: var(--ink-dim); font-size: 15px; margin-top: 14px; line-height: 1.6; max-width: 46ch; }

      /* ---------- layout: intro / category ---------- */
      .cd-intro-grid { margin-top: 32px; display: flex; flex-direction: column; gap: 16px; }
      @media (min-width: 1120px) {
        .cd-intro-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }
      }

      /* ---------- panels ---------- */
      .cd-panel {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 4px;
        padding: 22px;
      }
      .cd-panel-head {
        display: flex; align-items: center; gap: 10px;
        font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.12em;
        text-transform: uppercase; color: var(--ink-faint); margin-bottom: 16px;
      }
      .cd-panel-head svg { color: var(--amber); }

      .cd-field { margin-top: 16px; }
      .cd-field:first-child { margin-top: 0; }
      .cd-field label {
        display: block; font-family: var(--font-mono); font-size: 10.5px;
        text-transform: uppercase; letter-spacing: 0.1em; color: var(--ink-faint);
        margin-bottom: 8px;
      }
      .cd-field input {
        width: 100%; min-height: 50px;
        background: var(--void); border: 1px solid var(--line-strong); border-radius: 3px;
        padding: 12px 14px; color: var(--ink);
        font-family: var(--font-body); font-size: 16px; font-weight: 500;
        transition: border-color 0.12s ease;
      }
      .cd-field input:hover { border-color: var(--ink-faint); }
      .cd-field input:focus { outline: none; border-color: var(--amber); }

      /* ---------- how-to list ---------- */
      .cd-how-list { display: flex; flex-direction: column; gap: 16px; }
      .cd-how-item { display: flex; gap: 14px; align-items: flex-start; }
      .cd-how-item .cd-num {
        flex: none; width: 26px; height: 26px; border-radius: 2px;
        background: var(--panel-2); border: 1px solid var(--line-strong);
        color: var(--amber); display: flex; align-items: center; justify-content: center;
        font-family: var(--font-mono); font-size: 12px; font-weight: 700;
      }
      .cd-how-item p { color: var(--ink-dim); font-size: 14px; line-height: 1.55; }

      /* ---------- buttons ---------- */
      .cd-btn {
        display: inline-flex; align-items: center; justify-content: center; gap: 9px;
        width: 100%; min-height: 54px;
        padding: 14px 20px;
        border: 1px solid transparent; border-radius: 3px;
        font-family: var(--font-display); font-weight: 700; font-size: 16px;
        letter-spacing: 0.01em; text-transform: uppercase;
        cursor: pointer;
        transition: background 0.12s ease, border-color 0.12s ease, transform 0.05s ease, opacity 0.12s ease;
      }
      .cd-btn:active:not(:disabled) { transform: translateY(1px); }
      .cd-btn-primary { background: var(--amber); color: var(--amber-ink); }
      .cd-btn-primary:hover:not(:disabled) { background: #FFC24D; }
      .cd-btn-secondary { background: transparent; color: var(--ink); border-color: var(--line-strong); }
      .cd-btn-secondary:hover:not(:disabled) { border-color: var(--amber); color: var(--amber); }
      .cd-btn-ghost { background: transparent; color: var(--ink-dim); border-color: var(--line); }
      .cd-btn-ghost:hover:not(:disabled) { color: var(--ink); border-color: var(--line-strong); }
      .cd-btn-danger { background: var(--red); color: #fff; }
      .cd-btn-danger:hover:not(:disabled) { background: #FF6E63; }
      .cd-btn:disabled { opacity: 0.32; cursor: not-allowed; }

      .cd-stack { display: flex; flex-direction: column; gap: 10px; margin-top: 20px; }

      /* ---------- turn banner ---------- */
      .cd-turn-banner {
        display: flex; align-items: center; gap: 14px;
        background: var(--panel); border: 1px solid var(--line-strong); border-left: 3px solid var(--amber);
        border-radius: 3px; padding: 16px 18px;
      }
      .cd-turn-avatar {
        flex: none; width: 44px; height: 44px; border-radius: 2px;
        background: var(--amber); color: var(--amber-ink);
        display: flex; align-items: center; justify-content: center;
        font-family: var(--font-display); font-weight: 800; font-size: 18px;
      }
      .cd-turn-name { font-family: var(--font-display); font-weight: 700; font-size: 19px; text-transform: uppercase; }
      .cd-turn-hint { color: var(--ink-faint); font-size: 12.5px; margin-top: 4px; line-height: 1.4; font-family: var(--font-mono); }

      /* ---------- hold to peek ---------- */
      .cd-hold-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 14px; }
      .cd-hold-btn {
        min-height: 56px; border: 1px dashed var(--line-strong); border-radius: 3px;
        background: var(--panel-2); color: var(--ink-faint);
        display: flex; align-items: center; justify-content: center; gap: 7px; text-align: center;
        font-family: var(--font-mono); font-size: 11px; padding: 8px; line-height: 1.3;
        user-select: none; touch-action: manipulation; transition: background 0.1s ease, color 0.1s ease;
      }
      .cd-hold-btn:hover { border-color: var(--ink-faint); color: var(--ink-dim); }
      .cd-hold-btn.is-revealing { background: var(--amber); border-color: var(--amber); color: var(--amber-ink); }
      .cd-hold-reveal { display: none; align-items: center; gap: 6px; font-family: var(--font-display); font-weight: 700; font-size: 14px; }
      .cd-hold-btn.is-revealing .cd-hold-reveal { display: inline-flex; }
      .cd-hold-btn.is-revealing .cd-hold-label { display: none; }

      /* ---------- mode toggle (also reused for the game-mode selector) ---------- */
      .cd-mode-toggle { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 16px; }
      .cd-mode-toggle:first-child { margin-top: 0; }
      .cd-mode-btn {
        min-height: 52px; border: 1px solid var(--line-strong); border-radius: 3px;
        background: var(--panel); color: var(--ink-dim);
        font-family: var(--font-display); font-weight: 700; font-size: 14px; text-transform: uppercase;
        display: inline-flex; align-items: center; justify-content: center; gap: 8px;
        cursor: pointer; transition: all 0.12s ease;
      }
      .cd-mode-btn:hover:not(:disabled):not(.is-active) { border-color: var(--ink-faint); color: var(--ink); }
      .cd-mode-btn.is-active.eliminate { background: var(--ink); color: var(--void); border-color: var(--ink); }
      .cd-mode-btn.is-active.guess { background: var(--red); color: #fff; border-color: var(--red); }
      .cd-mode-btn:disabled { opacity: 0.32; cursor: not-allowed; }

      /* ---------- board ---------- */
      .cd-play-layout { margin-top: 20px; display: flex; flex-direction: column; gap: 20px; }
      @media (min-width: 1120px) {
        .cd-play-layout { display: grid; grid-template-columns: 320px 1fr; gap: 32px; align-items: start; }
        .cd-play-sidebar { position: sticky; top: 32px; display: flex; flex-direction: column; gap: 14px; }
      }
      .cd-board {
        display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;
      }
      @media (min-width: 640px) { .cd-board { grid-template-columns: repeat(3, 1fr); } }
      @media (min-width: 1120px) { .cd-board { grid-template-columns: repeat(4, 1fr); gap: 12px; } }

      .cd-card {
        position: relative;
        border: 1px solid var(--line-strong); border-radius: 3px;
        background: var(--panel);
        padding: 14px 12px 12px;
        min-height: 108px;
        text-align: left; cursor: pointer;
        display: flex; flex-direction: column; justify-content: space-between;
        transition: border-color 0.12s ease, background 0.12s ease, transform 0.06s ease;
      }
      .cd-card:hover:not(.is-locked):not(.is-eliminated) { border-color: var(--amber); }
      .cd-card:active:not(.is-locked) { transform: scale(0.98); }
      .cd-card-top { display: flex; align-items: center; justify-content: space-between; }
      .cd-card-top svg { color: var(--ink-faint); }
      .cd-card-tag {
        font-family: var(--font-mono); font-size: 9.5px; color: var(--ink-faint);
        border: 1px solid var(--line); border-radius: 2px; padding: 1px 5px;
      }
      .cd-card-name { font-family: var(--font-body); font-weight: 700; font-size: 13.5px; line-height: 1.25; margin-top: 12px; }

      .cd-card.is-selected { border-color: var(--amber); background: rgba(255,176,32,0.08); }
      .cd-card.is-selected .cd-card-top svg { color: var(--amber); }
      .cd-card.is-guess-mode { border-color: var(--red); }

      .cd-card.is-eliminated { background: var(--void); }
      .cd-card.is-eliminated .cd-card-top svg { color: var(--ink-faint); }
      .cd-card.is-eliminated .cd-card-name { font-family: var(--font-mono); font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--ink-faint); }
      .cd-card.is-eliminated.is-fresh { border-color: var(--red); }
      .cd-card.is-eliminated.is-fresh .cd-card-name { color: var(--red); }
      .cd-card.is-eliminated.is-locked { cursor: default; opacity: 0.5; }
      .cd-card.is-eliminated.is-close-wrong { border-color: var(--amber); opacity: 0.85; background: rgba(255,176,32,0.06); }
      .cd-card.is-eliminated.is-close-wrong .cd-card-name { color: var(--amber); }
      .cd-card.is-eliminated.is-far-wrong { opacity: 0.4; }

      /* ---------- helper ---------- */
      .cd-helper { margin-top: 16px; border: 1px solid var(--line); border-radius: 3px; background: var(--panel); overflow: hidden; }
      .cd-helper summary {
        padding: 14px 16px; min-height: 50px; list-style: none; cursor: pointer;
        display: flex; align-items: center; gap: 9px;
        font-family: var(--font-mono); font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-dim);
      }
      .cd-helper summary::-webkit-details-marker { display: none; }
      .cd-helper summary svg { color: var(--amber); }
      .cd-helper-body { padding: 0 16px 16px; color: var(--ink-dim); font-size: 13.5px; line-height: 1.7; }
      .cd-helper-body ul { margin: 4px 0 0; padding-left: 18px; }
      .cd-helper-body li { margin-bottom: 7px; }

      /* ---------- clue list (solo) ---------- */
      .cd-clue-list { display: flex; flex-direction: column; gap: 12px; }
      .cd-clue-item { display: flex; gap: 12px; align-items: flex-start; font-size: 14.5px; color: var(--ink); line-height: 1.5; }
      .cd-clue-item:not(:last-child) { color: var(--ink-dim); }
      .cd-clue-num {
        flex: none; width: 24px; height: 24px; border-radius: 2px;
        background: var(--panel-2); border: 1px solid var(--line-strong);
        color: var(--amber); display: flex; align-items: center; justify-content: center;
        font-family: var(--font-mono); font-size: 11px; font-weight: 700;
      }

      /* ---------- status / score ---------- */
      .cd-status-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-top: 16px; flex-wrap: wrap; }
      .cd-chip {
        font-family: var(--font-mono); font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.06em;
        color: var(--ink-dim); background: var(--panel-2); border: 1px solid var(--line); border-radius: 999px; padding: 5px 11px;
      }
      .cd-score {
        display: flex; align-items: center; justify-content: center; gap: 12px;
        background: var(--panel); border: 1px solid var(--line-strong); border-radius: 3px;
        padding: 12px 18px; margin-top: 16px;
      }
      .cd-score-name { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-faint); }
      .cd-score-num { font-family: var(--font-display); font-weight: 800; font-size: 22px; color: var(--amber); }
      .cd-score-sep { color: var(--ink-faint); }

      /* ---------- notices (error state) ---------- */
      .cd-notice {
        display: flex; align-items: flex-start; gap: 10px;
        background: var(--red-dim); border: 1px solid var(--red); color: var(--ink);
        border-radius: 3px; padding: 14px 16px; margin-bottom: 16px;
      }
      .cd-notice svg { color: var(--red); flex: none; margin-top: 1px; }
      .cd-notice-title { font-family: var(--font-display); font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.02em; }
      .cd-notice-body { font-size: 13px; color: var(--ink-dim); margin-top: 3px; line-height: 1.4; }

      /* ---------- modal ---------- */
      .cd-modal-backdrop {
        position: fixed; inset: 0; background: rgba(10,10,12,0.82);
        display: flex; align-items: flex-end; justify-content: center; z-index: 30;
        padding: 0 16px 24px; animation: cd-fade 0.14s ease-out;
      }
      @media (min-width: 720px) { .cd-modal-backdrop { align-items: center; } }
      @keyframes cd-fade { from { opacity: 0; } to { opacity: 1; } }
      .cd-modal {
        width: 100%; max-width: 440px; background: var(--panel);
        border: 1px solid var(--line-strong); border-top: 3px solid var(--amber);
        border-radius: 4px; padding: 24px;
        animation: cd-slide 0.16s ease-out;
      }
      @keyframes cd-slide { from { transform: translateY(16px); opacity: 0.6; } to { transform: translateY(0); opacity: 1; } }
      .cd-modal-title { font-family: var(--font-mono); font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--ink-faint); }
      .cd-modal-target {
        margin-top: 12px; display: flex; align-items: center; gap: 12px;
        background: var(--void); border: 1px solid var(--line-strong); border-radius: 3px; padding: 16px;
      }
      .cd-modal-target svg { color: var(--amber); }
      .cd-modal-target span { font-family: var(--font-display); font-weight: 800; font-size: 19px; text-transform: uppercase; }
      .cd-modal-sub { color: var(--ink-dim); font-size: 13px; margin-top: 12px; line-height: 1.5; }
      .cd-modal-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 20px; }

      /* ---------- win (success / default-win states) ---------- */
      .cd-win-banner {
        text-align: center; padding: 40px 24px; border-radius: 4px;
        border: 1px solid var(--line-strong); position: relative; overflow: hidden;
      }
      .cd-win-banner.is-success { background: var(--green-dim); border-color: var(--green); }
      .cd-win-banner.is-default { background: var(--panel); border-color: var(--amber); }
      .cd-win-icon-wrap {
        width: 64px; height: 64px; border-radius: 50%; margin: 0 auto;
        display: flex; align-items: center; justify-content: center;
        animation: cd-pop 0.4s cubic-bezier(.2,1.6,.4,1);
      }
      .is-success .cd-win-icon-wrap { background: rgba(52,211,153,0.15); color: var(--green); }
      .is-default .cd-win-icon-wrap { background: rgba(255,176,32,0.15); color: var(--amber); }
      @keyframes cd-pop { 0% { transform: scale(0); } 65% { transform: scale(1.15); } 100% { transform: scale(1); } }
      .cd-win-title { font-size: 30px; margin-top: 18px; text-transform: uppercase; }
      .cd-win-sub { color: var(--ink-dim); font-size: 14px; margin-top: 10px; line-height: 1.55; max-width: 40ch; margin-left: auto; margin-right: auto; }

      .cd-win-secret {
        margin-top: 14px; display: flex; align-items: center; gap: 12px;
        background: var(--panel); border: 1px solid var(--line-strong); border-radius: 3px;
        padding: 14px 16px; text-align: left;
      }
      .cd-win-secret svg { color: var(--ink-faint); flex: none; }
      .cd-win-secret-label { font-family: var(--font-mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-faint); }
      .cd-win-secret-name { font-family: var(--font-display); font-weight: 700; font-size: 16px; text-transform: uppercase; }

      /* ---------- loading state ---------- */
      .cd-loading { margin: 10vh auto; text-align: center; max-width: 360px; }
      .cd-spinner { color: var(--amber); animation: cd-spin 0.9s linear infinite; }
      @keyframes cd-spin { to { transform: rotate(360deg); } }
      .cd-loading-title { font-size: 22px; margin-top: 18px; text-transform: uppercase; }
      .cd-loading-line { font-family: var(--font-mono); font-size: 12.5px; color: var(--ink-faint); margin-top: 12px; line-height: 1.6; }

      /* ---------- empty state ---------- */
      .cd-empty {
        border: 1px dashed var(--line-strong); border-radius: 4px; background: var(--panel);
        padding: 22px; display: flex; align-items: center; gap: 14px;
      }
      .cd-empty svg { color: var(--ink-faint); flex: none; }
      .cd-empty.is-filled { border-style: solid; border-color: var(--amber); background: rgba(255,176,32,0.06); }
      .cd-empty.is-filled svg { color: var(--amber); }
      .cd-empty-title { font-family: var(--font-mono); font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-faint); }
      .cd-empty.is-filled .cd-empty-title { color: var(--amber); }
      .cd-empty-body { font-size: 13.5px; color: var(--ink-dim); margin-top: 4px; line-height: 1.5; }

      /* ---------- stats ---------- */
      .cd-stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px 12px; }
      @media (min-width: 520px) { .cd-stats-grid { grid-template-columns: repeat(4, 1fr); } }
      .cd-stat { text-align: center; }
      .cd-stat-num { font-family: var(--font-display); font-weight: 800; font-size: 22px; }
      .cd-stat-label { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-faint); margin-top: 4px; }

      .cd-footer { text-align: center; color: var(--ink-faint); font-family: var(--font-mono); font-size: 11px; margin-top: 32px; line-height: 1.6; }
    `}</style>
  );
}

/* =========================================================================
   SMALL PIECES
   ========================================================================= */

function ScoreChip({ state }) {
  return (
    <div className="cd-score">
      <span className="cd-score-name">{state.names.p1}</span>
      <span className="cd-score-num">{state.score.p1}</span>
      <span className="cd-score-sep">/</span>
      <span className="cd-score-num">{state.score.p2}</span>
      <span className="cd-score-name">{state.names.p2}</span>
    </div>
  );
}

function HoldButton({ label, item }) {
  const ref = useRef(null);
  const show = (e) => { e.preventDefault(); ref.current && ref.current.classList.add("is-revealing"); };
  const hide = () => { ref.current && ref.current.classList.remove("is-revealing"); };
  return (
    <div
      ref={ref}
      className="cd-hold-btn"
      onPointerDown={show}
      onPointerUp={hide}
      onPointerLeave={hide}
      onPointerCancel={hide}
    >
      <span className="cd-hold-label" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <Eye size={14} strokeWidth={1.75} /> HOLD: {label}'S SECRET
      </span>
      <span className="cd-hold-reveal">
        {item ? item.name : ""}
      </span>
    </div>
  );
}

function StatsPanel({ stats, onReset }) {
  const hasGames = stats.gamesPlayed > 0;
  const topCategory = Object.entries(stats.categoryCounts).sort((a, b) => b[1] - a[1])[0];
  const soloTotal = stats.soloWins + stats.soloLosses;

  return (
    <div className="cd-panel" style={{ marginTop: 16 }}>
      <div className="cd-panel-head"><History size={14} /> CASE LOG</div>
      {!hasGames ? (
        <div className="cd-empty">
          <History size={22} strokeWidth={1.75} />
          <div>
            <div className="cd-empty-title">NO CASES LOGGED YET</div>
            <div className="cd-empty-body">Finish a game and your record shows up here.</div>
          </div>
        </div>
      ) : (
        <>
          <div className="cd-stats-grid">
            <div className="cd-stat">
              <div className="cd-stat-num">{stats.gamesPlayed}</div>
              <div className="cd-stat-label">GAMES LOGGED</div>
            </div>
            <div className="cd-stat">
              <div className="cd-stat-num">{soloTotal > 0 ? `${stats.soloWins}-${stats.soloLosses}` : "—"}</div>
              <div className="cd-stat-label">SOLO RECORD</div>
            </div>
            <div className="cd-stat">
              <div
                className="cd-stat-num"
                style={{ color: stats.soloStreak > 0 ? "var(--green)" : stats.soloStreak < 0 ? "var(--red)" : "var(--ink)" }}
              >
                {stats.soloStreak > 0 ? `+${stats.soloStreak}` : stats.soloStreak || "—"}
              </div>
              <div className="cd-stat-label">CURRENT STREAK</div>
            </div>
            <div className="cd-stat">
              <div className="cd-stat-num" style={{ fontSize: 14, lineHeight: 1.3 }}>{topCategory ? topCategory[0] : "—"}</div>
              <div className="cd-stat-label">TOP CASE FILE</div>
            </div>
          </div>
          <button
            className="cd-btn cd-btn-ghost"
            style={{ marginTop: 18 }}
            onClick={() => { Sound.click(); onReset(); }}
          >
            <Trash2 size={15} strokeWidth={1.75} /> Reset Stats
          </button>
        </>
      )}
    </div>
  );
}

/* =========================================================================
   SCREENS — shared (intro / category / dealing)
   ========================================================================= */

function IntroScreen({ state, dispatch, stats, onResetStats }) {
  const solo = state.gameMode === "solo";
  const daily = state.gameMode === "daily";
  const duel = !solo && !daily;

  return (
    <div>
      <div className="cd-kicker"><Search size={14} strokeWidth={2} /> SESSION 01 // NEW CASE</div>
      <h1 className="cd-title">Category<br />Detectives</h1>
      <p className="cd-subtitle">
        A deduction terminal. Agree on a category, get dealt a secret item
        from it at random, and out-question your opponent to name theirs
        first — crack a solo puzzle against the clock — or run today's
        three-case Daily Dive.
      </p>

      <div className="cd-intro-grid">
        <div className="cd-panel">
          <div className="cd-panel-head"><Users size={14} /> GAME MODE</div>
          <div className="cd-mode-toggle" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
            <button
              className={"cd-mode-btn eliminate" + (duel ? " is-active" : "")}
              aria-pressed={duel}
              onClick={() => { Sound.click(); dispatch({ type: "SET_GAME_MODE", value: "duel" }); }}
            >
              <Users size={15} strokeWidth={2} /> Pass &amp; Play
            </button>
            <button
              className={"cd-mode-btn eliminate" + (solo ? " is-active" : "")}
              aria-pressed={solo}
              onClick={() => { Sound.click(); dispatch({ type: "SET_GAME_MODE", value: "solo" }); }}
            >
              <Puzzle size={15} strokeWidth={2} /> Puzzle
            </button>
            <button
              className={"cd-mode-btn eliminate" + (daily ? " is-active" : "")}
              aria-pressed={daily}
              onClick={() => { Sound.click(); dispatch({ type: "SET_GAME_MODE", value: "daily" }); }}
            >
              <Calendar size={15} strokeWidth={2} /> Daily
            </button>
          </div>

          {solo && (
            <p className="cd-subtitle" style={{ marginTop: 14, fontSize: 12.5 }}>
              {MAX_ROUNDS} guesses. Every clue is a real fact — origin, temperament, appearance, then a
              signature fun fact. Wrong guesses tell you if you were close.
            </p>
          )}
          {daily && (
            <p className="cd-subtitle" style={{ marginTop: 14, fontSize: 12.5 }}>
              Three cases, one shot per day. Buy clues or guess early — bank whatever
              credibility's left when you crack it. Same cases for everyone, every day.
            </p>
          )}

          {duel && (
            <div className="cd-field">
              <label>Player 1</label>
              <input
                type="text" maxLength={18} placeholder="Player 1"
                value={state.names.p1}
                onChange={(e) => dispatch({ type: "SET_NAME", player: "p1", value: e.target.value.trim() || "Player 1" })}
              />
            </div>
          )}
          {solo && (
            <div className="cd-field">
              <label>Your Name</label>
              <input
                type="text" maxLength={18} placeholder="Player 1"
                value={state.names.p1}
                onChange={(e) => dispatch({ type: "SET_NAME", player: "p1", value: e.target.value.trim() || "Player 1" })}
              />
            </div>
          )}
          {duel && (
            <div className="cd-field">
              <label>Player 2</label>
              <input
                type="text" maxLength={18} placeholder="Player 2"
                value={state.names.p2}
                onChange={(e) => dispatch({ type: "SET_NAME", player: "p2", value: e.target.value.trim() || "Player 2" })}
              />
            </div>
          )}
        </div>

        <div className="cd-panel">
          <div className="cd-panel-head"><Lightbulb size={14} /> BRIEFING</div>
          <div className="cd-how-list">
            {(daily
              ? [
                  "Three cases a day, seeded so every player gets the same ones.",
                  "Each case starts at 100 credibility with one free clue.",
                  "Buy more clues or guess early — wrong guesses cost more than clues do.",
                  "Bank whatever credibility's left when you name the right answer."
                ]
              : solo
              ? [
                  "Pick from 4 categories — we'll choose a secret item from it.",
                  "Each round reveals a new fun fact about the secret.",
                  "Guess an item from the board — wrong guesses show if you were close.",
                  `Solve it within ${MAX_ROUNDS} guesses.`
                ]
              : [
                  "Together, agree on one shared category from the list.",
                  "Each player is randomly dealt one secret item — you don't choose it.",
                  "Both players see the same board of every item in the category.",
                  "Ask yes/no questions, eliminate wrong answers, then guess."
                ]
            ).map((t, i) => (
              <div className="cd-how-item" key={i}>
                <div className="cd-num">{i + 1}</div>
                <p>{t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <StatsPanel stats={stats} onReset={onResetStats} />

      <div className="cd-stack">
        <button
          className="cd-btn cd-btn-primary"
          onClick={() => {
            Sound.click();
            dispatch({ type: daily ? "ENTER_DAILY" : "GO_CATEGORY" });
          }}
        >
          {daily ? <Calendar size={18} strokeWidth={2} /> : <LayoutGrid size={18} strokeWidth={2} />}
          {daily ? "Open Today's Cases" : "Open Case File"}
        </button>
      </div>

      <div className="cd-footer">
        {daily
          ? "ONE RUN PER DAY — RESULTS AND SHARE CARD WAIT FOR YOU AFTER CASE 03."
          : solo
          ? "PLAY SOLO, ANYTIME — A FRESH PUZZLE EVERY ROUND."
          : "BEST PLAYED SEATED ACROSS FROM YOUR OPPONENT — PASS THE DEVICE WHEN PROMPTED."}
      </div>
    </div>
  );
}

function CategoryScreen({ state, dispatch }) {
  const selected = state.categoryKey;
  const solo = state.gameMode === "solo";
  const categoryKeys = solo ? SOLO_CATEGORIES : Object.keys(CATEGORY_SETS);
  return (
    <div>
      <div className="cd-kicker"><LayoutGrid size={14} strokeWidth={2} /> STEP 01</div>
      <h1 className="cd-title" style={{ fontSize: 36 }}>Select Category</h1>
      <p className="cd-subtitle">
        {solo ? "Pick any category — we'll choose your secret item for you." : "Decide together out loud — this part isn't secret."}
      </p>

      <div style={{ marginTop: 20 }}>
        {selected ? (
          <div className="cd-empty is-filled">
            <CheckCircle2 size={22} strokeWidth={1.75} />
            <div>
              <div className="cd-empty-title">CASE FILE LOADED</div>
              <div className="cd-empty-body">
                <strong style={{ color: "var(--ink)" }}>{selected}</strong> — {CATEGORY_SETS[selected].items.length} items on the board. Ready to deal.
              </div>
            </div>
          </div>
        ) : (
          <div className="cd-empty">
            <LayoutGrid size={22} strokeWidth={1.75} />
            <div>
              <div className="cd-empty-title">NO CASE FILE SELECTED</div>
              <div className="cd-empty-body">Tap a category below to load it, then deal the cards.</div>
            </div>
          </div>
        )}
      </div>

      <div className="cd-board" style={{ marginTop: 16 }}>
        {categoryKeys.map((key) => {
          const { Icon, items } = CATEGORY_SETS[key];
          const isSel = key === selected;
          return (
            <button
              key={key}
              className={"cd-card" + (isSel ? " is-selected" : "")}
              onClick={() => { Sound.select(); dispatch({ type: "SELECT_CATEGORY", key }); }}
            >
              <div className="cd-card-top">
                <Icon size={20} strokeWidth={1.75} />
                <span className="cd-card-tag">{String(items.length).padStart(2, "0")}</span>
              </div>
              <div className="cd-card-name">{key}</div>
            </button>
          );
        })}
      </div>

      <div className="cd-stack">
        <button
          className="cd-btn cd-btn-primary"
          disabled={!selected}
          onClick={() => { Sound.deal(); dispatch({ type: "DEAL" }); }}
        >
          <Layers size={18} strokeWidth={2} /> Deal Cards
        </button>
      </div>
    </div>
  );
}

function DealingScreen({ state }) {
  const line = DEAL_LINES[state.gamesPlayed % DEAL_LINES.length];
  return (
    <div className="cd-loading">
      <Loader2 size={44} strokeWidth={1.75} className="cd-spinner" />
      <div className="cd-loading-title">Assigning Cases</div>
      <div className="cd-loading-line">{line}<br />CATEGORY: {state.categoryKey}</div>
    </div>
  );
}

/* =========================================================================
   SCREENS — pass & play (duel)
   ========================================================================= */

function HandoffScreen({ state, dispatch, nameOf }) {
  const notice = state.turnNotice;
  return (
    <div className="cd-panel" style={{ marginTop: "12vh", maxWidth: 440, marginLeft: "auto", marginRight: "auto" }}>
      {notice && notice.wrongGuess && (
        <div className="cd-notice">
          <AlertTriangle size={18} strokeWidth={2} />
          <div>
            <div className="cd-notice-title">Incorrect Guess</div>
            <div className="cd-notice-body">{nameOf(notice.guesser)} guessed "{notice.itemName}" — not a match.</div>
          </div>
        </div>
      )}
      <div className="cd-kicker">HANDOFF REQUIRED</div>
      <h2 className="cd-title" style={{ fontSize: 30, marginTop: 8 }}>Pass to {nameOf(state.turn)}</h2>
      <p className="cd-subtitle">
        It's {nameOf(state.turn)}'s turn to question {nameOf(otherPlayer(state.turn))} and narrow the board.
      </p>
      <div className="cd-stack">
        <button className="cd-btn cd-btn-primary" onClick={() => { Sound.click(); dispatch({ type: "ACK_HANDOFF" }); }}>
          {nameOf(state.turn)}, I'm Ready <ArrowRight size={18} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

function PlayScreen({ state, dispatch, nameOf, boardItem }) {
  const turn = state.turn;
  const opponent = otherPlayer(turn);
  const total = state.board.length;
  const elimCount = Object.keys(state.eliminated[turn]).length;

  return (
    <div className="cd-play-layout">
      <div className="cd-play-sidebar">
        <div className="cd-turn-banner">
          <div className="cd-turn-avatar">{nameOf(turn).charAt(0).toUpperCase()}</div>
          <div>
            <div className="cd-turn-name">{nameOf(turn)}'s Turn</div>
            <div className="cd-turn-hint">CASE: {state.categoryKey} — QUESTION {nameOf(opponent).toUpperCase()}, THEN NARROW YOUR BOARD.</div>
          </div>
        </div>

        {state.gamesPlayed > 1 && <ScoreChip state={state} />}

        <div className="cd-hold-row">
          <HoldButton label={nameOf("p1")} item={boardItem(state.secret.p1)} />
          <HoldButton label={nameOf("p2")} item={boardItem(state.secret.p2)} />
        </div>

        <details className="cd-helper">
          <summary><Lightbulb size={14} /> NEED QUESTION IDEAS?</summary>
          <div className="cd-helper-body">
            <ul>
              <li>Does the name start with a letter after M?</li>
              <li>Is the name more than two words long?</li>
              <li>Is it one of the more well-known items in this category?</li>
              <li>Would you rank it in the top half of the list alphabetically?</li>
              <li>Is there a number, color, or place name in it?</li>
            </ul>
          </div>
        </details>

        <div className="cd-mode-toggle">
          <button
            className={"cd-mode-btn eliminate" + (state.mode === "eliminate" ? " is-active" : "")}
            aria-pressed={state.mode === "eliminate"}
            onClick={() => { Sound.click(); dispatch({ type: "SET_MODE", mode: "eliminate" }); }}
          >
            <Scissors size={16} strokeWidth={2} /> Eliminate
          </button>
          <button
            className={"cd-mode-btn guess" + (state.mode === "guess" ? " is-active" : "")}
            aria-pressed={state.mode === "guess"}
            disabled={hasFreshEliminations(state, turn)}
            onClick={() => { Sound.click(); dispatch({ type: "SET_MODE", mode: "guess" }); }}
          >
            <Target size={16} strokeWidth={2} /> Guess
          </button>
        </div>
        {hasFreshEliminations(state, turn) && (
          <p className="cd-subtitle" style={{ marginTop: 4, fontSize: 12.5 }}>
            Guessing is locked after an elimination — finish narrowing or end your turn.
          </p>
        )}

        <div className="cd-status-row">
          <span className="cd-chip">{elimCount} / {total} RULED OUT</span>
          <span className="cd-chip">ROUND {state.rounds + 1}</span>
        </div>

        <button
          className="cd-btn cd-btn-secondary"
          style={{ marginTop: 14 }}
          onClick={() => { Sound.click(); dispatch({ type: "END_TURN" }); }}
        >
          End {nameOf(turn)}'s Turn <ArrowRight size={16} strokeWidth={2} />
        </button>
      </div>

      <div>
        <div className="cd-board">
          {state.board.map((cat) => {
            const isElim = !!state.eliminated[turn][cat.id];
            const isLocked = !!state.locked[turn][cat.id];
            const cls = [
              "cd-card",
              isElim && "is-eliminated",
              isElim && !isLocked && "is-fresh",
              isLocked && "is-locked",
              state.mode === "guess" && "is-guess-mode"
            ].filter(Boolean).join(" ");
            return (
              <button
                key={cat.id}
                className={cls}
                onClick={() => {
                  if (state.mode === "eliminate") {
                    if (!isLocked) Sound[isElim ? "undo" : "eliminate"]();
                    dispatch({ type: "TOGGLE_ELIMINATE", id: cat.id });
                  } else {
                    if (!isElim) Sound.openGuess();
                    dispatch({ type: "OPEN_GUESS", id: cat.id });
                  }
                }}
              >
                <div className="cd-card-top">
                  {isElim ? (isLocked ? <Lock size={16} strokeWidth={1.75} /> : <EyeOff size={16} strokeWidth={1.75} />) : <span className="cd-card-tag">{String(cat.id + 1).padStart(2, "0")}</span>}
                </div>
                <div className="cd-card-name">{isElim ? (isLocked ? "Cleared" : "Cleared · undo") : cat.name}</div>
              </button>
            );
          })}
        </div>
      </div>

      {state.modalGuess !== null && (
        <GuessModal state={state} dispatch={dispatch} nameOf={nameOf} boardItem={boardItem} opponent={opponent} />
      )}
    </div>
  );
}

function GuessModal({ state, dispatch, nameOf, boardItem, opponent }) {
  const item = boardItem(state.modalGuess);
  return (
    <div className="cd-modal-backdrop">
      <div className="cd-modal">
        <div className="cd-modal-title">CONFIRM GUESS</div>
        <div className="cd-modal-target">
          <Target size={22} strokeWidth={1.75} />
          <span>{item ? item.name : ""}</span>
        </div>
        <p className="cd-modal-sub">Locking this in as {nameOf(opponent)}'s secret item. This ends your turn either way.</p>
        <div className="cd-modal-actions">
          <button className="cd-btn cd-btn-ghost" onClick={() => { Sound.click(); dispatch({ type: "CANCEL_GUESS" }); }}>
            <X size={16} strokeWidth={2} /> Keep Thinking
          </button>
          <button className="cd-btn cd-btn-danger" onClick={() => { Sound.click(); dispatch({ type: "CONFIRM_GUESS" }); }}>
            Lock It In
          </button>
        </div>
      </div>
    </div>
  );
}

function DuelWinScreen({ state, dispatch, nameOf, boardItem }) {
  const winner = state.winner;
  const loser = otherPlayer(winner);
  const isSuccess = state.winReason === "correct_guess";

  return (
    <div>
      <div className={"cd-win-banner" + (isSuccess ? " is-success" : " is-default")}>
        <div className="cd-win-icon-wrap">
          {isSuccess ? <CheckCircle2 size={30} strokeWidth={1.75} /> : <Award size={30} strokeWidth={1.75} />}
        </div>
        <h1 className="cd-win-title">{nameOf(winner)} {isSuccess ? "Cracked It" : "Wins by Default"}</h1>
        <p className="cd-win-sub">
          {isSuccess
            ? `Correctly identified ${nameOf(loser)}'s secret item from ${state.categoryKey} after ${state.rounds + 1} round${state.rounds === 0 ? "" : "s"} of questioning.`
            : `${nameOf(loser)} ruled out every other item and guessed wrong on the last one, so ${nameOf(winner)} takes the case.`}
        </p>
      </div>

      <ScoreChip state={state} />

      {[winner, loser].map((p) => {
        const item = boardItem(state.secret[p]);
        return (
          <div className="cd-win-secret" key={p}>
            <Lock size={18} strokeWidth={1.75} />
            <div>
              <div className="cd-win-secret-label">{nameOf(p)}'S SECRET WAS</div>
              <div className="cd-win-secret-name">{item ? item.name : ""}</div>
            </div>
          </div>
        );
      })}

      <div className="cd-stack">
        <button className="cd-btn cd-btn-primary" onClick={() => { Sound.click(); dispatch({ type: "REMATCH_SAME_CATEGORY" }); }}>
          <RefreshCw size={18} strokeWidth={2} /> Rematch — Same Category
        </button>
        <button className="cd-btn cd-btn-secondary" onClick={() => { Sound.click(); dispatch({ type: "NEW_CATEGORY" }); }}>
          New Category, Same Players <ArrowRight size={18} strokeWidth={2} />
        </button>
        <button className="cd-btn cd-btn-ghost" onClick={() => { Sound.click(); dispatch({ type: "BACK_TO_START" }); }}>
          Back to Start
        </button>
      </div>
    </div>
  );
}

/* =========================================================================
   SCREENS — solo puzzle
   ========================================================================= */

function SoloPlayScreen({ state, dispatch, boardItem }) {
  const cluesShown = state.soloClues.slice(0, state.soloRound + 1);
  const roundsLeft = state.soloMaxRounds - state.soloRound;

  return (
    <div>
      <div className="cd-kicker"><Puzzle size={14} strokeWidth={2} /> CASE: {state.categoryKey}</div>
      <h1 className="cd-title" style={{ fontSize: 36 }}>Crack The Case</h1>

      <div className="cd-panel" style={{ marginTop: 20 }}>
        <div className="cd-panel-head"><Lightbulb size={14} /> CLUES REVEALED</div>
        <div className="cd-clue-list">
          {cluesShown.map((c, i) => (
            <div className="cd-clue-item" key={i}>
              <span className="cd-clue-num">{i + 1}</span>
              <span>{c}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="cd-status-row">
        <span className="cd-chip">{roundsLeft} GUESS{roundsLeft === 1 ? "" : "ES"} LEFT</span>
        <span className="cd-chip">{Object.keys(state.soloWrongGuesses).length} RULED OUT</span>
      </div>

      <div className="cd-board" style={{ marginTop: 16 }}>
        {state.board.map((item) => {
          const wrongInfo = state.soloWrongGuesses[item.id];
          const isWrong = !!wrongInfo;
          const cardCls = "cd-card" + (isWrong ? " is-eliminated is-locked " + (wrongInfo.isClose ? "is-close-wrong" : "is-far-wrong") : "");
          return (
            <button
              key={item.id}
              className={cardCls}
              disabled={isWrong}
              onClick={() => {
                if (isWrong) return;
                Sound.openGuess();
                dispatch({ type: "SOLO_OPEN_GUESS", id: item.id });
              }}
            >
              <div className="cd-card-top">
                {isWrong
                  ? <span className="cd-card-tag" style={isWrong && wrongInfo.isClose ? { color: "var(--amber)", borderColor: "var(--amber)" } : undefined}>{wrongInfo.isClose ? "CLOSE" : "FAR"}</span>
                  : <span className="cd-card-tag">{String(item.id + 1).padStart(2, "0")}</span>}
              </div>
              <div className="cd-card-name">{item.name}</div>
            </button>
          );
        })}
      </div>

      {state.soloModalGuess !== null && (
        <SoloGuessModal state={state} dispatch={dispatch} boardItem={boardItem} />
      )}
    </div>
  );
}

function SoloGuessModal({ state, dispatch, boardItem }) {
  const item = boardItem(state.soloModalGuess);
  return (
    <div className="cd-modal-backdrop">
      <div className="cd-modal">
        <div className="cd-modal-title">LOCK IN YOUR GUESS</div>
        <div className="cd-modal-target">
          <Target size={22} strokeWidth={1.75} />
          <span>{item ? item.name : ""}</span>
        </div>
        <p className="cd-modal-sub">If this isn't the answer, it's ruled out and the next clue reveals.</p>
        <div className="cd-modal-actions">
          <button className="cd-btn cd-btn-ghost" onClick={() => { Sound.click(); dispatch({ type: "SOLO_CANCEL_GUESS" }); }}>
            <X size={16} strokeWidth={2} /> Keep Thinking
          </button>
          <button className="cd-btn cd-btn-danger" onClick={() => { Sound.click(); dispatch({ type: "SOLO_CONFIRM_GUESS" }); }}>
            Lock It In
          </button>
        </div>
      </div>
    </div>
  );
}

function SoloWinScreen({ state, dispatch, boardItem, stats }) {
  const isWin = state.winReason === "solo_win";
  const secretItem = boardItem(state.soloSecretId);
  const guessesUsed = state.soloRound + (isWin ? 1 : 0);

  return (
    <div>
      <div className={"cd-win-banner" + (isWin ? " is-success" : " is-default")}>
        <div className="cd-win-icon-wrap">
          {isWin ? <CheckCircle2 size={30} strokeWidth={1.75} /> : <Award size={30} strokeWidth={1.75} />}
        </div>
        <h1 className="cd-win-title">{isWin ? "Case Solved" : "Case Closed"}</h1>
        <p className="cd-win-sub">
          {isWin
            ? `Solved it in ${guessesUsed} of ${state.soloMaxRounds} guess${state.soloMaxRounds === 1 ? "" : "es"}.`
            : "Out of guesses. Better luck on the next case."}
        </p>
      </div>

      <div className="cd-win-secret">
        <Lock size={18} strokeWidth={1.75} />
        <div>
          <div className="cd-win-secret-label">THE ANSWER WAS</div>
          <div className="cd-win-secret-name">{secretItem ? secretItem.name : ""}</div>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 12 }}>
        <span className="cd-chip">SOLO RECORD: {stats.soloWins}-{stats.soloLosses}</span>
      </div>

      <div className="cd-stack">
        <button className="cd-btn cd-btn-primary" onClick={() => { Sound.click(); dispatch({ type: "SOLO_REMATCH" }); }}>
          <RefreshCw size={18} strokeWidth={2} /> New Puzzle — Same Category
        </button>
        <button className="cd-btn cd-btn-secondary" onClick={() => { Sound.click(); dispatch({ type: "NEW_CATEGORY" }); }}>
          New Category <ArrowRight size={18} strokeWidth={2} />
        </button>
        <button className="cd-btn cd-btn-ghost" onClick={() => { Sound.click(); dispatch({ type: "BACK_TO_START" }); }}>
          Back to Start
        </button>
      </div>
    </div>
  );
}

function WinScreen(props) {
  if (props.state.gameMode === "solo") return <SoloWinScreen {...props} />;
  return <DuelWinScreen {...props} />;
}

function HomeConfirmModal({ onCancel, onConfirm }) {
  return (
    <div className="cd-modal-backdrop">
      <div className="cd-modal">
        <div className="cd-modal-title">LEAVE THIS GAME?</div>
        <p className="cd-modal-sub" style={{ marginTop: 12 }}>
          Your current progress will be lost and you'll return to the home screen.
        </p>
        <div className="cd-modal-actions">
          <button className="cd-btn cd-btn-ghost" onClick={onCancel}>
            <X size={16} strokeWidth={2} /> Keep Playing
          </button>
          <button className="cd-btn cd-btn-danger" onClick={onConfirm}>
            <Home size={16} strokeWidth={2} /> Leave Game
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   ROOT
   ========================================================================= */

export default function CategoryDetectives() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [stats, setStats] = useState(loadStats);
  const [soundOn, setSoundOn] = useState(loadSoundPref);
  const [confirmHome, setConfirmHome] = useState(false);
  const countedGameRef = useRef(null);
  const prevScreenRef = useRef(state.screen);
  const prevNoticeRef = useRef(null);
  const prevSoloRoundRef = useRef(0);

  useEffect(() => {
    Sound.enabled = soundOn;
    try { localStorage.setItem(SOUND_KEY, soundOn ? "1" : "0"); } catch { /* ignore */ }
  }, [soundOn]);

  useEffect(() => {
    try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch { /* ignore */ }
  }, [stats]);

  // dealing → play/solo-play transition
  useEffect(() => {
    if (state.screen === "dealing") {
      const t = setTimeout(() => dispatch({ type: "FINISH_DEALING" }), 1400);
      return () => clearTimeout(t);
    }
  }, [state.screen, state.gamesPlayed]);

  // reset the per-game "counted" guard whenever we're back at the start screen
  useEffect(() => {
    if (state.screen === "intro") countedGameRef.current = null;
  }, [state.screen]);

  // outcome sounds + stats logging
  useEffect(() => {
    const prevScreen = prevScreenRef.current;

    if (state.screen === "win" && prevScreen !== "win") {
      if (state.gameMode === "solo") {
        Sound[state.winReason === "solo_win" ? "correct" : "lose"]();
      } else {
        Sound[state.winReason === "correct_guess" ? "correct" : "wrong"]();
      }

      if (countedGameRef.current !== state.gamesPlayed) {
        countedGameRef.current = state.gamesPlayed;
        setStats((prev) => {
          const cat = state.categoryKey;
          const next = {
            ...prev,
            gamesPlayed: prev.gamesPlayed + 1,
            categoryCounts: { ...prev.categoryCounts, [cat]: (prev.categoryCounts[cat] || 0) + 1 }
          };
          if (state.gameMode === "solo") {
            const playerWon = state.winReason === "solo_win";
            const streak = playerWon
              ? (prev.soloStreak >= 0 ? prev.soloStreak + 1 : 1)
              : (prev.soloStreak <= 0 ? prev.soloStreak - 1 : -1);
            next.soloWins = prev.soloWins + (playerWon ? 1 : 0);
            next.soloLosses = prev.soloLosses + (playerWon ? 0 : 1);
            next.soloStreak = streak;
            next.soloBestStreak = Math.max(prev.soloBestStreak, streak > 0 ? streak : 0);
          }
          return next;
        });
      }
    }

    prevScreenRef.current = state.screen;
  }, [state.screen, state.winReason, state.gameMode, state.categoryKey, state.gamesPlayed]);

  // wrong-guess buzz for duel handoff notices
  useEffect(() => {
    if (state.turnNotice && state.turnNotice !== prevNoticeRef.current) {
      Sound.wrong();
    }
    prevNoticeRef.current = state.turnNotice;
  }, [state.turnNotice]);

  // wrong-guess buzz for solo mode (only when the game continues, not on the losing guess)
  useEffect(() => {
    if (state.soloRound > prevSoloRoundRef.current && state.screen === "solo-play") {
      Sound.wrong();
    }
    prevSoloRoundRef.current = state.soloRound;
  }, [state.soloRound, state.screen]);

  const nameOf = (p) => state.names[p];
  const boardItem = (id) => state.board.find((b) => b.id === id);
  const resetStats = () => setStats({ ...DEFAULT_STATS, categoryCounts: {} });

  // Daily Run is a fully self-contained app (its own reducer, its own
  // styling namespace) — mount it directly, bypassing the cd-root shell
  // and toolbar entirely, so there's no double-padding or CSS collision.
  // Its own onExit button hands control back to this screen's intro.
  if (state.screen === "daily") {
    return <DailyRun onExit={() => { Sound.click(); dispatch({ type: "BACK_TO_START" }); }} />;
  }

  return (
    <>
      <FontLoader />
      <GlobalStyles />
      <div className="cd-root">
        <div className="cd-shell">
          <div className="cd-toolbar">
            {state.screen !== "intro" ? (
              <button
                className="cd-icon-btn"
                aria-label="Return to home screen"
                onClick={() => {
                  Sound.click();
                  if (MID_GAME_SCREENS.has(state.screen)) setConfirmHome(true);
                  else dispatch({ type: "BACK_TO_START" });
                }}
              >
                <Home size={17} strokeWidth={1.75} />
              </button>
            ) : <span />}
            <button
              className="cd-icon-btn"
              aria-label={soundOn ? "Mute sound" : "Unmute sound"}
              onClick={() => setSoundOn((v) => !v)}
            >
              {soundOn ? <Volume2 size={17} strokeWidth={1.75} /> : <VolumeX size={17} strokeWidth={1.75} />}
            </button>
          </div>
          {state.screen === "intro" && <IntroScreen state={state} dispatch={dispatch} stats={stats} onResetStats={resetStats} />}
          {state.screen === "category" && <CategoryScreen state={state} dispatch={dispatch} />}
          {state.screen === "dealing" && <DealingScreen state={state} />}
          {state.screen === "handoff" && <HandoffScreen state={state} dispatch={dispatch} nameOf={nameOf} />}
          {state.screen === "play" && <PlayScreen state={state} dispatch={dispatch} nameOf={nameOf} boardItem={boardItem} />}
          {state.screen === "solo-play" && <SoloPlayScreen state={state} dispatch={dispatch} boardItem={boardItem} />}
          {state.screen === "win" && <WinScreen state={state} dispatch={dispatch} nameOf={nameOf} boardItem={boardItem} stats={stats} />}
          {confirmHome && (
            <HomeConfirmModal
              onCancel={() => { Sound.click(); setConfirmHome(false); }}
              onConfirm={() => { Sound.click(); setConfirmHome(false); dispatch({ type: "BACK_TO_START" }); }}
            />
          )}
        </div>
      </div>
    </>
  );
}
