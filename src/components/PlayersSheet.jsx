import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { nameOf, playersOf } from './shared.jsx';

const COUNTS = [
  { n: 2, label: 'Duel' },
  { n: 3, label: 'Three-way' },
  { n: 4, label: 'Full table' },
];

const RULE_OPTIONS = [
  { id: 'last', name: 'Last one standing', blurb: 'Solve your target to knock them out. Take over their target.' },
  { id: 'first', name: 'First to solve', blurb: 'The first correct accusation wins the case.' },
];

/** A case number like the one on the dealing screen, picked when the briefing opens. */
const newCaseNo = () =>
  `${String(new Date().getFullYear()).slice(2)}-${1000 + Math.floor(Math.random() * 9000)}`;

/** Height-animated show/hide (grid rows 0fr -> 1fr). Closed content is inert: no Tab, no screen reader. */
function Collapse({ open, children, tight = false }) {
  return (
    <div
      className={`collapse${tight ? ' tight' : ''}${open ? ' open' : ''}`}
      aria-hidden={!open}
      ref={(el) => {
        if (el) el.inert = !open;
      }}
    >
      <div className="collapse-in">{children}</div>
    </div>
  );
}

/** One detective's ID badge; the name is typed straight onto the card. */
function Badge({ s, send, p, hidden = false }) {
  return (
    <label
      className={`badge p${p}${hidden ? ' badge-off' : ''}`}
      aria-hidden={hidden || undefined}
      ref={(el) => {
        if (el) el.inert = hidden;
      }}
    >
      <span className="k">Detective {String(p + 1).padStart(2, '0')}</span>
      <input
        id={`name-${p}`}
        maxLength={14}
        autoComplete="off"
        placeholder={`Player ${p + 1}`}
        value={s.names[p]}
        onChange={(e) => send({ type: 'SET_NAME', index: p, value: e.target.value })}
      />
    </label>
  );
}

/**
 * "Assemble your detectives": opens from the setup screen's Play button. Everything here is
 * cardstock, like the lineup and the suspect cards: pick how many detectives, write each name
 * on an ID badge, and (for 3-4) choose how the case ends.
 */
export default function PlayersSheet({ s, send, categoryName, onClose, onDeal }) {
  const ref = useRef(null);
  const [caseNo] = useState(newCaseNo);
  const multi = s.count > 2;
  const players = playersOf(s);

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
        className="sheet brief"
        role="dialog"
        aria-modal="true"
        aria-labelledby="brief-title"
        tabIndex={-1}
        ref={ref}
      >
        <div className="brief-head">
          <span className="eyebrow">
            Case Nº {caseNo} · {categoryName}
          </span>
          <h3 id="brief-title">Assemble your detectives</h3>
        </div>

        <div className="brief-block">
          <span className="eyebrow" id="count-label">Detectives</span>
          <div className="count-tags" role="radiogroup" aria-labelledby="count-label">
            {COUNTS.map((c) => (
              <button
                key={c.n}
                type="button"
                className="paper-pick count-tag"
                role="radio"
                aria-checked={s.count === c.n}
                aria-label={`${c.n} detectives, ${c.label}`}
                onClick={() => send({ type: 'SET_PLAYERS', count: c.n })}
              >
                <b>{c.n}</b>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="badges">
          {[0, 1].map((p) => (
            <Badge key={p} s={s} send={send} p={p} />
          ))}
        </div>
        {/* Detectives 3-4 and the 3-4 player rules slide open and shut, so the sheet grows and
            shrinks smoothly instead of jumping. */}
        <Collapse open={multi} tight>
          <div className="badges">
            <Badge s={s} send={send} p={2} />
            <Badge s={s} send={send} p={3} hidden={s.count < 4} />
          </div>
        </Collapse>

        <Collapse open={multi}>
          <div className="brief-more">
            <div className="brief-block">
              <span className="eyebrow" id="ends-label">How it ends</span>
              <div className="rule-cards" role="radiogroup" aria-labelledby="ends-label">
                {RULE_OPTIONS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className="paper-pick rule-card"
                    role="radio"
                    aria-checked={s.rules === r.id}
                    onClick={() => send({ type: 'SET_RULES', rules: r.id })}
                  >
                    <span className="t">{r.name}</span>
                    <span className="d">{r.blurb}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="brief-block">
              <span className="eyebrow" id="ring-label">Who questions who</span>
              <p className="chain" aria-labelledby="ring-label">
                {[...players, players[0]].map((p, i) => (
                  <span key={i}>
                    {i > 0 && (
                      <span className="ar" aria-hidden="true">
                        {' '}→{' '}
                      </span>
                    )}
                    <b className={`p${p}`}>{nameOf(s, p)}</b>
                  </span>
                ))}
              </p>
            </div>
          </div>
        </Collapse>

        <div className="row">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Back
          </button>
          <button type="button" className="btn btn-primary" onClick={() => onDeal(caseNo)}>
            <Search className="ico" aria-hidden="true" /> Deal {s.count} suspects
          </button>
        </div>
      </div>
    </div>
  );
}
