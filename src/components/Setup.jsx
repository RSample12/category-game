import { useCallback, useEffect, useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { GROUPS, getCategory } from '../data/categories.js';
import PlayersSheet from './PlayersSheet.jsx';
import ShareButton from './ShareButton.jsx';

/* A hanging brass desk lamp, drawn flat to match the night-desk look. Decorative only. */
function Lamp() {
  return (
    <>
      <svg className="lamp" viewBox="0 0 64 156" width="64" height="156" aria-hidden="true" focusable="false">
        <line x1="32" y1="0" x2="32" y2="100" stroke="var(--line)" strokeWidth="2.5" />
        <rect x="27" y="96" width="10" height="9" rx="2" fill="var(--p1)" />
        <path d="M32 104 C16 104 8 118 5 134 L59 134 C56 118 48 104 32 104 Z" fill="var(--p1)" />
        <path d="M32 104 C24 104 18 108 14 114 C22 111 32 110 32 110 Z" fill="#fff" opacity=".22" />
        <path d="M59 134 C56 118 48 104 32 104 C44 108 50 118 52 134 Z" fill="#000" opacity=".16" />
        <rect x="3" y="132" width="58" height="5" rx="2.5" fill="#b98c2c" />
        <path d="M18 137 L46 137 A14 9 0 0 1 18 137 Z" fill="#fff6d6" />
      </svg>
    </>
  );
}

/* The lamp's glow is painted on the page background, so switch it on while this screen is showing. */
function useLampGlow() {
  useEffect(() => {
    document.body.classList.add('lamp-lit');
    return () => document.body.classList.remove('lamp-lit');
  }, []);
}

export default function Setup({ s, send, onDeal }) {
  useLampGlow();
  const chosen = getCategory(s.categoryId);
  // One theme group open at a time; the one holding the chosen lineup starts open.
  const [openGroup, setOpenGroup] = useState(chosen?.group ?? null);
  const toggleGroup = (id) => {
    const next = openGroup === id ? null : id;
    setOpenGroup(next);
    // Closing a group above can slide the tapped header upward; once the motion settles, keep it in view.
    setTimeout(() => {
      document.getElementById(`group-${id}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 340);
  };
  // Player count, names and rules live in the "Who's playing?" panel opened by Play.
  const [picking, setPicking] = useState(false);
  const closePicking = useCallback(() => setPicking(false), []);
  return (
    <>
      <header className="masthead">
        <Lamp />
        <span className="eyebrow">2–4 players · one phone · pass and play</span>
        <h1>
          <span>Crack</span>
          <span>the Case</span>
        </h1>
        <p className="lede">
          Each of you is dealt a suspect from the same lineup. Ask yes/no questions,
          rule suspects out, and accuse first.
        </p>
      </header>

      <section className="section">
        <div className="section-head">
          <h2>Pick the lineup</h2>
        </div>
        <div className="lineup-groups">
          {GROUPS.map((g) => {
            const open = openGroup === g.id;
            const picked = g.id === chosen?.group;
            return (
              <div className={`lineup-group${open ? ' open' : ''}`} key={g.id}>
                <button
                  type="button"
                  id={`group-${g.id}`}
                  className={`group-head${picked ? ' picked' : ''}`}
                  aria-expanded={open}
                  aria-controls={`panel-${g.id}`}
                  onClick={() => toggleGroup(g.id)}
                >
                  <span className="gname">{g.name}</span>
                  {/* Closed: the chosen lineup's name if it lives here, otherwise a peek at the tabs inside. */}
                  {picked && !open ? (
                    <span className="gpick">{chosen.name}</span>
                  ) : (
                    <span className="gtabs" aria-hidden="true">
                      {g.categories.map((c) => (
                        <span key={c.id}>{c.name[0]}</span>
                      ))}
                    </span>
                  )}
                  <ChevronDown className="ico chev" aria-hidden="true" />
                </button>
                {/* Always rendered so it can slide open and shut; inert while closed. */}
                <div
                  className="group-panel"
                  id={`panel-${g.id}`}
                  aria-hidden={!open}
                  ref={(el) => {
                    if (el) el.inert = !open; // keeps closed tiles out of Tab order (React 18 drops the attribute)
                  }}
                >
                  <div className="group-panel-inner">
                    <div className="cats lineup" role="radiogroup" aria-labelledby={`group-${g.id}`}>
                      {g.categories.map((c) => (
                        <button
                          key={c.id}
                          id={`cat-${c.id}`}
                          className="cat"
                          role="radio"
                          aria-checked={c.id === s.categoryId}
                          onClick={() => send({ type: 'SET_CATEGORY', id: c.id })}
                        >
                          <span className="tab">
                            <b>{c.name[0]}</b>
                          </span>
                          <span style={{ minWidth: 0 }}>
                            <h3>{c.name}</h3>
                            {/* Only the chosen lineup shows its description, to keep the list compact. */}
                            {c.id === s.categoryId && <p>{c.blurb}</p>}
                          </span>
                          <span className="radio" aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="section">
        <details className="rules">
          <summary>How a turn works</summary>
          <ol>
            <li><strong>Ask</strong> your opponent one yes/no question out loud about their secret.</li>
            {s.count > 2 && (
              <li>With 3 or 4 detectives, your opponent is the next one in the list. The app always says who you’re questioning.</li>
            )}
            <li><strong>Rule out</strong> suspects on your board, or <strong>accuse</strong> one. Never both in one turn.</li>
            <li>Rule-outs can be undone until you end your turn. After that they're locked.</li>
            <li>Rule out all but one, end your turn, and accuse that last suspect on your next turn.</li>
            <li>A wrong accusation rules that suspect out and ends your turn. Run out of suspects and you {s.count > 2 ? 'are out' : 'lose'}.</li>
          </ol>
        </details>
        <div className="share-row"><ShareButton where="setup" className="btn btn-ghost btn-block" /></div>
        <p className="site-links">
          <a href="/about">About</a>
          <span aria-hidden="true"> · </span>
          <a href="/privacy">Privacy</a>
        </p>
      </section>

      <div className="cta">
        <button className="btn btn-primary btn-block" onClick={() => setPicking(true)}>
          <Search className="ico" aria-hidden="true" /> Play · {chosen?.name}
        </button>
      </div>
      {picking && (
        <PlayersSheet s={s} send={send} categoryName={chosen?.name} onClose={closePicking} onDeal={onDeal} />
      )}
    </>
  );
}
