/**
 * Game engine: pure state + reducer. No React, no DOM, no randomness inside
 * the reducer (deal results are passed in), so every rule is unit-testable.
 *
 * Rules implemented (see engine.test.js):
 *  - Each player is dealt a different secret item from the chosen category.
 *  - Each turn: eliminate items OR guess, never both.
 *  - Eliminations made this turn ("pending") can be tapped again to undo.
 *    Ending the turn locks them for good.
 *  - Guess mode is unavailable while pending eliminations exist.
 *  - When only one item remains, a confirm prompt is opened for it.
 *  - Correct guess wins. Wrong guess eliminates that item and passes the turn;
 *    if it was the last remaining item the opponent wins by default.
 */
import { getCategory, CATEGORIES } from '../data/categories.js';

export const STATE_VERSION = 2;

export const emptyBoard = () => ({ locked: [], pending: [], wrong: [] });

export function createInitialState(saved = {}) {
  return {
    screen: 'setup', // setup | dealing | reveal | handoff | turn | over
    names: saved.names ?? ['', ''],
    scores: saved.scores ?? [0, 0],
    categoryId: saved.categoryId ?? CATEGORIES[0].id,
    secrets: [null, null],
    boards: [emptyBoard(), emptyBoard()],
    current: 0,
    starter: saved.starter ?? 0,
    turn: 1,
    revealStep: 0, // 0 hide→P1, 1 show P1, 2 hide→P2, 3 show P2
    mode: 'elim', // elim | guess
    sheet: null, // { type: 'guess' | 'last', itemId, undo? }
    justId: null, // last item eliminated this tap (drives the stamp animation)
    report: null, // { p, kind: 'ruled', count } | { p, kind: 'accused', itemId }
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

/* ---------- dealing (random, kept out of the reducer) ---------- */

export function dealSecrets(categoryId, rng = Math.random) {
  const items = getCategory(categoryId).items;
  const a = Math.floor(rng() * items.length);
  let b = Math.floor(rng() * (items.length - 1));
  if (b >= a) b += 1; // never the same item for both players
  const yr = String(new Date().getFullYear()).slice(2);
  const caseNo = `${yr}-${1000 + Math.floor(rng() * 9000)}`;
  return { secrets: [items[a].id, items[b].id], caseNo };
}

/* ---------- helpers ---------- */

const withBoard = (state, p, board, extra = {}) => ({
  ...state,
  ...extra,
  boards: state.boards.map((b, i) => (i === p ? board : b)),
});

function startDeal(state, { secrets, caseNo }) {
  return {
    ...state,
    screen: 'dealing',
    secrets,
    caseNo,
    boards: [emptyBoard(), emptyBoard()],
    current: state.starter,
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

function passTurn(state) {
  return {
    ...state,
    current: 1 - state.current,
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

function accuse(state, itemId) {
  const p = state.current;
  const b = state.boards[p];
  if (b.locked.includes(itemId)) return state;

  // Any pending eliminations lock in with the accusation.
  const locked = [...b.locked, ...b.pending];

  if (itemId === state.secrets[1 - p]) {
    return finish(
      withBoard(state, p, { locked, pending: [], wrong: b.wrong }),
      p,
      'solved',
      itemId,
    );
  }

  const next = withBoard(
    state,
    p,
    { locked: [...locked, itemId], pending: [], wrong: [...b.wrong, itemId] },
    { sheet: null },
  );
  if (remainingIds(next, p).length === 0) {
    return finish(next, 1 - p, 'exhausted', itemId); // out of options
  }
  return passTurn({ ...next, report: { p, kind: 'accused', itemId } });
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
      return { ...state, scores: [0, 0] };

    case 'DEAL':
      return startDeal(state, action);
    case 'REMATCH':
      // Alternate who goes first; keep scores and category.
      return startDeal({ ...state, starter: 1 - state.starter }, action);
    case 'DEAL_DONE':
      return state.screen === 'dealing' ? { ...state, screen: 'reveal' } : state;
    case 'NEW_CATEGORY':
      return { ...state, screen: 'setup', sheet: null };

    case 'REVEAL_NEXT': {
      if (state.screen !== 'reveal') return state;
      const step = state.revealStep + 1;
      return step >= 4
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
      const rem = remainingIds(next, p);
      if (rem.length === 0) return state; // never allow an empty board
      if (rem.length === 1) {
        return { ...next, sheet: { type: 'last', itemId: rem[0], undo: id } };
      }
      return next;
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
export function restoreState(raw) {
  const fresh = (keep = {}) => createInitialState(keep);
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!data || data.v !== STATE_VERSION || !data.state) return fresh();
    const s = data.state;

    const names =
      Array.isArray(s.names) && s.names.length === 2 ? s.names.map(String) : undefined;
    const scores =
      Array.isArray(s.scores) && s.scores.length === 2 && s.scores.every(Number.isFinite)
        ? s.scores
        : undefined;
    const cat = getCategory(s.categoryId);
    const keep = { names, scores, categoryId: cat?.id, starter: s.starter === 1 ? 1 : 0 };

    if (!cat) return fresh(keep);
    if (!GAME_SCREENS.includes(s.screen)) return fresh(keep);

    const ids = new Set(cat.items.map((i) => i.id));
    const okBoards =
      Array.isArray(s.boards) &&
      s.boards.length === 2 &&
      s.boards.every(
        (b) =>
          b &&
          Array.isArray(b.locked) &&
          Array.isArray(b.pending) &&
          Array.isArray(b.wrong) &&
          [...b.locked, ...b.pending, ...b.wrong].every((id) => ids.has(id)),
      );
    const okSecrets =
      Array.isArray(s.secrets) && s.secrets.length === 2 && s.secrets.every((id) => ids.has(id));
    if (!okBoards || !okSecrets) return fresh(keep);

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

