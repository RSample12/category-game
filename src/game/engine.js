/**
 * Game engine: pure state + reducer. No React, no DOM, no randomness inside
 * the reducer (deal results are passed in), so every rule is unit-testable.
 *
 * Rules implemented (see engine.test.js):
 *  - 2 to 4 players. Everyone is dealt a different secret item from the chosen category.
 *  - Clockwise targets: each player hunts the next player in the list and answers the
 *    previous one. With two players that is simply "hunt your opponent".
 *  - Each turn: eliminate items OR guess, never both.
 *  - Eliminations made this turn ("pending") can be tapped again to undo.
 *    Ending the turn locks them for good.
 *  - Guess mode is unavailable while pending eliminations exist.
 *  - Ruling out down to one item does NOT accuse it. The player ends the turn, and the
 *    confirm prompt for that last item opens at the start of their next turn, so the
 *    other players always get a turn in between.
 *  - Wrong guess eliminates that item and passes the turn. If it was the player's last
 *    remaining item, that player is out.
 *  - Two rule sets for 3-4 players (identical with two players):
 *      'last'  (last one standing): cracking your target knocks them out. You then hunt
 *              whoever they were hunting, starting a fresh board. A player who runs out
 *              of suspects is out too, and their hunter takes over their target (fresh
 *              board). The last player left wins.
 *      'first' (first to crack): the first player to crack their target wins. A player
 *              who runs out of suspects is out (their turns are skipped) but still answers
 *              their hunter. If only one player is left in, they win.
 *  - Out players' turns are skipped. Rematch passes the first turn to the next player.
 */
import { getCategory, CATEGORIES } from '../data/categories.js';

export const STATE_VERSION = 3;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;
export const RULES = ['last', 'first'];

export const emptyBoard = () => ({ locked: [], pending: [], wrong: [] });

const padTo = (arr, n, fill) => Array.from({ length: n }, (_, i) => (arr && i < arr.length ? arr[i] : fill));
const clampCount = (n) => Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, Number.isInteger(n) ? n : MIN_PLAYERS));
const ring = (n) => Array.from({ length: n }, (_, i) => (i + 1) % n);

export function createInitialState(saved = {}) {
  const count = clampCount(saved.count ?? 2);
  return {
    screen: 'setup', // setup | dealing | reveal | handoff | turn | over
    count, // players in this game (2-4)
    rules: RULES.includes(saved.rules) ? saved.rules : 'last',
    names: padTo(saved.names, MAX_PLAYERS, ''),
    scores: padTo(saved.scores, MAX_PLAYERS, 0),
    categoryId: saved.categoryId ?? CATEGORIES[0].id,
    secrets: [],
    boards: [],
    targets: [], // targets[p] = the player p is hunting
    alive: [],
    knockouts: [], // [{ by, out, how: 'cracked' | 'exhausted', turn, itemId }]
    current: 0,
    starter: Number.isInteger(saved.starter) ? saved.starter % count : 0,
    turn: 1,
    revealStep: 0, // two steps per player: hide (hand over), then show
    mode: 'elim', // elim | guess
    sheet: null, // { type: 'guess' | 'last', itemId, undo? }
    justId: null, // last item eliminated this tap (drives the stamp animation)
    report: null, // what happened on the previous turn, shown at the handoff
    winner: null,
    reason: null, // 'solved' | 'exhausted'
    lastAccused: null,
    caseNo: '',
  };
}

/* ---------- selectors ---------- */

export function remainingIds(state, p) {
  const b = state.boards[p];
  return getCategory(state.categoryId)
    .items.filter((i) => !b.locked.includes(i.id) && !b.pending.includes(i.id))
    .map((i) => i.id);
}

/** The player `p` is questioning. */
export const targetOf = (state, p) => state.targets[p];

/** The player who is questioning `p` (still in the game), or -1. */
export function hunterOf(state, p) {
  for (let h = 0; h < state.count; h += 1) {
    if (h !== p && state.alive[h] && state.targets[h] === p) return h;
  }
  return -1;
}

export const aliveCount = (state) => state.alive.filter(Boolean).length;

/* ---------- dealing (random, kept out of the reducer) ---------- */

