import { useCallback, useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { GROUPS, getCategory } from '../data/categories.js';
import PlayersSheet from './PlayersSheet.jsx';
import LineupRoom from './LineupRoom.jsx';
import { pad } from './shared.jsx';
import ShareButton from './ShareButton.jsx';

/** A case number like the one on the dealing screen. */
const newCaseNo = () =>
  `${String(new Date().getFullYear()).slice(2)}-${1000 + Math.floor(Math.random() * 9000)}`;

export default function Setup({ s, send, onDeal }) {
  // One case number per visit: shown on the placard, the briefing sheet and the dealing screen.
  const [caseNo] = useState(newCaseNo);
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
      <header className="masthead lineup-masthead">
        <LineupRoom caseNo={caseNo} />
        <div className="intro">
          <div className="chips">
            <span className="chip">2–4 detectives</span>
            <span className="chip">one phone</span>
            <span className="chip">pass &amp; play</span>
          </div>
          <p className="lede">
            Everyone is secretly holding a suspect.{' '}
            <b>Ask yes/no questions, rule them out, and name yours first.</b>
          </p>
        </div>
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
                  {/* A closed group still shows the chosen lineup's name if it lives here. */}
                  {picked && !open && <span className="gpick">{chosen.name}</span>}
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
                      {/* Evidence-tag cards, all the same size, like the suspect cards in a game. */}
                      {g.categories.map((c, i) => (
                        <button
                          key={c.id}
                          id={`cat-${c.id}`}
                          className="case-card"
                          role="radio"
                          aria-checked={c.id === s.categoryId}
                          onClick={() => send({ type: 'SET_CATEGORY', id: c.id })}
                        >
                          <span className="no" aria-hidden="true">Nº {pad(i + 1)}</span>
                          <h3>{c.name}</h3>
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
        <PlayersSheet s={s} send={send} caseNo={caseNo} categoryName={chosen?.name} onClose={closePicking} onDeal={onDeal} />
      )}
    </>
  );
}
