import { Eye, EyeOff } from 'lucide-react';
import { getCategory, getItem } from '../data/categories.js';
import { nameOf, pad } from './shared.jsx';

/** Two private reveals: each player hides their secret before the phone moves on. */
export default function Reveal({ s, send }) {
  const p = s.revealStep < 2 ? 0 : 1;
  const showing = s.revealStep % 2 === 1;
  const next = () => send({ type: 'REVEAL_NEXT' });

  if (!showing) {
    return (
      <div className={`stage p${p}`}>
        <span className="badge">Secret {p + 1} of 2</span>
        <h1>
          Hand it to <span className="who-big">{nameOf(s, p)}</span>
        </h1>
        <p className="lede">
          {nameOf(s, 1 - p)}, look away. {nameOf(s, p)} is about to see their secret suspect.
        </p>
        <div className="cover" aria-hidden="true">
          <span>Classified</span>
        </div>
        <div className="stack">
          <button className="btn btn-primary" onClick={next}>
            <Eye className="ico" aria-hidden="true" /> I'm {nameOf(s, p)}. Show my secret
          </button>
        </div>
      </div>
    );
  }

  const item = getItem(s.categoryId, s.secrets[p]);
  const idx = getCategory(s.categoryId).items.findIndex((i) => i.id === item.id);
  return (
    <div className={`stage p${p}`}>
      <span className="badge">{nameOf(s, p)}'s secret</span>
      <div className="bigtag" role="img" aria-label={`Your secret suspect is ${item.name}`}>
        <span className="k">Your secret suspect</span>
        <span className="n">{item.name}</span>
        <span className="f">
          <span>{getCategory(s.categoryId).name}</span>
          <span>Nº {pad(idx + 1)}</span>
        </span>
      </div>
      <div className="stack">
        <button className="btn btn-primary" onClick={next}>
          <EyeOff className="ico" aria-hidden="true" /> Hide it{p === 0 ? ' and pass' : ''}
        </button>
      </div>
    </div>
  );
}
