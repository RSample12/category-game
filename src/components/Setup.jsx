import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { GROUPS, getCategory } from '../data/categories.js';
import PlayersSheet from './PlayersSheet.jsx';
import { pad } from './shared.jsx';
import ShareButton from './ShareButton.jsx';

/**
 * Sizes the title lockup so GUESSWORK spans the column exactly. Every part of the lockup is
 * sized from one unit (--u), so measuring the title once and scaling the unit keeps the title,
 * tagline and card fan in proportion whatever font the phone renders.
 */
function useFitLockup(ref) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const BASE = 5;
    const fit = () => {
      const h1 = el.querySelector('h1');
      // 16px page gutters; the title fills 88% of the column so it sits a little smaller.
      const avail = (Math.min(document.documentElement.clientWidth, 760) - 32) * 0.88;
      el.style.setProperty('--u', `${BASE}px`);
      const w = h1.scrollWidth;
      if (!w) return;
      const u = Math.min(6, (BASE * avail) / w);
      el.style.setProperty('--u', `${u.toFixed(3)}px`);
    };
    fit();
    document.fonts?.ready?.then(fit);
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [ref]);
}

export default function Setup({ s, send, onDeal }) {
  const lockupRef = useRef(null);
  useFitLockup(lockupRef);
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
        <span className="eyebrow">2–4 players · one phone · pass and play</span>
        {/* Title, tagline and card fan form one lockup: the block is exactly as wide as the
            title, the tagline starts under the G and the fan ends under the K. */}
        <div className="lockup" ref={lockupRef}>
          <h1>
            <span>Guess</span><span>work</span>
          </h1>
          <div className="hero-row">
            <p className="lede tagline">
              <span>Everyone’s got a secret.</span> <b>Guess theirs first.</b>
            </p>
            {/* The same fan of suspect cards as the share image. Decorative. */}
            <div className="hero-fan" aria-hidden="true">
              <span className="hf-card hf-1">
                <b>Poodle</b>
                <i className="hf-stamp">Ruled out</i>
              </span>
              <span className="hf-card hf-2">
                <b>Pug</b>
              </span>
              <span className="hf-card hf-3">?</span>
            </div>
          </div>
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
        <PlayersSheet s={s} send={send} categoryName={chosen?.name} onClose={closePicking} onDeal={onDeal} />
      )}
    </>
  );
}
