import React, { useReducer, useEffect, useRef, useState } from "react";
import {
  Search, Target, Lock, X, RefreshCw, Award, CheckCircle2, Flame,
  Unlock, Share2, Clipboard, TrendingUp, Calendar, ChevronRight, Skull, Home
} from "lucide-react";
import { CATEGORY_SETS, ITEM_FACTS } from "./gameData";

/* =========================================================================
   DAILY RUN — the shareable daily mode.

   Three ideas working together:

   1. CLUE BUDGET. Each case starts with a pool of "credibility." The first
      clue is free; every extra clue costs, and every wrong guess costs more.
      Solve the case and you bank whatever's left. This is the decision
      layer — guess early on thin info for a big bank, or buy certainty and
      settle for less. Two players who both solved a case can land far apart.

   2. LIVE HEAT. A meter that moves on every action while you play: buying a
      clue warms the trail, a CLOSE wrong guess (same group as the answer)
      spikes it, a FAR wrong guess cools it. Gives the run a moment-to-moment
      pulse instead of a static board, and ends as a brag number.

   3. THREE-CASE RUN. A daily is three cases from three different categories,
      with escalating stakes (clues and mistakes cost more as you go). Scores
      spread out across three rounds instead of everyone tying at "2/4".

   The whole daily is seeded off the UTC date, so every player gets the same
   three cases on the same day, with no backend. One attempt per day, stored
   in localStorage; the existing Puzzle Mode remains the unlimited practice
   mode and does not touch these results.
   ========================================================================= */

/* ---------- seeded RNG so everyone gets the same daily ---------- */

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

const EPOCH = Date.UTC(2026, 0, 1);
function dailyNumber(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return Math.floor((Date.UTC(y, m - 1, d) - EPOCH) / 86400000) + 1;
}

