import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialState, reducer, remainingIds, dealSecrets, restoreState, serialize, hunterOf, aliveCount,
} from './engine.js';
import { getCategory } from '../data/categories.js';

const ITEMS = getCategory('dogs').items.map((i) => i.id);
const run = (state, ...actions) => actions.reduce(reducer, state);

/** P0 holds ITEMS[0], P1 holds ITEMS[1]. Returns state at P0's first turn. */
function startedGame() {
  let s = createInitialState();
  s = run(s, { type: 'DEAL', secrets: [ITEMS[0], ITEMS[1]], caseNo: '26-1234' }, { type: 'DEAL_DONE' });
  s = run(s, ...Array(4).fill({ type: 'REVEAL_NEXT' }));
  assert.equal(s.screen, 'handoff');
  return run(s, { type: 'START_TURN' });
}
const tap = (...ids) => ids.map((id) => ({ type: 'TAP_ITEM', id }));

test('dealSecrets: two different items from the category, every time', () => {
  for (let i = 0; i < 500; i++) {
    const { secrets } = dealSecrets('dogs');
    assert.notEqual(secrets[0], secrets[1]);
    assert.ok(secrets.every((id) => ITEMS.includes(id)));
  }
});

test('deal flow: setup → dealing → reveal → handoff → turn, P0 starts', () => {
  const s = startedGame();
  assert.equal(s.screen, 'turn');
  assert.equal(s.current, 0);
  assert.equal(s.turn, 1);
});

test('eliminate, then tap again to undo (same turn)', () => {
  let s = run(startedGame(), ...tap(ITEMS[3]));
  assert.deepEqual(s.boards[0].pending, [ITEMS[3]]);
  assert.equal(remainingIds(s, 0).length, ITEMS.length - 1);
  s = run(s, ...tap(ITEMS[3]));
  assert.deepEqual(s.boards[0].pending, []);
  assert.equal(remainingIds(s, 0).length, ITEMS.length);
});

test('ending the turn locks eliminations permanently', () => {
  let s = run(startedGame(), ...tap(ITEMS[3], ITEMS[4]), { type: 'END_TURN' });
  assert.deepEqual(s.boards[0].locked, [ITEMS[3], ITEMS[4]]);
  assert.equal(s.screen, 'handoff');
  assert.equal(s.current, 1);
  assert.deepEqual(s.report, { p: 0, kind: 'ruled', count: 2 });
  // P1 plays, then it's P0 again: locked items cannot be tapped back.
  s = run(s, { type: 'START_TURN' }, { type: 'END_TURN' }, { type: 'START_TURN' });
  assert.equal(s.current, 0);
  s = run(s, ...tap(ITEMS[3]));
  assert.deepEqual(s.boards[0].pending, []);
  assert.deepEqual(s.boards[0].locked, [ITEMS[3], ITEMS[4]]);
});

test('guess mode is blocked while fresh eliminations are pending', () => {
  let s = run(startedGame(), ...tap(ITEMS[3]), { type: 'SET_MODE', mode: 'guess' });
  assert.equal(s.mode, 'elim');
  // Undo the elimination and guess mode becomes available.
  s = run(s, ...tap(ITEMS[3]), { type: 'SET_MODE', mode: 'guess' });
  assert.equal(s.mode, 'guess');
});

test('a correct guess wins immediately and scores a point', () => {
  let s = run(startedGame(), { type: 'SET_MODE', mode: 'guess' }, ...tap(ITEMS[1]));
  assert.equal(s.sheet.type, 'guess');
  s = run(s, { type: 'SHEET_CONFIRM' });
  assert.equal(s.screen, 'over');
  assert.equal(s.winner, 0);
  assert.equal(s.reason, 'solved');
  assert.deepEqual(s.scores.slice(0, 2), [1, 0]);
});

test('a wrong guess eliminates the item on your board and passes the turn', () => {
  let s = run(startedGame(), { type: 'SET_MODE', mode: 'guess' }, ...tap(ITEMS[7]), { type: 'SHEET_CONFIRM' });
  assert.equal(s.screen, 'handoff');
  assert.equal(s.current, 1);
  assert.ok(s.boards[0].locked.includes(ITEMS[7]));
  assert.ok(s.boards[0].wrong.includes(ITEMS[7]));
  assert.deepEqual(s.boards[1].locked, []); // opponent board untouched
  assert.deepEqual(s.report, { p: 0, kind: 'accused', itemId: ITEMS[7] });
});

