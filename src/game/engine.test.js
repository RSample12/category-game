import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialState, reducer, remainingIds, dealSecrets, restoreState, serialize,
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
  assert.deepEqual(s.scores, [1, 0]);
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
  assert.deepEqual(s.scores, [0, 1]);
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
  assert.deepEqual(s.scores, [1, 0]);
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

  const showing = { ...createInitialState(), screen: 'reveal', revealStep: 3, secrets: [ITEMS[0], ITEMS[1]] };
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
  assert.deepEqual(s.secrets, [null, null]);
  assert.deepEqual(s.boards[0], { locked: [], pending: [], wrong: [] });
  assert.deepEqual(s.names, ['Ann', 'Bo']);
  assert.deepEqual(s.scores, [2, 1]);
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