export function dealSecrets(categoryId, count = 2, rng = Math.random) {
  if (typeof count === 'function') [count, rng] = [2, count]; // old (categoryId, rng) form
  const items = getCategory(categoryId).items;
  const idx = items.map((_, i) => i);
  for (let i = 0; i < count; i += 1) {
    const j = i + Math.floor(rng() * (idx.length - i)); // partial shuffle: all different
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const yr = String(new Date().getFullYear()).slice(2);
  const caseNo = `${yr}-${1000 + Math.floor(rng() * 9000)}`;
  return { secrets: idx.slice(0, count).map((i) => items[i].id), caseNo };
}

/* ---------- helpers ---------- */

const withBoard = (state, p, board, extra = {}) => ({
  ...state,
  ...extra,
  boards: state.boards.map((b, i) => (i === p ? board : b)),
});

function startDeal(state, { secrets, caseNo }) {
  const n = state.count;
  if (!Array.isArray(secrets) || secrets.length !== n) return state;
  return {
    ...state,
    screen: 'dealing',
    secrets,
    caseNo,
    boards: Array.from({ length: n }, emptyBoard),
    targets: ring(n),
    alive: Array(n).fill(true),
    knockouts: [],
    current: state.starter % n,
    turn: 1,
    revealStep: 0,
    mode: 'elim',
    sheet: null,
    justId: null,
    report: null,
    winner: null,
    reason: null,
    lastAccused: null,
  };
}

/** Next player still in the game, going round the list. */
function nextAlive(state, from) {
  for (let k = 1; k <= state.count; k += 1) {
    const q = (from + k) % state.count;
    if (state.alive[q]) return q;
  }
  return from;
}

function passTurn(state) {
  return {
    ...state,
    current: nextAlive(state, state.current),
    turn: state.turn + 1,
    mode: 'elim',
    sheet: null,
    justId: null,
    screen: 'handoff',
  };
}

function finish(state, winner, reason, itemId) {
  const scores = [...state.scores];
  scores[winner] += 1;
  return {
    ...state,
    scores,
    winner,
    reason,
    lastAccused: itemId,
    sheet: null,
    justId: null,
    screen: 'over',
  };
}

/**
 * Take `out` out of the game. In 'last' rules (and always with two players) whoever was
 * hunting them takes over their target with a fresh board. Returns the new state and
 * who (if anyone) got a new target.
 */
function knockOut(state, out, by, how, itemId) {
  const alive = state.alive.map((a, i) => (i === out ? false : a));
  const knockouts = [...state.knockouts, { by, out, how, turn: state.turn, itemId }];
  let next = { ...state, alive, knockouts };
  let takeover = -1;
  if (state.rules === 'last' || state.count === 2) {
    const h = how === 'cracked' ? by : hunterOf(state, out);
    if (h >= 0) {
      takeover = h;
      next = withBoard(next, h, emptyBoard(), {
        targets: next.targets.map((t, i) => (i === h ? state.targets[out] : t)),
      });
    }
  }
  return { next, takeover };
}

function accuse(state, itemId) {
  const p = state.current;
  const b = state.boards[p];
  if (b.locked.includes(itemId)) return state;
  const target = state.targets[p];

  // Any pending eliminations lock in with the accusation.
  const locked = [...b.locked, ...b.pending];

  if (itemId === state.secrets[target]) {
    const solved = withBoard(state, p, { locked, pending: [], wrong: b.wrong });
    if (state.rules === 'first' && state.count > 2) return finish(solved, p, 'solved', itemId);
    const { next } = knockOut(solved, target, p, 'cracked', itemId);
    if (aliveCount(next) === 1) return finish(next, p, 'solved', itemId);
    return passTurn({
      ...next,
      lastAccused: itemId,
      report: { p, kind: 'cracked', out: target, itemId, next: next.targets[p] },
    });
  }

  const missed = withBoard(
    state,
    p,
    { locked: [...locked, itemId], pending: [], wrong: [...b.wrong, itemId] },
    { sheet: null },
  );
  if (remainingIds(missed, p).length > 0) {
    return passTurn({ ...missed, report: { p, kind: 'accused', itemId } });
  }

  // Out of suspects: this player is out.
  const { next, takeover } = knockOut(missed, p, null, 'exhausted', itemId);
  if (aliveCount(next) === 1) {
    return finish(next, next.alive.indexOf(true), 'exhausted', itemId);
  }
  return passTurn({
    ...next,
    report: {
      p,
      kind: 'out',
      itemId,
      takeover,
      next: takeover >= 0 ? next.targets[takeover] : -1,
    },
  });
}

/* ---------- reducer ---------- */

export function reducer(state, action) {
  switch (action.type) {
    case 'SET_NAME': {
      const names = [...state.names];
      names[action.index] = action.value;
      return { ...state, names };
    }
    case 'SET_CATEGORY':
      return getCategory(action.id) ? { ...state, categoryId: action.id } : state;
    case 'RESET_SCORE':
      return { ...state, scores: Array(MAX_PLAYERS).fill(0) };
    case 'SET_PLAYERS': {
      if (state.screen !== 'setup') return state;
      const count = clampCount(action.count);
      // Removing a detective clears their slot so a re-added one starts blank.
      const names = state.names.map((n, i) => (i < count ? n : ''));
      const scores = state.scores.map((v, i) => (i < count ? v : 0));
      return { ...state, count, names, scores, starter: state.starter % count };
    }
    case 'SET_RULES':
      return RULES.includes(action.rules) && state.screen === 'setup'
        ? { ...state, rules: action.rules }
        : state;

    case 'DEAL':
      return startDeal(state, action);
    case 'REMATCH':
      // The next player goes first; keep scores and category.
      return startDeal({ ...state, starter: (state.starter + 1) % state.count }, action);
    case 'DEAL_DONE':
      return state.screen === 'dealing' ? { ...state, screen: 'reveal' } : state;
    case 'NEW_CATEGORY':
      return { ...state, screen: 'setup', sheet: null };
    case 'GO_HOME': {
      // Abandon the current game. Names, scores, category and who starts next are kept.
      if (state.screen === 'setup') return state;
      const { names, scores, categoryId, starter, count, rules } = state;
      return createInitialState({ names, scores, categoryId, starter, count, rules });
    }

    case 'REVEAL_NEXT': {
      if (state.screen !== 'reveal') return state;
      const step = state.revealStep + 1;
      return step >= 2 * state.count
        ? { ...state, revealStep: step, screen: 'handoff' }
        : { ...state, revealStep: step };
    }

    case 'START_TURN': {
      if (state.screen !== 'handoff') return state;
      const rem = remainingIds(state, state.current);
      return {
        ...state,
        screen: 'turn',
        mode: 'elim',
        justId: null,
        sheet:
          rem.length === 1 ? { type: 'last', itemId: rem[0], undo: null } : null,
      };
    }

    case 'SET_MODE': {
      if (state.screen !== 'turn' || state.sheet) return state;
      if (action.mode === 'guess' && state.boards[state.current].pending.length > 0) {
        return state; // finish the turn first
      }
      return { ...state, mode: action.mode, justId: null };
    }

    case 'TAP_ITEM': {
      if (state.screen !== 'turn' || state.sheet) return state;
      const p = state.current;
      const b = state.boards[p];
      const id = action.id;
      if (b.locked.includes(id)) return state;

      if (state.mode === 'guess') {
        return { ...state, sheet: { type: 'guess', itemId: id }, justId: null };
      }
      if (b.pending.includes(id)) {
        return withBoard(
          state,
          p,
          { ...b, pending: b.pending.filter((x) => x !== id) },
          { justId: null },
        );
      }
      const next = withBoard(
        state,
        p,
        { ...b, pending: [...b.pending, id] },
        { justId: id },
      );
      if (remainingIds(next, p).length === 0) return state; // never allow an empty board
      return next; // one item left is fine: accusing it has to wait for the next turn
    }

    case 'SHEET_CANCEL': {
      const { sheet } = state;
      if (!sheet) return state;
      if (sheet.type === 'last' && sheet.undo) {
        const p = state.current;
        const b = state.boards[p];
        return withBoard(
          state,
          p,
          { ...b, pending: b.pending.filter((x) => x !== sheet.undo) },
          { sheet: null, justId: null },
        );
      }
      return { ...state, sheet: null, justId: null };
    }

    case 'SHEET_CONFIRM':
      return state.sheet ? accuse(state, state.sheet.itemId) : state;

    case 'END_TURN': {
      if (state.screen !== 'turn' || state.sheet) return state;
      const p = state.current;
      const b = state.boards[p];
      const next = withBoard(
        state,
        p,
        { ...b, locked: [...b.locked, ...b.pending], pending: [] },
        { report: { p, kind: 'ruled', count: b.pending.length } },
      );
      return passTurn(next);
    }

    default:
      return state;
  }
}

/* ---------- persistence / resume ---------- */

const GAME_SCREENS = ['dealing', 'reveal', 'handoff', 'turn', 'over'];

export function serialize(state) {
  return JSON.stringify({ v: STATE_VERSION, state });
}

/**
 * Restore a saved game safely. A refresh must never reveal a secret to the
 * wrong player, so any screen that could be showing one is rolled back to its
 * hidden form.
 */
/** Saved games from the two-player-only version (v2) become two-player v3 games. */
function migrate(data) {
  if (data && data.v === 2 && data.state) {
    const s = data.state;
    return {
      ...s,
      count: 2,
      rules: 'last',
      names: padTo(s.names, MAX_PLAYERS, ''),
      scores: padTo(s.scores, MAX_PLAYERS, 0),
      targets: [1, 0],
      alive: [true, true],
      knockouts: [],
    };
  }
  return data && data.v === STATE_VERSION ? data.state : null;
}

/**
 * Restore a saved game safely. A refresh must never reveal a secret to the
 * wrong player, so any screen that could be showing one is rolled back to its
 * hidden form.
 */
export function restoreState(raw) {
  const fresh = (keep = {}) => createInitialState(keep);
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const s = migrate(data);
    if (!s) return fresh();

    const count = Number.isInteger(s.count) && s.count >= MIN_PLAYERS && s.count <= MAX_PLAYERS ? s.count : null;
    const names =
      Array.isArray(s.names) && s.names.length === MAX_PLAYERS ? s.names.map(String) : undefined;
    const scores =
      Array.isArray(s.scores) && s.scores.length === MAX_PLAYERS && s.scores.every(Number.isFinite)
        ? s.scores
        : undefined;
    const cat = getCategory(s.categoryId);
    const keep = {
      names,
      scores,
      categoryId: cat?.id,
      count: count ?? 2,
      rules: s.rules,
      starter: Number.isInteger(s.starter) ? s.starter : 0,
    };

    if (!cat || !count) return fresh(keep);
    if (!GAME_SCREENS.includes(s.screen)) return fresh(keep);

    const ids = new Set(cat.items.map((i) => i.id));
    const okBoards =
      Array.isArray(s.boards) &&
      s.boards.length === count &&
      s.boards.every(
        (b) =>
          b &&
          Array.isArray(b.locked) &&
          Array.isArray(b.pending) &&
          Array.isArray(b.wrong) &&
          [...b.locked, ...b.pending, ...b.wrong].every((id) => ids.has(id)),
      );
    const okSecrets =
      Array.isArray(s.secrets) && s.secrets.length === count && s.secrets.every((id) => ids.has(id));
    const okRing =
      Array.isArray(s.targets) &&
      s.targets.length === count &&
      s.targets.every((t) => Number.isInteger(t) && t >= 0 && t < count) &&
      Array.isArray(s.alive) &&
      s.alive.length === count &&
      s.alive.some(Boolean) &&
      Array.isArray(s.knockouts) &&
      Number.isInteger(s.current) &&
      s.current >= 0 &&
      s.current < count;
    if (!okBoards || !okSecrets || !okRing) return fresh(keep);

    let next = { ...createInitialState(keep), ...s, sheet: null, justId: null };
    if (next.screen === 'dealing') next.screen = 'reveal';
    if (next.screen === 'reveal' && next.revealStep % 2 === 1) next.revealStep -= 1;
    if (next.screen === 'turn') {
      next = { ...next, screen: 'handoff', mode: 'elim' };
    }
    return next;
  } catch {
    return fresh();
  }
}