test('cancelling a guess changes nothing', () => {
  const before = run(startedGame(), { type: 'SET_MODE', mode: 'guess' });
  const s = run(before, ...tap(ITEMS[7]), { type: 'SHEET_CANCEL' });
  assert.equal(s.sheet, null);
  assert.deepEqual(s.boards, before.boards);
});

// P0 rules out everything but `keep`, ends the turn, P1 passes, and P0 starts their next turn.
const toNextTurnWithOneLeft = (keep) => {
  const all = ITEMS.filter((id) => id !== keep);
  return run(
    startedGame(),
    ...tap(...all),
    { type: 'END_TURN' },
    { type: 'START_TURN' },
    { type: 'END_TURN' },
    { type: 'START_TURN' },
  );
};

test('eliminating down to one item does NOT accuse it on the same turn', () => {
  const all = ITEMS.filter((id) => id !== ITEMS[5]);
  const s = run(startedGame(), ...tap(...all));
  assert.equal(s.sheet, null);
  assert.equal(s.screen, 'turn');
  assert.equal(s.winner, null);
  assert.equal(remainingIds(s, 0).length, 1);
  // Guessing stays locked until the turn ends.
  assert.equal(run(s, { type: 'SET_MODE', mode: 'guess' }).mode, 'elim');
});

test('the player cannot rule out their very last item', () => {
  const s = run(startedGame(), ...tap(...ITEMS));
  assert.equal(remainingIds(s, 0).length, 1);
});

test('after ending the turn, the opponent plays, then the last-item prompt opens', () => {
  const s = toNextTurnWithOneLeft(ITEMS[5]);
  assert.equal(s.current, 0);
  assert.deepEqual(s.sheet, { type: 'last', itemId: ITEMS[5], undo: null });
});

test('last item that IS the opponent secret: confirm wins on the next turn', () => {
  const s = run(toNextTurnWithOneLeft(ITEMS[1]), { type: 'SHEET_CONFIRM' }); // P1 secret is ITEMS[1]
  assert.equal(s.winner, 0);
  assert.equal(s.reason, 'solved');
});

test('wrong guess on your LAST item: opponent wins by default', () => {
  const s = run(toNextTurnWithOneLeft(ITEMS[5]), { type: 'SHEET_CONFIRM' }); // not P1 secret
  assert.equal(s.screen, 'over');
  assert.equal(s.winner, 1);
  assert.equal(s.reason, 'exhausted');
  assert.deepEqual(s.scores.slice(0, 2), [0, 1]);
});

test('a player who starts a turn with one item left gets the prompt immediately', () => {
  const all = ITEMS.filter((id) => id !== ITEMS[5]);
  // Wrong guesses over several turns whittle P0 down; simulate via locked state.
  let s = startedGame();
  s = { ...s, boards: [{ locked: all, pending: [], wrong: [] }, s.boards[1]], screen: 'handoff' };
  s = run(s, { type: 'START_TURN' });
  assert.equal(s.sheet.itemId, ITEMS[5]);
});

test('rematch: new deal, same category, scores kept, first player alternates', () => {
  let s = run(startedGame(), { type: 'SET_MODE', mode: 'guess' }, ...tap(ITEMS[1]), { type: 'SHEET_CONFIRM' });
  s = run(s, { type: 'REMATCH', secrets: [ITEMS[2], ITEMS[3]], caseNo: 'x' });
  assert.equal(s.screen, 'dealing');
  assert.equal(s.categoryId, 'dogs');
  assert.deepEqual(s.scores.slice(0, 2), [1, 0]);
  assert.equal(s.current, 1);
  assert.deepEqual(s.secrets, [ITEMS[2], ITEMS[3]]);
  assert.deepEqual(s.boards.map((b) => b.locked.length + b.pending.length), [0, 0]);
});

test('new category keeps the score; invalid category ids are ignored', () => {
  let s = run(startedGame(), { type: 'NEW_CATEGORY' });
  assert.equal(s.screen, 'setup');
  s = run(s, { type: 'SET_CATEGORY', id: 'nope' });
  assert.equal(s.categoryId, 'dogs');
  s = run(s, { type: 'SET_CATEGORY', id: 'pokemon' });
  assert.equal(s.categoryId, 'pokemon');
});

test('restore: a refresh never leaves a secret on screen', () => {
  const mid = run(startedGame(), ...tap(ITEMS[3]));
  const turn = restoreState(serialize(mid));
  assert.equal(turn.screen, 'handoff'); // hidden until the player taps start
  assert.deepEqual(turn.boards[0].pending, [ITEMS[3]]);

  const dealt = run(createInitialState(), { type: 'DEAL', secrets: [ITEMS[0], ITEMS[1]], caseNo: 'x' }, { type: 'DEAL_DONE' });
  const showing = { ...dealt, revealStep: 3 };
  assert.equal(restoreState(serialize(showing)).revealStep, 2);
});

