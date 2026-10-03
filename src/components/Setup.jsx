import { Search } from 'lucide-react';
import { CATEGORIES } from '../data/categories.js';
import { Scoreboard } from './shared.jsx';
import ShareButton from './ShareButton.jsx';

export default function Setup({ s, send, onDeal }) {
  const played = s.scores[0] + s.scores[1] > 0;
  return (
    <>
      <header className="masthead">
        <span className="eyebrow">Two players · one phone · pass and play</span>
        <h1>
          <span>Category</span>
          <span>Detectives</span>
        </h1>
        <p className="lede">
          Each of you is dealt a suspect from the same lineup. Ask yes/no questions,
          rule suspects out, and accuse first.
        </p>
      </header>

      <section className="section">
        <div className="section-head">
          <h2>The detectives</h2>
        </div>
        <div className="names">
          {[0, 1].map((p) => (
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
        {played && (
          <>
            <Scoreboard s={s} />
            <div>
              <button className="linkish" onClick={() => send({ type: 'RESET_SCORE' })}>
                Reset score
              </button>
            </div>
          </>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Pick the lineup</h2>
          <span className="eyebrow">Chosen together</span>
        </div>
        <div className="cats" role="radiogroup" aria-label="Category">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
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
                <p>{c.blurb}</p>
              </span>
              <span className="count">
                {c.items.length}
                <br />
                suspects
                <br />
                <span className="radio" aria-hidden="true" />
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <details className="rules">
          <summary>How a turn works</summary>
          <ol>
            <li><strong>Ask</strong> your opponent one yes/no question out loud about their secret.</li>
            <li><strong>Rule out</strong> suspects on your board, or <strong>accuse</strong> one. Never both in one turn.</li>
            <li>Rule-outs can be undone until you end your turn. After that they're locked.</li>
            <li>Rule out all but one, end your turn, and accuse that last suspect on your next turn.</li>
            <li>A wrong accusation rules that suspect out and ends your turn. Run out of suspects and you lose.</li>
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
        <button className="btn btn-primary btn-block" onClick={onDeal}>
          <Search className="ico" aria-hidden="true" /> Deal suspects
        </button>
      </div>
    </>
  );
}
