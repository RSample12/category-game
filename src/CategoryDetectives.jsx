import React, { useReducer, useEffect, useRef } from "react";
import {
  Search, LayoutGrid, Layers, RefreshCw, ArrowRight, Eye, EyeOff,
  Lock, Lightbulb, Target, Scissors, AlertTriangle, Award, PawPrint, Orbit,
  Dice5, UtensilsCrossed, Map as MapIcon, Trophy, Star, Zap, Drama, CircleDot,
  Car, Loader2, CheckCircle2, X
} from "lucide-react";

/* =========================================================================
   DATA — categories, items, icons. Game rules are unchanged from prior
   builds: shared board, random deal, ask/eliminate/guess, locked history,
   forced guess on the last remaining item, default win on an exhausted
   wrong guess, alternating first player, running score.
   ========================================================================= */

const CATEGORY_SETS = {
  "Dog Breeds": {
    Icon: PawPrint,
    items: ["Labrador Retriever","Poodle","Bulldog","Chihuahua","Beagle","Dachshund","Boxer","Siberian Husky","Rottweiler","German Shepherd","Corgi","Great Dane","Shih Tzu","Border Collie","Doberman","Golden Retriever","Pug","Dalmatian","Basset Hound","Australian Shepherd"]
  },
  "Planets & Moons": {
    Icon: Orbit,
    items: ["Mercury","Venus","Earth","Mars","Jupiter","Saturn","Uranus","Neptune","Pluto","The Moon","Titan","Europa","Ganymede","Io","Callisto","Triton","Phobos","Deimos","Enceladus","Charon"]
  },
  "Board Games": {
    Icon: Dice5,
    items: ["Monopoly","Clue","Risk","Scrabble","Chess","Checkers","Battleship","Sorry!","Candy Land","Trouble","Connect Four","Jenga","Pictionary","Yahtzee","The Game of Life","Operation","Stratego","Mouse Trap","Chutes and Ladders","Backgammon"]
  },
  "Ice Cream Flavors": {
    Icon: UtensilsCrossed,
    items: ["Vanilla","Chocolate","Strawberry","Mint Chocolate Chip","Cookies and Cream","Rocky Road","Pistachio","Butter Pecan","Neapolitan","Cookie Dough","Coffee","Salted Caramel","Mango","Black Cherry","Bubblegum","Peanut Butter Cup","Birthday Cake","Coconut","Maple Walnut","Tiramisu"]
  },
  "US National Parks": {
    Icon: MapIcon,
    items: ["Yellowstone","Yosemite","Grand Canyon","Zion","Acadia","Glacier","Everglades","Denali","Rocky Mountain","Great Smoky Mountains","Joshua Tree","Sequoia","Bryce Canyon","Arches","Olympic","Redwood","Shenandoah","Badlands","Mount Rainier","Death Valley"]
  },
  "Olympic Sports": {
    Icon: Trophy,
    items: ["Swimming","Gymnastics","Track and Field","Basketball","Soccer","Volleyball","Boxing","Wrestling","Fencing","Archery","Rowing","Cycling","Diving","Weightlifting","Judo","Taekwondo","Table Tennis","Badminton","Rugby","Sailing"]
  },
  "Celebrities": {
    Icon: Star,
    items: ["Taylor Swift","Dwayne Johnson","Beyoncé","Tom Hanks","Oprah Winfrey","Leonardo DiCaprio","Rihanna","Will Smith","Jennifer Lawrence","Keanu Reeves","Zendaya","Chris Hemsworth","Serena Williams","Ryan Reynolds","Emma Watson","Denzel Washington","Ariana Grande","Robert Downey Jr.","Lady Gaga","Morgan Freeman"]
  },
  "Pokémon": {
    Icon: Zap,
    items: ["Pikachu","Charizard","Bulbasaur","Squirtle","Charmander","Jigglypuff","Mewtwo","Mew","Eevee","Snorlax","Gengar","Gyarados","Dragonite","Machamp","Alakazam","Vaporeon","Blastoise","Venusaur","Psyduck","Magikarp"]
  },
  "Anime": {
    Icon: Drama,
    items: ["Naruto","One Piece","Dragon Ball Z","Attack on Titan","My Hero Academia","Death Note","Fullmetal Alchemist","Demon Slayer","Sailor Moon","Spirited Away","One Punch Man","Hunter x Hunter","Bleach","Cowboy Bebop","Neon Genesis Evangelion","Jujutsu Kaisen","Tokyo Ghoul","Fairy Tail","Sword Art Online","My Neighbor Totoro"]
  },
  "Famous Soccer Players": {
    Icon: CircleDot,
    items: ["Lionel Messi","Cristiano Ronaldo","Pelé","Diego Maradona","Neymar","Kylian Mbappé","Zinedine Zidane","Ronaldinho","David Beckham","Thierry Henry","Kevin De Bruyne","Erling Haaland","Mohamed Salah","Luka Modrić","Robert Lewandowski","Andrés Iniesta","Xavi","Ronaldo Nazário","Zlatan Ibrahimović","Wayne Rooney"]
  },
  "Car Brands": {
    Icon: Car,
    items: ["Toyota","Ford","Honda","Chevrolet","BMW","Mercedes-Benz","Audi","Volkswagen","Nissan","Tesla","Porsche","Ferrari","Lamborghini","Subaru","Mazda","Hyundai","Kia","Jeep","Volvo","Chrysler"]
  }
};