test('restore: bad or foreign data falls back to a fresh game', () => {
  assert.equal(restoreState('not json').screen, 'setup');
  assert.equal(restoreState(JSON.stringify({ v: 1, state: {} })).screen, 'setup');
  const corrupt = { ...startedGame(), secrets: ['dogs-ghost', 'dogs-nobody'] };
  assert.equal(restoreState(serialize(corrupt)).screen, 'setup');
});

test('GO_HOME mid-game: back to setup, game wiped, names/scores/category kept', () => {
  let s = createInitialState({ names: ['Ann', 'Bo'], scores: [2, 1], categoryId: 'pokemon', starter: 1 });
  s = run(s, { type: 'DEAL', secrets: [ITEMS[0], ITEMS[1]], caseNo: '26-1234' }, { type: 'DEAL_DONE' });
  s = run(s, ...Array(4).fill({ type: 'REVEAL_NEXT' }), { type: 'START_TURN' });
  s = run(s, ...tap(ITEMS[3]));
  assert.equal(s.screen, 'turn');
  s = run(s, { type: 'GO_HOME' });
  assert.equal(s.screen, 'setup');
  assert.deepEqual(s.secrets, []);
  assert.deepEqual(s.boards, []);
  assert.deepEqual(s.names.slice(0, 2), ['Ann', 'Bo']);
  assert.deepEqual(s.scores.slice(0, 2), [2, 1]);
  assert.equal(s.categoryId, 'pokemon');
  assert.equal(s.starter, 1);
  assert.equal(s.sheet, null);
});

test('GO_HOME on setup is a no-op, and works from every game screen', () => {
  const home = createInitialState();
  assert.equal(reducer(home, { type: 'GO_HOME' }), home);
  const dealing = reducer(home, { type: 'DEAL', secrets: [ITEMS[0], ITEMS[1]], caseNo: 'x' });
  for (const st of [dealing, reducer(dealing, { type: 'DEAL_DONE' }), startedGame()]) {
    assert.equal(reducer(st, { type: 'GO_HOME' }).screen, 'setup');
  }
});

/* ---------------- 3-4 players ---------------- */

const START = { type: 'START_TURN' };
const END = { type: 'END_TURN' };
const OK = { type: 'SHEET_CONFIRM' };
const guess = (id) => [{ type: 'SET_MODE', mode: 'guess' }, { type: 'TAP_ITEM', id }, OK];

/** n players, rules; player i holds ITEMS[i]. Returns state at the first player's turn. */
function bigGame(n, rules) {
  let s = run(createInitialState(), { type: 'SET_PLAYERS', count: n }, { type: 'SET_RULES', rules });
  s = run(s, { type: 'DEAL', secrets: ITEMS.slice(0, n), caseNo: 'x' }, { type: 'DEAL_DONE' });
  s = run(s, ...Array(2 * n).fill({ type: 'REVEAL_NEXT' }));
  assert.equal(s.screen, 'handoff');
  return run(s, START);
}
/** Everyone but `p` passes; returns state at p's next turn. */
function passRound(s) {
  return run(s, END, START);
}

test('dealSecrets: n different items', () => {
  for (let i = 0; i < 100; i += 1) {
    const { secrets } = dealSecrets('dogs', 4);
    assert.equal(secrets.length, 4);
    assert.equal(new Set(secrets).size, 4);
  }
});

test('setup: player count is clamped to 2-4 and removing a player clears their slot', () => {
  let s = run(createInitialState(), { type: 'SET_NAME', index: 2, value: 'Cy' }, { type: 'SET_PLAYERS', count: 9 });
  assert.equal(s.count, 4);
  s = run(s, { type: 'SET_PLAYERS', count: 1 });
  assert.equal(s.count, 2);
  assert.equal(s.names[2], '');
  // a deal with the wrong number of secrets is ignored
  s = run(s, { type: 'SET_PLAYERS', count: 3 });
  assert.equal(reducer(s, { type: 'DEAL', secrets: ITEMS.slice(0, 2), caseNo: 'x' }).screen, 'setup');
});

test('clockwise ring: each player hunts the next, three reveals each way, turns go round', () => {
  let s = bigGame(3, 'last');
  assert.deepEqual(s.targets, [1, 2, 0]);
  assert.equal(hunterOf(s, 0), 2);
  assert.equal(s.current, 0);
  s = passRound(s);
  assert.equal(s.current, 1);
  s = passRound(s);
  assert.equal(s.current, 2);
  s = passRound(s);
  assert.equal(s.current, 0);
  assert.equal(s.turn, 4);
});

