import { useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { playersOf } from './shared.jsx';

const RULE_OPTIONS = [
  {
    id: 'last',
    name: 'Last one standing',
    blurb: 'Solve your target’s suspect to knock them out, then hunt whoever they were hunting. The last detective left wins.',
  },
  {
    id: 'first',
    name: 'First to solve',
    blurb: 'The first detective to solve their target’s suspect wins. Run out of suspects and you’re out, but you still answer.',
  },
];

/**
 * "Who's playing?" — opens from the setup screen's Play button. Holds every game-setup
 * switch (two players / multiplayer, how many, names, how it ends) so the main screen
 * stays a clean title + lineup.
 */
export default function PlayersSheet({ s, send, categoryName, onClose, onDeal }) {
  const ref = useRef(null);
  const multi = s.count > 2;
  // Switching back to Multiplayer returns to the last group size used (3 or 4).
  const lastMulti = useRef(multi ? s.count : 3);
  const setCount = (n) => {
    if (n > 2) lastMulti.current = n;
    send({ type: 'SET_PLAYERS', count: n });
  };

  // Focus the panel (not a text box, so the phone keyboard doesn't jump up), trap Tab,
  // close on Escape, stop the page behind from scrolling, restore focus after.
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.focus({ preventScroll: true });
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Tab') {
        const els = ref.current?.querySelectorAll('button,input');
        if (!els?.length) return;
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) {
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
      document.body.style.overflow = overflow;
      previous?.focus?.({ preventScroll: true });
    };
  }, [onClose]);

  return (
    <div className="scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="sheet players-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="players-title"
        tabIndex={-1}
        ref={ref}
      >
        <div className="ps-head">
          <span className="eyebrow">{categoryName}</span>
          <h3 id="players-title">Who’s playing?</h3>
        </div>

        <div className="seg p0" role="group" aria-label="Game type">
          <button type="button" aria-pressed={!multi} onClick={() => setCount(2)}>
            Two players
          </button>
          <button type="button" aria-pressed={multi} onClick={() => setCount(Math.max(3, lastMulti.current))}>
            Multiplayer
          </button>
        </div>

        {multi && (
          <div className="ps-block">
            <span className="eyebrow" id="howmany-label">How many detectives?</span>
            <div className="seg p0" role="group" aria-labelledby="howmany-label">
              {[3, 4].map((n) => (
                <button type="button" key={n} aria-pressed={s.count === n} onClick={() => setCount(n)}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="names">
          {playersOf(s).map((p) => (
            <div className={`field p${p}`} key={p}>
              <label htmlFor={`name-${p}`}>Detective {p + 1}</label>
              <input
                id={`name-${p}`}
                maxLength={14}
                autoComplete="off"
                placeholder={`Player ${p + 1}`}
                value={s.names[p]}
                onChange={(e) => send({ type: 'SET_NAME', index: p, value: e.target.value })}
              />
            </div>
          ))}
        </div>

        {multi && (
          <div className="ps-block">
            <span className="eyebrow" id="ends-label">How it ends</span>
            <div className="seg p0" role="radiogroup" aria-labelledby="ends-label">
              {RULE_OPTIONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  role="radio"
                  aria-checked={s.rules === r.id}
                  aria-describedby={s.rules === r.id ? 'rule-desc' : undefined}
                  onClick={() => send({ type: 'SET_RULES', rules: r.id })}
                >
                  {r.name}
                </button>
              ))}
            </div>
            {/* Only the chosen rule is described, like the lineup tiles. */}
            <p className="rule-desc" id="rule-desc">
              {RULE_OPTIONS.find((r) => r.id === s.rules)?.blurb} Each detective questions the next one in
              the list.
            </p>
          </div>
        )}

        <div className="row">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Back
          </button>
          <button type="button" className="btn btn-primary" onClick={onDeal}>
            <Search className="ico" aria-hidden="true" /> Deal suspects
          </button>
        </div>
      </div>
    </div>
  );
}
