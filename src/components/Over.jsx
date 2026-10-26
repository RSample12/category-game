import { RotateCcw, LayoutGrid } from 'lucide-react';
import { getCategory, getItem } from '../data/categories.js';
import { nameOf, playersOf } from './shared.jsx';
import ShareButton from './ShareButton.jsx';

/** One line per knockout, in order: how the case unfolded. */
function Story({ s }) {
  if (s.count <= 2 || s.knockouts.length === 0) return null;
  return (
    <ol className="story" aria-label="How it unfolded">
      {s.knockouts.map((k, i) => (
        <li key={i}>
          <span className="t">Turn {k.turn}</span>
          {k.how === 'cracked' ? (
            <span>
              <b className={`p${k.by}`}>{nameOf(s, k.by)}</b> knocked out <b className={`p${k.out}`}>{nameOf(s, k.out)}</b>
            </span>
          ) : (
            <span>
              <b className={`p${k.out}`}>{nameOf(s, k.out)}</b> ran out of cards
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

export default function Over({ s, send, onRematch }) {
  const w = s.winner;
  const solved = s.reason === 'solved';
  const accused = getItem(s.categoryId, s.lastAccused)?.name ?? '';
  const loser = s.knockouts.length ? s.knockouts[s.knockouts.length - 1].out : 1 - w;
  let line;
  if (solved) {
    line = `${nameOf(s, w)} guessed ${accused}.`;
    if (s.count > 2 && s.rules === 'last') line = `${nameOf(s, w)} guessed ${accused} and is the last one standing.`;
  } else if (s.count > 2) {
    line = `${nameOf(s, loser)} guessed ${accused}, their last card, and it was wrong. ${nameOf(s, w)} is the last one left.`;
  } else {
    line = `${nameOf(s, loser)} guessed ${accused}, their last card, and it was wrong. ${nameOf(s, w)} wins by default.`;
  }

  return (
    <div className={`stage p${w} shake`}>
      <span className={`slam${solved ? '' : ' loss'}`}>{solved ? 'Got it!' : 'Out of cards'}</span>
      <h1>
        <span className="who-big" style={{ '--fit': Math.min(1, 9 / Math.max(nameOf(s, w).length, 1)) }}>{nameOf(s, w)}</span> wins
      </h1>
      <p className="lede">{line}</p>
      <Story s={s} />
      <div className="secrets">
        {playersOf(s).map((p) => (
          <div className={`mini p${p}`} key={p}>
            <span className="k">{nameOf(s, p)} picked</span>
            <span className="n">{getItem(s.categoryId, s.secrets[p])?.name}</span>
          </div>
        ))}
      </div>
      <div className="stack">
        <button className="btn btn-primary" onClick={onRematch}>
          <RotateCcw className="ico" aria-hidden="true" /> Rematch · {getCategory(s.categoryId).name}
        </button>
        <button className="btn btn-ghost" onClick={() => send({ type: 'NEW_CATEGORY' })}>
          <LayoutGrid className="ico" aria-hidden="true" /> New category
        </button>
        <ShareButton where="over" />
      </div>
    </div>
  );
}
