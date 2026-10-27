import { useEffect, useRef, useState } from 'react';
import { Stamp, Crosshair, Lock } from 'lucide-react';
import { getCategory, getItem } from '../data/categories.js';
import { remainingIds } from '../game/engine.js';
import { cx, nameOf, pad } from './shared.jsx';
import PeekButton from './PeekButton.jsx';
import { play } from '../lib/sound.js';
import { buzz } from '../lib/haptics.js';

const clock = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

/**
 * The turn timer: a bar in the player's colour that drains from the moment they start
 * their turn. Red for the last ten seconds, a soft tick and buzz for the last five; at
 * zero it calls onUp (the turn ends, anything ruled out is kept). No pause.
 */
function TurnTimer({ seconds, started, onUp }) {
  const total = seconds * 1000;
  const [now, setNow] = useState(() => Date.now());
  const ticked = useRef(null);
  const done = useRef(false);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, []);
  const leftMs = Math.max(0, total - (now - started));
  const secs = Math.ceil(leftMs / 1000);
  useEffect(() => {
    if (secs > 0 && secs <= 5 && ticked.current !== secs) {
      ticked.current = secs;
      play('tick');
      buzz(10);
    }
    if (leftMs === 0 && !done.current) {
      done.current = true;
      buzz([20, 40, 20]);
      onUp();
    }
  }, [secs, leftMs, onUp]);
  const low = secs <= 10;
  return (
    <div className={cx('timer', low && 'low', secs <= 5 && 'last')}>
      <div className="timer-track" aria-hidden="true">
        <div className="timer-fill" style={{ transform: `scaleX(${leftMs / total})` }} />
      </div>
      <span className="timer-s" key={low ? secs : 'calm'} aria-hidden="true">
        {clock(secs)}
      </span>
      {/* Screen readers hear the time only at the moments that matter, not every second. */}
      <span className="sr-only" role="status">
        {secs === 10 ? '10 seconds left' : secs === 0 ? "Time's up" : ''}
      </span>
    </div>
  );
}

