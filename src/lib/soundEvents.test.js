import test from 'node:test';
import assert from 'node:assert/strict';
import { soundFor } from './soundEvents.js';
import { SOUNDS } from './sound.js';
import { createInitialState, reducer } from '../game/engine.js';
import { getCategory } from '../data/categories.js';

const IDS = getCategory('dogs').items.map((i) => i.id);
const step = (s, a) => [s, reducer(s, a)];
const run = (s, ...as) => as.reduce(reducer, s);
const started = () =>
  run(
    createInitialState(),
    { type: 'DEAL', secrets: [IDS[0], IDS[1]], caseNo: 'x' },
    { type: 'DEAL_DONE' },
    ...Array(4).fill({ type: 'REVEAL_NEXT' }),
    { type: 'START_TURN' },
  );

test('every mapped sound exists and every voice is well-formed', () => {
  const names = Object.keys(SOUNDS);
  for (const [name, voices] of Object.entries(SOUNDS)) {
    assert.ok(voices.length > 0, name);
    for (const v of voices) {
      assert.ok(['tone', 'noise'].includes(v.kind), name);
      assert.ok(v.at >= 0 && v.dur > 0 && v.dur < 2, `${name} timing`);
      assert.ok(v.gain > 0 && v.gain <= 1, `${name} gain`);
      if (v.kind === 'tone') assert.ok(v.freq > 20 && v.freq < 5000, `${name} freq`);
    }
  }
  for (const n of ['stamp', 'undo', 'sheet', 'flip', 'select', 'shuffle', 'handoff', 'wrong', 'win', 'lose'])
    assert.ok(names.includes(n), n);
});

test('no sound on first render, or when nothing changed', () => {
  const s = started();
  assert.equal(soundFor(null, s), null);
  assert.equal(soundFor(s, s), null);
});

test('deal → shuffle, reveal steps → flip, reveal done → handoff chime', () => {
  const init = createInitialState();
  const [a, b] = step(init, { type: 'DEAL', secrets: [IDS[0], IDS[1]], caseNo: 'x' });
  assert.equal(soundFor(a, b), 'shuffle');
  const c = reducer(b, { type: 'DEAL_DONE' });
  assert.equal(soundFor(b, c), null);
  const d = reducer(c, { type: 'REVEAL_NEXT' });
  assert.equal(soundFor(c, d), 'flip');
  const e = run(d, { type: 'REVEAL_NEXT' }, { type: 'REVEAL_NEXT' }, { type: 'REVEAL_NEXT' });
  assert.equal(soundFor(run(d, { type: 'REVEAL_NEXT' }, { type: 'REVEAL_NEXT' }), e), 'handoff');
});

test('stamp on rule-out, undo on taking it back, sheet when accusing', () => {
  const t = started();
  const [, stamped] = step(t, { type: 'TAP_ITEM', id: IDS[3] });
  assert.equal(soundFor(t, stamped), 'stamp');
  const undone = reducer(stamped, { type: 'TAP_ITEM', id: IDS[3] });
  assert.equal(soundFor(stamped, undone), 'undo');
  const g = reducer(t, { type: 'SET_MODE', mode: 'guess' });
  const sheet = reducer(g, { type: 'TAP_ITEM', id: IDS[3] });
  assert.equal(soundFor(g, sheet), 'sheet');
});

test('ending a turn → handoff chime; wrong accusation → buzzer', () => {
  const t = started();
  const ended = reducer(t, { type: 'END_TURN' });
  assert.equal(soundFor(t, ended), 'handoff');
  const g = reducer(t, { type: 'SET_MODE', mode: 'guess' });
  const sheet = reducer(g, { type: 'TAP_ITEM', id: IDS[7] });
  const wrong = reducer(sheet, { type: 'SHEET_CONFIRM' });
  assert.equal(soundFor(sheet, wrong), 'wrong');
});

test('correct accusation → win; running out of suspects → lose', () => {
  const t = started();
  const g = reducer(t, { type: 'SET_MODE', mode: 'guess' });
  const sheet = reducer(g, { type: 'TAP_ITEM', id: IDS[1] });
  assert.equal(soundFor(sheet, reducer(sheet, { type: 'SHEET_CONFIRM' })), 'win');

  // Ruling out down to one item, then playing it as the accusation on the next turn.
  const last = run(
    t,
    ...IDS.filter((id) => id !== IDS[5]).map((id) => ({ type: 'TAP_ITEM', id })),
    { type: 'END_TURN' }, { type: 'START_TURN' }, { type: 'END_TURN' }, { type: 'START_TURN' },
  );
  assert.equal(last.sheet.type, 'last');
  assert.equal(soundFor(last, reducer(last, { type: 'SHEET_CONFIRM' })), 'lose');
});
