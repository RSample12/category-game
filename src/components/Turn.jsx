import { useEffect, useRef } from 'react';
import { Stamp, Crosshair, Lock } from 'lucide-react';
import { getCategory, getItem } from '../data/categories.js';
import { remainingIds } from '../game/engine.js';
import { cx, nameOf, pad } from './shared.jsx';

function Sheet({ s, send }) {
  const ref = useRef(null);
  const confirmRef = useRef(null);
  const item = getItem(s.categoryId, s.sheet.itemId);
  const opp = nameOf(s, 1 - s.current);
  const isLast = s.sheet.type === 'last';

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
        <span className="eyebrow">{isLast ? 'One suspect left' : 'Final answer'}</span>
        <h3 id="sheet-title">
          Accuse <em>{item.name}</em>?
        </h3>
        <p>
          {isLast
            ? `That's the only one you haven't ruled out, so it's your accusation. If ${opp} isn't holding it, you lose.`
            : 'Right and you win the case. Wrong and it’s ruled out and your turn ends.'}
        </p>
        <div className="row">
          <button className="btn btn-ghost" onClick={() => send({ type: 'SHEET_CANCEL' })}>
            {isLast ? (s.sheet.undo ? 'Undo last' : 'Not yet') : 'Cancel'}
          </button>
          <button className="btn btn-danger" ref={confirmRef} onClick={() => send({ type: 'SHEET_CONFIRM' })}>
            Accuse
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Turn({ s, send }) {
  const barRef = useRef(null);
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
  const opp = nameOf(s, 1 - p);

  let tip;
  if (guessing) {
    tip = <>Tap the suspect you think <b>{opp}</b> is holding.</>;
  } else if (pend && left === 1) {
    tip = <>One suspect left. End your turn, then you can accuse it next turn.</>;
  } else if (pend) {
    tip = <>Tap a stamped suspect again to undo. Locks when you end your turn. <b>Accuse unlocks next turn.</b></>;
  } else {
    tip = <>Ask {opp} a yes/no question, then rule suspects out.</>;
  }

  return (
    <div className={`p${p} ${guessing ? 'mode-guess' : ''}`}>
      <div className="turnbar" ref={barRef}>
        <div className="turnrow">
          <h1 className="sr-only">Crack the Case, turn {s.turn}</h1>
          <h2>{nameOf(s, p)}</h2>
          <span className="meter">
            <b>{left}</b>
            <span className="tot"> / {cat.items.length}</span> left · T{s.turn}
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
            <Crosshair className="ico" aria-hidden="true" /> Accuse
          </button>
        </div>
        <p className="tip">{tip}</p>
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
            <button className="btn btn-primary btn-block" onClick={() => send({ type: 'END_TURN' })}>
              <Lock className="ico" aria-hidden="true" /> {pend ? `Lock ${pend} and end turn` : 'End turn'}
            </button>
          )}
        </div>
      </div>

      {s.sheet && <Sheet s={s} send={send} />}
    </div>
  );
}