function seededPick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function seededSample(rng, arr, n) {
  const pool = arr.slice();
  const out = [];
  while (out.length < n && pool.length) {
    const i = Math.floor(rng() * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}

/* ---------- run configuration ---------- */

const CASE_COUNT = 3;
const START_CREDIBILITY = 100;

// Escalating stakes: later cases charge more for help and punish misses harder.
const CASE_STAKES = [
  { clueCost: 15, missCost: 20, label: "Case 01" },
  { clueCost: 20, missCost: 25, label: "Case 02" },
  { clueCost: 25, missCost: 30, label: "Case 03" }
];

const SOLO_CATEGORIES = Object.keys(ITEM_FACTS);

function buildDailyRun(dateKey) {
  const rng = mulberry32(hashString("category-detectives::" + dateKey));
  const cats = seededSample(rng, SOLO_CATEGORIES, Math.min(CASE_COUNT, SOLO_CATEGORIES.length));
  // If there are fewer categories than cases, wrap around.
  while (cats.length < CASE_COUNT) cats.push(seededPick(rng, SOLO_CATEGORIES));

  return cats.map((categoryKey, idx) => {
    const items = CATEGORY_SETS[categoryKey].items.map((name, id) => ({ id, name }));
    const secret = seededPick(rng, items);
    const entry = ITEM_FACTS[categoryKey][secret.name];
    return {
      categoryKey,
      board: [...items].sort((a, b) => a.name.localeCompare(b.name)),
      secretId: secret.id,
      clues: entry.clues,
      stakes: CASE_STAKES[idx] || CASE_STAKES[CASE_STAKES.length - 1]
    };
  });
}

function groupOf(categoryKey, name) {
  const entry = ITEM_FACTS[categoryKey] && ITEM_FACTS[categoryKey][name];
  return entry ? entry.group : null;
}

/* ---------- heat ---------- */

function computeHeat({ cluesRevealed, closeGuesses, farGuesses, solved }) {
  if (solved) return 100;
  const raw = 15 + cluesRevealed * 12 + closeGuesses * 22 - farGuesses * 6;
  return Math.max(0, Math.min(100, raw));
}

function heatLabel(heat) {
  if (heat >= 85) return "BURNING";
  if (heat >= 60) return "HOT";
  if (heat >= 35) return "WARM";
  if (heat >= 15) return "COOL";
  return "COLD";
}

function heatColor(heat) {
  if (heat >= 85) return "var(--heat-4)";
  if (heat >= 60) return "var(--heat-3)";
  if (heat >= 35) return "var(--heat-2)";
  return "var(--heat-1)";
}

/* ---------- persistence ---------- */

const RESULT_KEY = "cd-daily-result-";
const STATS_KEY = "cd-daily-stats-v1";
const DEFAULT_STATS = { lastPlayed: null, streak: 0, bestStreak: 0, bestScore: 0, runs: 0, totalScore: 0 };

function loadDailyResult(dateKey) {
  try {
    const raw = localStorage.getItem(RESULT_KEY + dateKey);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function saveDailyResult(dateKey, result) {
  try { localStorage.setItem(RESULT_KEY + dateKey, JSON.stringify(result)); } catch { /* ignore */ }
}
function loadDailyStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? { ...DEFAULT_STATS, ...JSON.parse(raw) } : { ...DEFAULT_STATS };
  } catch { return { ...DEFAULT_STATS }; }
}
function saveDailyStats(s) {
  try { localStorage.setItem(STATS_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

function yesterdayKeyOf(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
}

/* ---------- state ---------- */

function initialState() {
  const dateKey = todayKey();
  const cases = buildDailyRun(dateKey);
  const existing = loadDailyResult(dateKey);
  return {
    dateKey,
    dailyNo: dailyNumber(dateKey),
    cases,
    caseIndex: 0,
    screen: existing ? "results" : "intro",
    finishedResult: existing,
    // per-case working state
    credibility: START_CREDIBILITY,
    cluesRevealed: 1,      // first clue is free
    wrongGuesses: {},      // id -> { isClose }
    closeGuesses: 0,
    farGuesses: 0,
    modalGuess: null,
    caseLog: [],           // one entry per completed case
    lastOutcome: null      // { solved, banked, caseIndex }
  };
}

function freshCaseState(state, caseIndex) {
  return {
    ...state,
    caseIndex,
    credibility: START_CREDIBILITY,
    cluesRevealed: 1,
    wrongGuesses: {},
    closeGuesses: 0,
    farGuesses: 0,
    modalGuess: null,
    screen: "play"
  };
}

function finalizeRun(state, caseLog) {
  const totalScore = caseLog.reduce((s, c) => s + c.banked, 0);
  const solvedCount = caseLog.filter((c) => c.solved).length;
  const peakHeat = Math.max(...caseLog.map((c) => c.heat), 0);
  const result = {
    dateKey: state.dateKey,
    dailyNo: state.dailyNo,
    totalScore,
    solvedCount,
    peakHeat,
    cases: caseLog
  };
  saveDailyResult(state.dateKey, result);
  return result;
}

function reducer(state, action) {
  switch (action.type) {
    case "START_RUN":
      return freshCaseState({ ...state, caseLog: [] }, 0);

    case "BUY_CLUE": {
      const c = state.cases[state.caseIndex];
      const cost = c.stakes.clueCost;
      if (state.cluesRevealed >= c.clues.length) return state;
      if (state.credibility < cost) return state;
      return {
        ...state,
        credibility: state.credibility - cost,
        cluesRevealed: state.cluesRevealed + 1
      };
    }

    case "OPEN_GUESS": {
      if (state.wrongGuesses[action.id]) return state;
      return { ...state, modalGuess: action.id };
    }

    case "CANCEL_GUESS":
      return { ...state, modalGuess: null };

    case "CONFIRM_GUESS": {
      const c = state.cases[state.caseIndex];
      const id = state.modalGuess;
      const guessed = c.board.find((b) => b.id === id);
      const secret = c.board.find((b) => b.id === c.secretId);

      // Correct — bank remaining credibility and close the case.
      if (id === c.secretId) {
        const heat = 100;
        const entry = {
          categoryKey: c.categoryKey,
          answer: secret.name,
          solved: true,
          banked: state.credibility,
          cluesUsed: state.cluesRevealed,
          misses: Object.keys(state.wrongGuesses).length,
          heat
        };
        const caseLog = [...state.caseLog, entry];
        const isLast = state.caseIndex >= state.cases.length - 1;
        if (isLast) {
          return { ...state, modalGuess: null, caseLog, finishedResult: finalizeRun(state, caseLog), screen: "results", lastOutcome: entry };
        }
        return { ...state, modalGuess: null, caseLog, screen: "case-end", lastOutcome: entry };
      }

      // Wrong — charge the miss, mark close/far.
      const isClose = groupOf(c.categoryKey, guessed.name) !== null
        && groupOf(c.categoryKey, guessed.name) === groupOf(c.categoryKey, secret.name);
      const wrongGuesses = { ...state.wrongGuesses, [id]: { isClose } };
      const closeGuesses = state.closeGuesses + (isClose ? 1 : 0);
      const farGuesses = state.farGuesses + (isClose ? 0 : 1);
      const credibility = Math.max(0, state.credibility - c.stakes.missCost);

      // Busted — out of credibility, case closes unsolved.
      if (credibility <= 0) {
        const heat = computeHeat({ cluesRevealed: state.cluesRevealed, closeGuesses, farGuesses, solved: false });
        const entry = {
          categoryKey: c.categoryKey,
          answer: secret.name,
          solved: false,
          banked: 0,
          cluesUsed: state.cluesRevealed,
          misses: Object.keys(wrongGuesses).length,
          heat
        };
        const caseLog = [...state.caseLog, entry];
        const isLast = state.caseIndex >= state.cases.length - 1;
        if (isLast) {
          return { ...state, modalGuess: null, credibility: 0, wrongGuesses, closeGuesses, farGuesses, caseLog, finishedResult: finalizeRun(state, caseLog), screen: "results", lastOutcome: entry };
        }
        return { ...state, modalGuess: null, credibility: 0, wrongGuesses, closeGuesses, farGuesses, caseLog, screen: "case-end", lastOutcome: entry };
      }

      return { ...state, modalGuess: null, credibility, wrongGuesses, closeGuesses, farGuesses };
    }

    case "NEXT_CASE":
      return freshCaseState(state, state.caseIndex + 1);

    default:
      return state;
  }
}

/* ---------- share text ---------- */

function caseEmoji(c) {
  if (!c.solved) return "⬛";
  if (c.banked >= 70) return "🟢";
  if (c.banked >= 40) return "🟡";
  return "🟠";
}

function buildShareText(result) {
  const grid = result.cases.map(caseEmoji).join("");
  return [
    `Category Detectives — Daily #${result.dailyNo}`,
    `${grid}  ${result.solvedCount}/${result.cases.length} closed`,
    `🔥 ${result.peakHeat} peak heat · ${result.totalScore} cred banked`
  ].join("\n");
}

/* ---------- styles ---------- */

function useFonts() {
  useEffect(() => {
    if (document.getElementById("dr-fonts")) return;
    const link = document.createElement("link");
    link.id = "dr-fonts";
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&family=Public+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
}

function GlobalStyles() {
  return (
    <style>{`
      html, body { margin: 0; padding: 0; background: #0A0A0C; }
      #root { min-height: 100vh; background: #0A0A0C; }
      .dr-root {
        --void: #0A0A0C; --panel: #131317; --panel-2: #1B1B20;
        --line: #29292F; --line-strong: #3B3B42;
        --ink: #F3F2EE; --ink-dim: #99968F; --ink-faint: #5C5A55;
        --amber: #FFB020; --amber-ink: #1A1200;
        --red: #FF5449; --red-dim: #402019;
        --green: #34D399; --green-dim: #143327;
        --heat-1: #4A7FB5;
        --heat-2: #E8C547;
        --heat-3: #FF8C42;
        --heat-4: #FF4438;
        --font-display: 'Big Shoulders Display', 'Arial Narrow', sans-serif;
        --font-body: 'Public Sans', system-ui, sans-serif;
        --font-mono: 'JetBrains Mono', monospace;
        box-sizing: border-box;
        background: var(--void); color: var(--ink);
        font-family: var(--font-body); min-height: 100vh;
        -webkit-font-smoothing: antialiased;
      }
      .dr-root *, .dr-root *::before, .dr-root *::after { box-sizing: inherit; }
      .dr-root :focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }
      .dr-shell {
        max-width: 520px; margin: 0 auto;
        padding: 26px 18px calc(48px + env(safe-area-inset-bottom, 0px));
      }
      @media (min-width: 760px) { .dr-shell { max-width: 680px; padding: 44px 32px 64px; } }

      .dr-toolbar { display: flex; justify-content: flex-start; margin-bottom: 14px; }
      .dr-icon-btn {
        width: 38px; height: 38px; border-radius: 3px;
        border: 1px solid var(--line-strong); background: var(--panel); color: var(--ink-dim);
        display: flex; align-items: center; justify-content: center; cursor: pointer;
        transition: border-color 0.12s ease, color 0.12s ease;
      }
      .dr-icon-btn:hover { border-color: var(--amber); color: var(--amber); }

      .dr-root h1, .dr-root h2 { margin: 0; font-family: var(--font-display); font-weight: 800; text-transform: uppercase; }
      .dr-root p { margin: 0; }
      .dr-root button { font-family: inherit; }

      .dr-kicker {
        display: inline-flex; align-items: center; gap: 7px;
        font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.14em;
        text-transform: uppercase; color: var(--amber);
      }
      .dr-title { font-size: 40px; line-height: 0.95; margin-top: 10px; }
      @media (min-width: 760px) { .dr-title { font-size: 52px; } }
      .dr-sub { color: var(--ink-dim); font-size: 14.5px; line-height: 1.6; margin-top: 12px; max-width: 48ch; }

      .dr-panel { background: var(--panel); border: 1px solid var(--line-strong); border-radius: 4px; padding: 20px; margin-top: 16px; }
      .dr-panel-head {
        font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.12em;
        text-transform: uppercase; color: var(--ink-faint);
        margin-bottom: 14px; display: flex; align-items: center; gap: 8px;
      }
      .dr-panel-head svg { color: var(--amber); }

      .dr-btn {
        display: inline-flex; align-items: center; justify-content: center; gap: 9px;
        width: 100%; min-height: 54px; border: 1px solid transparent; border-radius: 3px;
        font-family: var(--font-display); font-weight: 700; font-size: 16px;
        text-transform: uppercase; letter-spacing: 0.01em; cursor: pointer; margin-top: 14px;
        background: var(--amber); color: var(--amber-ink);
        transition: filter 0.12s ease, transform 0.05s ease;
      }
      .dr-btn:hover:not(:disabled) { filter: brightness(1.08); }
      .dr-btn:active:not(:disabled) { transform: translateY(1px); }
      .dr-btn.ghost { background: transparent; border-color: var(--line-strong); color: var(--ink-dim); }
      .dr-btn.ghost:hover:not(:disabled) { color: var(--ink); border-color: var(--amber); }
      .dr-btn.danger { background: var(--red); color: #fff; }
      .dr-btn:disabled { opacity: 0.32; cursor: not-allowed; }

      /* ---------- HUD: credibility + heat ---------- */
      .dr-hud { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 16px; }
      .dr-hud-cell { background: var(--panel); border: 1px solid var(--line-strong); border-radius: 4px; padding: 14px; }
      .dr-hud-label { font-family: var(--font-mono); font-size: 9.5px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-faint); }
      .dr-hud-value { font-family: var(--font-display); font-weight: 800; font-size: 30px; line-height: 1; margin-top: 6px; }
      .dr-cred-value { color: var(--amber); }

      .dr-heat-top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
      .dr-heat-tag { font-family: var(--font-mono); font-size: 10px; font-weight: 700; letter-spacing: 0.08em; }
      .dr-heat-track {
        margin-top: 10px; height: 8px; border-radius: 999px;
        background: var(--panel-2); border: 1px solid var(--line); overflow: hidden;
      }
      .dr-heat-fill { height: 100%; border-radius: 999px; transition: width 0.45s cubic-bezier(.3,1.2,.4,1), background 0.45s ease; }
      .dr-heat-spike { animation: dr-spike 0.5s ease-out; }
      @keyframes dr-spike { 0% { filter: brightness(2.2); } 100% { filter: brightness(1); } }

      /* ---------- clues ---------- */
      .dr-clue { display: flex; gap: 11px; align-items: flex-start; font-size: 14.5px; line-height: 1.55; margin-top: 12px; }
      .dr-clue:first-child { margin-top: 0; }
      .dr-clue-num {
        flex: none; width: 23px; height: 23px; border-radius: 2px;
        background: var(--panel-2); border: 1px solid var(--line-strong); color: var(--amber);
        display: flex; align-items: center; justify-content: center;
        font-family: var(--font-mono); font-size: 10.5px; font-weight: 700;
      }
      .dr-clue-new { animation: dr-fade-in 0.4s ease-out; }
      @keyframes dr-fade-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }

      .dr-buy {
        display: flex; align-items: center; justify-content: space-between; gap: 10px;
        width: 100%; min-height: 50px; margin-top: 14px; padding: 12px 14px;
        background: transparent; border: 1px dashed var(--line-strong); border-radius: 3px;
        color: var(--ink-dim); cursor: pointer; text-align: left;
        font-family: var(--font-mono); font-size: 12px;
        transition: border-color 0.12s ease, color 0.12s ease;
      }
      .dr-buy:hover:not(:disabled) { border-color: var(--amber); color: var(--amber); }
      .dr-buy:disabled { opacity: 0.35; cursor: not-allowed; }
      .dr-buy-cost { font-family: var(--font-display); font-weight: 700; font-size: 15px; color: var(--amber); }
      .dr-buy:disabled .dr-buy-cost { color: var(--ink-faint); }

      /* ---------- board ---------- */
      .dr-board { display: grid; grid-template-columns: repeat(2, 1fr); gap: 9px; margin-top: 14px; }
      @media (min-width: 560px) { .dr-board { grid-template-columns: repeat(3, 1fr); } }
      @media (min-width: 900px) { .dr-board { grid-template-columns: repeat(4, 1fr); } }
      .dr-card {
        border: 1px solid var(--line-strong); border-radius: 3px; background: var(--panel);
        padding: 12px 11px; min-height: 84px; text-align: left; cursor: pointer;
        display: flex; flex-direction: column; justify-content: space-between;
        font-size: 13px; font-weight: 700; color: var(--ink);
        transition: border-color 0.12s ease, background 0.12s ease, transform 0.06s ease;
      }
      .dr-card:hover:not(:disabled) { border-color: var(--amber); }
      .dr-card:active:not(:disabled) { transform: scale(0.98); }
      .dr-card:disabled { cursor: default; }
      .dr-card.close { border-color: var(--amber); background: rgba(255,176,32,0.07); opacity: 0.9; }
      .dr-card.close .dr-card-tag { color: var(--amber); border-color: var(--amber); }
      .dr-card.far { opacity: 0.38; }
      .dr-card-tag {
        font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.06em;
        color: var(--ink-faint); border: 1px solid var(--line); border-radius: 2px;
        padding: 1px 5px; align-self: flex-start;
      }

      /* ---------- progress pips ---------- */
      .dr-pips { display: flex; gap: 6px; align-items: center; }
      .dr-pip { width: 26px; height: 4px; border-radius: 999px; background: var(--line-strong); }
      .dr-pip.done-win { background: var(--green); }
      .dr-pip.done-loss { background: var(--red); }
      .dr-pip.active { background: var(--amber); }

      /* ---------- modal ---------- */
      .dr-modal-bg {
        position: fixed; inset: 0; background: rgba(10,10,12,0.84);
        display: flex; align-items: flex-end; justify-content: center; z-index: 40;
        padding: 0 16px calc(24px + env(safe-area-inset-bottom, 0px));
        animation: dr-fade 0.14s ease-out;
      }
      @media (min-width: 760px) { .dr-modal-bg { align-items: center; } }
      @keyframes dr-fade { from { opacity: 0; } to { opacity: 1; } }
      .dr-modal {
        width: 100%; max-width: 420px; background: var(--panel);
        border: 1px solid var(--line-strong); border-top: 3px solid var(--amber);
        border-radius: 4px; padding: 22px;
      }
      .dr-modal-target {
        margin-top: 10px; display: flex; align-items: center; gap: 11px;
        background: var(--void); border: 1px solid var(--line-strong); border-radius: 3px;
        padding: 14px; font-family: var(--font-display); font-size: 19px; font-weight: 800; text-transform: uppercase;
      }
      .dr-modal-target svg { color: var(--amber); flex: none; }
      .dr-modal-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 16px; }
      .dr-modal-actions .dr-btn { margin-top: 0; }

      /* ---------- case end / results ---------- */
      .dr-verdict { text-align: center; padding: 32px 20px; border-radius: 4px; border: 1px solid var(--line-strong); }
      .dr-verdict.win { background: var(--green-dim); border-color: var(--green); }
      .dr-verdict.loss { background: var(--panel); border-color: var(--red); }
      .dr-verdict-icon {
        width: 58px; height: 58px; border-radius: 50%; margin: 0 auto;
        display: flex; align-items: center; justify-content: center;
        animation: dr-pop 0.4s cubic-bezier(.2,1.6,.4,1);
      }
      .win .dr-verdict-icon { background: rgba(52,211,153,0.16); color: var(--green); }
      .loss .dr-verdict-icon { background: rgba(255,84,73,0.14); color: var(--red); }
      @keyframes dr-pop { 0% { transform: scale(0); } 65% { transform: scale(1.15); } 100% { transform: scale(1); } }
      .dr-verdict-title { font-size: 28px; margin-top: 14px; }
      .dr-verdict-sub { color: var(--ink-dim); font-size: 14px; margin-top: 8px; line-height: 1.5; }

      .dr-score-row { display: flex; justify-content: center; gap: 26px; margin-top: 22px; flex-wrap: wrap; }
      .dr-score-num { font-family: var(--font-display); font-weight: 800; font-size: 30px; color: var(--amber); line-height: 1; }
      .dr-score-label { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-faint); margin-top: 5px; }

      .dr-breakdown-row {
        display: flex; align-items: center; justify-content: space-between; gap: 10px;
        padding: 12px 0; border-bottom: 1px solid var(--line);
      }
      .dr-breakdown-row:last-child { border-bottom: none; }
      .dr-breakdown-left { display: flex; align-items: center; gap: 11px; min-width: 0; }
      .dr-breakdown-cat { font-family: var(--font-mono); font-size: 10px; color: var(--ink-faint); text-transform: uppercase; letter-spacing: 0.06em; }
      .dr-breakdown-answer { font-family: var(--font-display); font-weight: 700; font-size: 15px; text-transform: uppercase; }
      .dr-breakdown-banked { font-family: var(--font-display); font-weight: 800; font-size: 18px; color: var(--amber); flex: none; }
      .dr-breakdown-banked.zero { color: var(--ink-faint); }

      .dr-share {
        margin-top: 16px; background: var(--void); border: 1px solid var(--line-strong);
        border-radius: 4px; padding: 16px;
        font-family: var(--font-mono); font-size: 13px; line-height: 1.8;
        white-space: pre-wrap; text-align: center; color: var(--ink);
      }

      .dr-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
      .dr-stat { text-align: center; }
      .dr-stat-num { font-family: var(--font-display); font-weight: 800; font-size: 22px; }
      .dr-stat-label { font-family: var(--font-mono); font-size: 8.5px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-faint); margin-top: 4px; }

      .dr-footer { text-align: center; color: var(--ink-faint); font-family: var(--font-mono); font-size: 10.5px; margin-top: 28px; line-height: 1.6; }
    `}</style>
  );
}

/* ---------- pieces ---------- */

function HeatMeter({ heat, pulseKey }) {
  return (
    <div className="dr-hud-cell">
      <div className="dr-heat-top">
        <span className="dr-hud-label">Trail Heat</span>
        <span className="dr-heat-tag" style={{ color: heatColor(heat) }}>{heatLabel(heat)}</span>
      </div>
      <div className="dr-hud-value" style={{ color: heatColor(heat) }}>{heat}</div>
      <div className="dr-heat-track">
        <div
          key={pulseKey}
          className="dr-heat-fill dr-heat-spike"
          style={{ width: heat + "%", background: heatColor(heat) }}
        />
      </div>
    </div>
  );
}

function CasePips({ cases, caseLog, caseIndex }) {
  return (
    <div className="dr-pips">
      {cases.map((_, i) => {
        const done = caseLog[i];
        const cls = done ? (done.solved ? "done-win" : "done-loss") : (i === caseIndex ? "active" : "");
        return <div key={i} className={"dr-pip " + cls} />;
      })}
    </div>
  );
}

/* ---------- screens ---------- */

function IntroScreen({ state, dispatch, stats }) {
  return (
    <div>
      <div className="dr-kicker"><Calendar size={13} /> DAILY #{state.dailyNo} · {state.dateKey}</div>
      <h1 className="dr-title">The Daily<br />Dive</h1>
      <p className="dr-sub">
        Three cases. One shot. Every clue costs you, every wrong name costs more —
        bank whatever credibility you have left when you crack it.
      </p>

      <div className="dr-panel">
        <div className="dr-panel-head"><Flame size={13} /> HOW THE RUN WORKS</div>
        <div className="dr-clue"><span className="dr-clue-num">1</span><span>Each case starts at {START_CREDIBILITY} credibility with one free clue on the table.</span></div>
        <div className="dr-clue"><span className="dr-clue-num">2</span><span>Buy another clue to narrow it down, or name your suspect early and keep the cash.</span></div>
        <div className="dr-clue"><span className="dr-clue-num">3</span><span>Wrong names cost more than clues — but they tell you if you were CLOSE or FAR.</span></div>
        <div className="dr-clue"><span className="dr-clue-num">4</span><span>Stakes climb each case. Run out of credibility and the case goes cold.</span></div>
      </div>

      {stats.runs > 0 && (
        <div className="dr-panel">
          <div className="dr-panel-head"><TrendingUp size={13} /> YOUR RECORD</div>
          <div className="dr-stats-grid">
            <div className="dr-stat">
              <div className="dr-stat-num" style={{ color: stats.streak > 0 ? "var(--amber)" : "var(--ink)" }}>{stats.streak}</div>
              <div className="dr-stat-label">Day Streak</div>
            </div>
            <div className="dr-stat">
              <div className="dr-stat-num">{stats.bestScore}</div>
              <div className="dr-stat-label">Best Score</div>
            </div>
            <div className="dr-stat">
              <div className="dr-stat-num">{stats.runs}</div>
              <div className="dr-stat-label">Runs Played</div>
            </div>
          </div>
        </div>
      )}

      <button className="dr-btn" onClick={() => dispatch({ type: "START_RUN" })}>
        Open Case 01 <ChevronRight size={17} strokeWidth={2.5} />
      </button>
      <div className="dr-footer">ONE RUN PER DAY · EVERY PLAYER GETS THE SAME THREE CASES</div>
    </div>
  );
}

function PlayScreen({ state, dispatch }) {
  const c = state.cases[state.caseIndex];
  const heat = computeHeat({
    cluesRevealed: state.cluesRevealed,
    closeGuesses: state.closeGuesses,
    farGuesses: state.farGuesses,
    solved: false
  });
  const cluesShown = c.clues.slice(0, state.cluesRevealed);
  const cluesLeft = c.clues.length - state.cluesRevealed;
  const canAfford = state.credibility >= c.stakes.clueCost;
  const pulseKey = `${state.cluesRevealed}-${state.closeGuesses}-${state.farGuesses}`;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div className="dr-kicker"><Search size={13} /> {c.stakes.label} · {c.categoryKey}</div>
        <CasePips cases={state.cases} caseLog={state.caseLog} caseIndex={state.caseIndex} />
      </div>
      <h1 className="dr-title" style={{ fontSize: 34 }}>Name The Suspect</h1>

      <div className="dr-hud">
        <div className="dr-hud-cell">
          <div className="dr-hud-label">Credibility</div>
          <div className="dr-hud-value dr-cred-value">{state.credibility}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-faint)", marginTop: 8 }}>
            MISS COSTS {c.stakes.missCost}
          </div>
        </div>
        <HeatMeter heat={heat} pulseKey={pulseKey} />
      </div>

      <div className="dr-panel">
        <div className="dr-panel-head"><Unlock size={13} /> CASE FILE</div>
        {cluesShown.map((clue, i) => (
          <div className={"dr-clue" + (i === state.cluesRevealed - 1 && i > 0 ? " dr-clue-new" : "")} key={i}>
            <span className="dr-clue-num">{i + 1}</span>
            <span>{clue}</span>
          </div>
        ))}
        <button
          className="dr-buy"
          disabled={cluesLeft === 0 || !canAfford}
          onClick={() => dispatch({ type: "BUY_CLUE" })}
        >
          <span>
            {cluesLeft === 0
              ? "NO CLUES LEFT — MAKE THE CALL"
              : !canAfford
                ? `CAN'T AFFORD THE NEXT CLUE (${cluesLeft} SEALED)`
                : `BUY CLUE ${state.cluesRevealed + 1} · ${cluesLeft} STILL SEALED`}
          </span>
          {cluesLeft > 0 && <span className="dr-buy-cost">−{c.stakes.clueCost}</span>}
        </button>
      </div>

      <div className="dr-board">
        {c.board.map((item) => {
          const wrong = state.wrongGuesses[item.id];
          const cls = "dr-card" + (wrong ? (wrong.isClose ? " close" : " far") : "");
          return (
            <button
              key={item.id}
              className={cls}
              disabled={!!wrong}
              onClick={() => dispatch({ type: "OPEN_GUESS", id: item.id })}
            >
              <span className="dr-card-tag">
                {wrong ? (wrong.isClose ? "CLOSE" : "FAR") : String(item.id + 1).padStart(2, "0")}
              </span>
              <span>{item.name}</span>
            </button>
          );
        })}
      </div>

      {state.modalGuess !== null && <GuessModal state={state} dispatch={dispatch} />}
    </div>
  );
}

function GuessModal({ state, dispatch }) {
  const c = state.cases[state.caseIndex];
  const item = c.board.find((b) => b.id === state.modalGuess);
  return (
    <div className="dr-modal-bg">
      <div className="dr-modal">
        <div className="dr-panel-head" style={{ marginBottom: 0 }}><Target size={13} /> NAME THE SUSPECT</div>
        <div className="dr-modal-target"><Target size={20} strokeWidth={1.75} />{item.name}</div>
        <p className="dr-sub" style={{ marginTop: 12, fontSize: 13 }}>
          Right, and you bank {state.credibility} credibility. Wrong, and it costs you {c.stakes.missCost}.
        </p>
        <div className="dr-modal-actions">
          <button className="dr-btn ghost" onClick={() => dispatch({ type: "CANCEL_GUESS" })}>
            <X size={16} /> Back
          </button>
          <button className="dr-btn danger" onClick={() => dispatch({ type: "CONFIRM_GUESS" })}>
            Accuse
          </button>
        </div>
      </div>
    </div>
  );
}

function CaseEndScreen({ state, dispatch }) {
  const o = state.lastOutcome;
  const nextNo = state.caseIndex + 2;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div className="dr-kicker"><Search size={13} /> DAILY #{state.dailyNo}</div>
        <CasePips cases={state.cases} caseLog={state.caseLog} caseIndex={state.caseIndex + 1} />
      </div>

      <div className={"dr-verdict " + (o.solved ? "win" : "loss")} style={{ marginTop: 18 }}>
        <div className="dr-verdict-icon">
          {o.solved ? <CheckCircle2 size={28} strokeWidth={1.75} /> : <Skull size={28} strokeWidth={1.75} />}
        </div>
        <h2 className="dr-verdict-title">{o.solved ? "Case Closed" : "Gone Cold"}</h2>
        <p className="dr-verdict-sub">
          {o.solved
            ? `${o.answer} — banked ${o.banked} credibility on ${o.cluesUsed} clue${o.cluesUsed === 1 ? "" : "s"}.`
            : `It was ${o.answer}. Nothing banked on this one.`}
        </p>
      </div>

      <button className="dr-btn" onClick={() => dispatch({ type: "NEXT_CASE" })}>
        Open Case 0{nextNo} <ChevronRight size={17} strokeWidth={2.5} />
      </button>
    </div>
  );
}

function ResultsScreen({ state, stats }) {
  const result = state.finishedResult;
  const [copied, setCopied] = useState(false);
  const shareText = buildShareText(result);
  const allSolved = result.solvedCount === result.cases.length;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div>
      <div className="dr-kicker"><Calendar size={13} /> DAILY #{result.dailyNo} · COMPLETE</div>

      <div className={"dr-verdict " + (allSolved ? "win" : "loss")} style={{ marginTop: 16 }}>
        <div className="dr-verdict-icon">
          {allSolved ? <Award size={28} strokeWidth={1.75} /> : <CheckCircle2 size={28} strokeWidth={1.75} />}
        </div>
        <h2 className="dr-verdict-title">{allSolved ? "Perfect Run" : "Run Complete"}</h2>
        <p className="dr-verdict-sub">
          {result.solvedCount} of {result.cases.length} cases closed.
        </p>
        <div className="dr-score-row">
          <div>
            <div className="dr-score-num">{result.totalScore}</div>
            <div className="dr-score-label">Cred Banked</div>
          </div>
          <div>
            <div className="dr-score-num" style={{ color: heatColor(result.peakHeat) }}>{result.peakHeat}</div>
            <div className="dr-score-label">Peak Heat</div>
          </div>
          <div>
            <div className="dr-score-num">{result.solvedCount}/{result.cases.length}</div>
            <div className="dr-score-label">Closed</div>
          </div>
        </div>
      </div>

      <div className="dr-panel">
        <div className="dr-panel-head"><Lock size={13} /> THE CASEBOOK</div>
        {result.cases.map((c, i) => (
          <div className="dr-breakdown-row" key={i}>
            <div className="dr-breakdown-left">
              <span style={{ fontSize: 17 }}>{caseEmoji(c)}</span>
              <div style={{ minWidth: 0 }}>
                <div className="dr-breakdown-cat">{c.categoryKey} · {c.cluesUsed} clue{c.cluesUsed === 1 ? "" : "s"} · {c.misses} miss{c.misses === 1 ? "" : "es"}</div>
                <div className="dr-breakdown-answer">{c.answer}</div>
              </div>
            </div>
            <div className={"dr-breakdown-banked" + (c.banked === 0 ? " zero" : "")}>+{c.banked}</div>
          </div>
        ))}
      </div>

      <div className="dr-panel">
        <div className="dr-panel-head"><Share2 size={13} /> SHARE YOUR RUN</div>
        <div className="dr-share">{shareText}</div>
        <button className="dr-btn" onClick={copy}>
          {copied ? <><CheckCircle2 size={16} /> Copied</> : <><Clipboard size={16} /> Copy Result</>}
        </button>
      </div>

      {stats.runs > 0 && (
        <div className="dr-panel">
          <div className="dr-panel-head"><TrendingUp size={13} /> YOUR RECORD</div>
          <div className="dr-stats-grid">
            <div className="dr-stat">
              <div className="dr-stat-num" style={{ color: stats.streak > 0 ? "var(--amber)" : "var(--ink)" }}>{stats.streak}</div>
              <div className="dr-stat-label">Day Streak</div>
            </div>
            <div className="dr-stat">
              <div className="dr-stat-num">{stats.bestScore}</div>
              <div className="dr-stat-label">Best Score</div>
            </div>
            <div className="dr-stat">
              <div className="dr-stat-num">{stats.runs}</div>
              <div className="dr-stat-label">Runs Played</div>
            </div>
          </div>
        </div>
      )}

      <div className="dr-footer">
        NEXT CASE FILE OPENS AT MIDNIGHT UTC<br />
        PRACTICE ANYTIME IN PUZZLE MODE — IT WON'T TOUCH YOUR DAILY
      </div>
    </div>
  );
}

/* ---------- root ---------- */

export default function DailyRun({ onExit }) {
  useFonts();
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [stats, setStats] = useState(loadDailyStats);
  const loggedRef = useRef(false);

  // Log the run into streak/stats exactly once, when results first appear.
  useEffect(() => {
    if (state.screen !== "results" || !state.finishedResult || loggedRef.current) return;
    const result = state.finishedResult;
    if (stats.lastPlayed === result.dateKey) { loggedRef.current = true; return; }
    loggedRef.current = true;
    setStats((prev) => {
      const continued = prev.lastPlayed === yesterdayKeyOf(result.dateKey);
      const streak = continued ? prev.streak + 1 : 1;
      const next = {
        lastPlayed: result.dateKey,
        streak,
        bestStreak: Math.max(prev.bestStreak, streak),
        bestScore: Math.max(prev.bestScore, result.totalScore),
        runs: prev.runs + 1,
        totalScore: prev.totalScore + result.totalScore
      };
      saveDailyStats(next);
      return next;
    });
  }, [state.screen, state.finishedResult, stats.lastPlayed]);

  return (
    <>
      <GlobalStyles />
      <div className="dr-root">
        <div className="dr-shell">
          {onExit && (
            <div className="dr-toolbar">
              <button className="dr-icon-btn" aria-label="Back to main menu" onClick={onExit}>
                <Home size={16} strokeWidth={1.75} />
              </button>
            </div>
          )}
          {state.screen === "intro" && <IntroScreen state={state} dispatch={dispatch} stats={stats} />}
          {state.screen === "play" && <PlayScreen state={state} dispatch={dispatch} />}
          {state.screen === "case-end" && <CaseEndScreen state={state} dispatch={dispatch} />}
          {state.screen === "results" && <ResultsScreen state={state} stats={stats} />}
        </div>
      </div>
    </>
  );
}