function Sheet({ s, send }) {
  const ref = useRef(null);
  const confirmRef = useRef(null);
  const item = getItem(s.categoryId, s.sheet.itemId);
  const opp = nameOf(s, s.targets[s.current]);
  const isLast = s.sheet.type === 'last';
  const multi = s.count > 2;
  // What a correct accusation does depends on the rules and how many are still in.
  const right =
    multi && s.rules === 'last' && s.alive.filter(Boolean).length > 2
      ? `Right and ${opp} is out, and you take over their target.`
      : 'Right and you win.';

  // Focus the primary action, trap Tab inside, close on Escape, restore focus after.
  useEffect(() => {
    const previous = document.activeElement;
    confirmRef.current?.focus({ preventScroll: true });
    const onKey = (e) => {
      if (e.key === 'Escape') {
        send({ type: 'SHEET_CANCEL' });
      } else if (e.key === 'Tab') {
        const buttons = ref.current?.querySelectorAll('button');
        if (!buttons?.length) return;
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.({ preventScroll: true });
    };
  }, [send]);

  return (
    <div className={`scrim p${s.current}`}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" ref={ref}>
        <span className="eyebrow">{isLast ? 'One card left' : 'Final answer'}</span>
        <h3 id="sheet-title">
          Guess <em>{item.name}</em>?
        </h3>
        <p>
          {isLast
            ? `That's the only one you haven't ruled out, so it's your guess. If ${opp} isn't holding it, you ${multi ? 'are out' : 'lose'}.`
            : `${right} Wrong and it’s ruled out and your turn ends.`}
        </p>
        <div className="row">
          <button className="btn btn-ghost" onClick={() => send({ type: 'SHEET_CANCEL' })}>
            {isLast ? (s.sheet.undo ? 'Undo last' : 'Not yet') : 'Cancel'}
          </button>
          <button className="btn btn-danger" ref={confirmRef} onClick={() => send({ type: 'SHEET_CONFIRM' })}>
            Guess
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Turn({ s, send }) {
  const barRef = useRef(null);
  // Each turn mounts this screen fresh, so this is when "Start my turn" was tapped.
  const [started] = useState(() => Date.now());
  const endTurn = () => send({ type: 'END_TURN', ms: Date.now() - started });
  const timeUp = useRef(() => send({ type: 'TIME_UP' })).current;
  // Keep keyboard focus out from under the sticky turn bar: publish its height so
  // cards scroll into view below it (WCAG 2.4.11). Changes scrolling only, not appearance.
  useEffect(() => {
    const el = barRef.current;
    if (!el) return undefined;
    const root = document.documentElement;
    const set = () => {
      root.style.scrollPaddingTop = `${el.offsetHeight + 12}px`;
      root.style.scrollPaddingBottom = '104px'; // sticky End turn button
    };
    set();
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(set);
    ro?.observe(el);
    return () => {
      ro?.disconnect();
      root.style.scrollPaddingTop = '';
      root.style.scrollPaddingBottom = '';
    };
  }, []);

  const p = s.current;
  const b = s.boards[p];
  const cat = getCategory(s.categoryId);
  const guessing = s.mode === 'guess';
  const pend = b.pending.length;
  const left = remainingIds(s, p).length;
  const tgt = s.targets[p];
  const opp = nameOf(s, tgt);

  let tip;
  if (guessing) {
    tip = <>Tap the card you think <b>{opp}</b> picked.</>;
  } else if (pend && left === 1) {
    tip = <>One card left. End your turn, then you can guess it next turn.</>;
  } else if (pend) {
    tip = <>Tap a stamped card again to undo. Locks when you end your turn. <b>Guess unlocks next turn.</b></>;
  } else {
    // Before anything is ruled out, the tip line becomes the answerer's peek button,
    // so the player being questioned can re-check their suspect before answering.
    tip = null;
  }

  return (
    <div className={`p${p} ${guessing ? 'mode-guess' : ''}`}>
      <div className="turnbar" ref={barRef}>
        {s.timer > 0 && <TurnTimer seconds={s.timer} started={started} onUp={timeUp} />}
        <div className="turnrow">
          <h1 className="sr-only">Guesswork, turn {s.turn}</h1>
          <h2>{nameOf(s, p)}</h2>
          <span className="meter">
            <b>{left}</b>
            <span className="tot"> / {cat.items.length}</span> left · Turn {s.turn}
          </span>
        </div>
        <div className="seg" role="group" aria-label="Action">
          <button aria-pressed={!guessing} onClick={() => send({ type: 'SET_MODE', mode: 'elim' })}>
            <Stamp className="ico" aria-hidden="true" /> Rule out
          </button>
          <button
            aria-pressed={guessing}
            disabled={pend > 0}
            onClick={() => send({ type: 'SET_MODE', mode: 'guess' })}
          >
            <Crosshair className="ico" aria-hidden="true" /> Guess
          </button>
        </div>
        {tip ? (
          <p className="tip">{tip}</p>
        ) : (
          <PeekButton
            className={`peek-tip p${tgt}`}
            secretName={getItem(s.categoryId, s.secrets[tgt])?.name}
            label={`${opp}: hold to peek`}
            owner={`${opp}'s secret`}
            ariaLabel={`${opp}: hold to peek at your secret. ${s.count > 2 ? 'Everyone else' : nameOf(s, p)}, look away.`}
          />
        )}
        {!tip && <p className="tip">Ask {opp} a yes/no question.</p>}
      </div>

      <div className="board">
        {cat.items.map((it, i) => {
          const locked = b.locked.includes(it.id);
          const pending = b.pending.includes(it.id);
          const stamp = locked ? (b.wrong.includes(it.id) ? 'Wrong' : 'Ruled out') : pending ? 'Ruled out' : '';
          const label = `${it.name}${locked ? ', ruled out' : pending ? ', ruled out this turn, tap to undo' : ''}`;
          return (
            <button
              key={it.id}
              className={cx('tag', locked && 'locked', pending && 'pending', s.justId === it.id && 'just')}
              style={{ '--i': i }}
              disabled={locked}
              aria-label={label}
              onClick={() => send({ type: 'TAP_ITEM', id: it.id })}
            >
              <span className="no">{pad(i + 1)}</span>
              <span className="nm">{it.name}</span>
              {stamp && (
                <span className="st">
                  <span>{stamp}</span>
                </span>
              )}
              {pending && <span className="undo">Undo</span>}
            </button>
          );
        })}
      </div>

      <div className="actionbar">
        <div className="in">
          {guessing ? (
            <button className="btn btn-ghost btn-block" onClick={() => send({ type: 'SET_MODE', mode: 'elim' })}>
              Back to ruling out
            </button>
          ) : (
            <button className="btn btn-primary btn-block" onClick={endTurn}>
              <Lock className="ico" aria-hidden="true" /> {pend ? `Lock ${pend} and end turn` : 'End turn'}
            </button>
          )}
        </div>
      </div>

      {s.sheet && <Sheet s={s} send={send} />}
    </div>
  );
}