test('last one standing: cracking your target knocks them out and you take their target, fresh board', () => {
  let s = bigGame(3, 'last');
  s = run(s, ...tap(ITEMS[5], ITEMS[6]), END, START); // P0 rules out two, P1's turn
  s = run(s, END, START, END, START); // back to P0
  s = run(s, ...guess(ITEMS[1])); // P0 cracks P1
  assert.equal(s.screen, 'handoff');
  assert.deepEqual(s.alive, [true, false, true]);
  assert.equal(s.targets[0], 2); // now hunting whoever P1 was hunting
  assert.deepEqual(s.boards[0], { locked: [], pending: [], wrong: [] }); // fresh
  assert.equal(s.report.kind, 'cracked');
  assert.equal(s.current, 2); // P1 is skipped
  assert.equal(aliveCount(s), 2);
  // P2 cracks P0: last one standing
  s = run(s, START, ...guess(ITEMS[0]));
  assert.equal(s.screen, 'over');
  assert.equal(s.winner, 2);
  assert.equal(s.reason, 'solved');
  assert.equal(s.scores[2], 1);
  assert.equal(s.knockouts.length, 2);
});

test('last one standing: running out puts you out and your hunter takes over your target', () => {
  let s = bigGame(3, 'last');
  // P0 rules out everything except ITEMS[0] and ITEMS[2] (P1 really holds ITEMS[1])
  const others = ITEMS.filter((id) => ![ITEMS[0], ITEMS[2], ITEMS[1]].includes(id));
  s = run(s, ...tap(...others, ITEMS[1]), END, START, END, START, END, START);
  s = run(s, ...guess(ITEMS[0])); // wrong, one left
  s = run(s, START, END, START, END, START); // back to P0, last-suspect sheet
  assert.equal(s.sheet.type, 'last');
  s = run(s, OK); // wrong again: out of suspects
  assert.deepEqual(s.alive, [false, true, true]);
  assert.equal(s.report.kind, 'out');
  assert.equal(s.report.takeover, 2); // P2 was hunting P0
  assert.equal(s.targets[2], 1); // P2 now hunts P0's target
  assert.equal(s.screen, 'handoff');
});

test('first to crack: the first crack wins outright', () => {
  let s = bigGame(4, 'first');
  s = run(s, END, START, ...guess(ITEMS[2])); // P1 cracks P2
  assert.equal(s.screen, 'over');
  assert.equal(s.winner, 1);
  assert.deepEqual(s.alive, [true, true, true, true]);
});

test('first to crack: running out skips your turns but nobody takes over; last one in wins', () => {
  let s = bigGame(3, 'first');
  const keep = [ITEMS[3], ITEMS[4]]; // P0 never keeps P1's real item
  s = run(s, ...tap(...ITEMS.filter((id) => !keep.includes(id))), END, START, END, START, END, START);
  s = run(s, ...guess(ITEMS[3]), START, END, START, END, START, OK);
  assert.deepEqual(s.alive, [false, true, true]);
  assert.deepEqual(s.targets, [1, 2, 0]); // unchanged: P2 still questions P0
  assert.equal(s.report.takeover, -1);
  assert.equal(s.current, 1);
});

test('rematch passes the first turn round the table', () => {
  let s = bigGame(3, 'last');
  s = run(s, ...guess(ITEMS[1]), START, ...guess(ITEMS[0])); // P0 out-cracked by P2
  assert.equal(s.screen, 'over');
  s = run(s, { type: 'REMATCH', secrets: ITEMS.slice(3, 6), caseNo: 'y' });
  assert.equal(s.starter, 1);
  assert.equal(s.current, 1);
  assert.deepEqual(s.alive, [true, true, true]);
});

test('restore: a v2 two-player save migrates; a 3-player game survives a refresh', () => {
  const v2 = {
    v: 2,
    state: { ...startedGame(), names: ['Ann', 'Bo'], scores: [1, 2], count: undefined, targets: undefined, alive: undefined, knockouts: undefined },
  };
  const m = restoreState(JSON.stringify(v2));
  assert.equal(m.screen, 'handoff');
  assert.equal(m.count, 2);
  assert.deepEqual(m.targets, [1, 0]);
  assert.deepEqual(m.names.slice(0, 2), ['Ann', 'Bo']);
  const big = run(bigGame(3, 'first'), ...tap(ITEMS[9]));
  const r = restoreState(serialize(big));
  assert.equal(r.count, 3);
  assert.equal(r.rules, 'first');
  assert.equal(r.screen, 'handoff');
});