const DEAL_LINES = [
  "Decrypting case file…",
  "Assigning evidence numbers…",
  "Sealing two case folders…",
  "Syncing the board…",
  "Clearing the terminal…",
  "Logging new session…"
];

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeal(key, gamesPlayed) {
  const items = CATEGORY_SETS[key].items.map((name, idx) => ({ id: idx, name }));
  const forSecrets = shuffle(items);
  const secret = { p1: forSecrets[0].id, p2: forSecrets[1].id };
  const board = [...items].sort((a, b) => a.name.localeCompare(b.name));
  const turn = gamesPlayed % 2 === 0 ? "p1" : "p2";
  return { board, secret, turn };
}

function otherPlayer(p) { return p === "p1" ? "p2" : "p1"; }
function hasFreshEliminations(state, turn) {
  return Object.keys(state.eliminated[turn]).some((id) => !state.locked[turn][id]);
}

/* =========================================================================
   STATE
   ========================================================================= */

const initialState = {
  screen: "intro",
  names: { p1: "Player 1", p2: "Player 2" },
  categoryKey: null,
  board: [],
  secret: { p1: null, p2: null },
  eliminated: { p1: {}, p2: {} },
  locked: { p1: {}, p2: {} },
  turn: "p1",
  rounds: 0,
  winner: null,
  winReason: null,
  mode: "eliminate",
  modalGuess: null,
  turnNotice: null,
  score: { p1: 0, p2: 0 },
  gamesPlayed: 0
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_NAME":
      return { ...state, names: { ...state.names, [action.player]: action.value } };

    case "GO_CATEGORY":
      return { ...state, screen: "category" };

    case "SELECT_CATEGORY":
      return { ...state, categoryKey: action.key };

    case "DEAL": {
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

    case "FINISH_DEALING":
      return state.screen === "dealing" ? { ...state, screen: "play" } : state;

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
        const remainingBefore = state.board.filter(b => !state.eliminated[turn][b.id]);
        if (remainingBefore.length <= 1) return { ...state, modalGuess: id };
      }
      const nextElim = { ...state.eliminated[turn] };
      if (isElim) delete nextElim[id]; else nextElim[id] = true;
      const eliminated = { ...state.eliminated, [turn]: nextElim };
      const remaining = state.board.filter(b => !eliminated[turn][b.id]);
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
      const id = state.modalGuess;
      const correct = state.secret[opponent] === id;
      const remainingBeforeGuess = state.board.filter(b => !state.eliminated[turn][b.id]);
      const wasLastOption = remainingBeforeGuess.length <= 1;
      const item = state.board.find(b => b.id === id);
      const catName = item ? item.name : "";

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
      return {
        ...state, modalGuess: null,
        eliminated: { ...state.eliminated, [turn]: nextElimTurn },
        locked,
        rounds: state.rounds + 1,
        turnNotice: { wrongGuess: true, guesser: turn, itemName: catName },
        turn: opponent, mode: "eliminate",
        screen: "handoff"
      };
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

      /* ---------- mode toggle ---------- */
      .cd-mode-toggle { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 16px; }
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

/* =========================================================================
   SCREENS
   ========================================================================= */

function IntroScreen({ state, dispatch }) {
  return (
    <div>
      <div className="cd-kicker"><Search size={14} strokeWidth={2} /> SESSION 01 // NEW CASE</div>
      <h1 className="cd-title">Category<br />Detectives</h1>
      <p className="cd-subtitle">
        A pass-and-play deduction terminal. Agree on a category, get dealt a
        secret item from it at random, and out-question your opponent to name
        theirs first.
      </p>

      <div className="cd-intro-grid">
        <div className="cd-panel">
          <div className="cd-panel-head"><LayoutGrid size={14} /> AGENTS ON RECORD</div>
          <div className="cd-field">
            <label>Player 1</label>
            <input
              type="text" maxLength={18} placeholder="Player 1"
              value={state.names.p1}
              onChange={(e) => dispatch({ type: "SET_NAME", player: "p1", value: e.target.value.trim() || "Player 1" })}
            />
          </div>
          <div className="cd-field">
            <label>Player 2</label>
            <input
              type="text" maxLength={18} placeholder="Player 2"
              value={state.names.p2}
              onChange={(e) => dispatch({ type: "SET_NAME", player: "p2", value: e.target.value.trim() || "Player 2" })}
            />
          </div>
        </div>

        <div className="cd-panel">
          <div className="cd-panel-head"><Lightbulb size={14} /> BRIEFING</div>
          <div className="cd-how-list">
            {[
              "Together, agree on one shared category from the list.",
              "Each player is randomly dealt one secret item — you don't choose it.",
              "Both players see the same board of every item in the category.",
              "Ask yes/no questions, eliminate wrong answers, then guess."
            ].map((t, i) => (
              <div className="cd-how-item" key={i}>
                <div className="cd-num">{i + 1}</div>
                <p>{t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="cd-stack">
        <button className="cd-btn cd-btn-primary" onClick={() => dispatch({ type: "GO_CATEGORY" })}>
          <LayoutGrid size={18} strokeWidth={2} /> Open Case File
        </button>
      </div>

      <div className="cd-footer">BEST PLAYED SEATED ACROSS FROM YOUR OPPONENT — PASS THE DEVICE WHEN PROMPTED</div>
    </div>
  );
}

function CategoryScreen({ state, dispatch }) {
  const selected = state.categoryKey;
  return (
    <div>
      <div className="cd-kicker"><LayoutGrid size={14} strokeWidth={2} /> STEP 01</div>
      <h1 className="cd-title" style={{ fontSize: 36 }}>Select Category</h1>
      <p className="cd-subtitle">Decide together out loud — this part isn't secret.</p>

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
        {Object.keys(CATEGORY_SETS).map((key) => {
          const { Icon, items } = CATEGORY_SETS[key];
          const isSel = key === selected;
          return (
            <button
              key={key}
              className={"cd-card" + (isSel ? " is-selected" : "")}
              onClick={() => dispatch({ type: "SELECT_CATEGORY", key })}
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
          onClick={() => dispatch({ type: "DEAL" })}
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
        <button className="cd-btn cd-btn-primary" onClick={() => dispatch({ type: "ACK_HANDOFF" })}>
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
            <div className="cd-turn-hint">CASE: {state.categoryKey} — QUESTION {nameOf(opponent)}, THEN NARROW YOUR BOARD.</div>
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
            onClick={() => dispatch({ type: "SET_MODE", mode: "eliminate" })}
          >
            <Scissors size={16} strokeWidth={2} /> Eliminate
          </button>
          <button
            className={"cd-mode-btn guess" + (state.mode === "guess" ? " is-active" : "")}
            disabled={hasFreshEliminations(state, turn)}
            onClick={() => dispatch({ type: "SET_MODE", mode: "guess" })}
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

        <button className="cd-btn cd-btn-secondary" style={{ marginTop: 14 }} onClick={() => dispatch({ type: "END_TURN" })}>
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
                  if (state.mode === "eliminate") dispatch({ type: "TOGGLE_ELIMINATE", id: cat.id });
                  else dispatch({ type: "OPEN_GUESS", id: cat.id });
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
          <button className="cd-btn cd-btn-ghost" onClick={() => dispatch({ type: "CANCEL_GUESS" })}>
            <X size={16} strokeWidth={2} /> Keep Thinking
          </button>
          <button className="cd-btn cd-btn-danger" onClick={() => dispatch({ type: "CONFIRM_GUESS" })}>
            Lock It In
          </button>
        </div>
      </div>
    </div>
  );
}

function WinScreen({ state, dispatch, nameOf, boardItem }) {
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
        <button className="cd-btn cd-btn-primary" onClick={() => dispatch({ type: "REMATCH_SAME_CATEGORY" })}>
          <RefreshCw size={18} strokeWidth={2} /> Rematch — Same Category
        </button>
        <button className="cd-btn cd-btn-secondary" onClick={() => dispatch({ type: "NEW_CATEGORY" })}>
          New Category, Same Players <ArrowRight size={18} strokeWidth={2} />
        </button>
        <button className="cd-btn cd-btn-ghost" onClick={() => dispatch({ type: "BACK_TO_START" })}>
          Back to Start
        </button>
      </div>
    </div>
  );
}

/* =========================================================================
   ROOT
   ========================================================================= */

export default function CategoryDetectives() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (state.screen === "dealing") {
      const t = setTimeout(() => dispatch({ type: "FINISH_DEALING" }), 1400);
      return () => clearTimeout(t);
    }
  }, [state.screen, state.gamesPlayed]);

  const nameOf = (p) => state.names[p];
  const boardItem = (id) => state.board.find((b) => b.id === id);

  return (
    <>
      <FontLoader />
      <GlobalStyles />
      <div className="cd-root">
        <div className="cd-shell">
          {state.screen === "intro" && <IntroScreen state={state} dispatch={dispatch} />}
          {state.screen === "category" && <CategoryScreen state={state} dispatch={dispatch} />}
          {state.screen === "dealing" && <DealingScreen state={state} />}
          {state.screen === "handoff" && <HandoffScreen state={state} dispatch={dispatch} nameOf={nameOf} />}
          {state.screen === "play" && <PlayScreen state={state} dispatch={dispatch} nameOf={nameOf} boardItem={boardItem} />}
          {state.screen === "win" && <WinScreen state={state} dispatch={dispatch} nameOf={nameOf} boardItem={boardItem} />}
        </div>
      </div>
    </>
  );
}
