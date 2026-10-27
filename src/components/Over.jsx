import { useEffect } from 'react';
import { RotateCcw, LayoutGrid } from 'lucide-react';
import { getCategory, getItem } from '../data/categories.js';
import { nameOf, playersOf } from './shared.jsx';
import FitName from './FitName.jsx';
import ShareButton from './ShareButton.jsx';
import { play } from '../lib/sound.js';

const FLIP_START = 0.55; // seconds after the screen lands
const FLIP_GAP = 0.22;
const FLIP_LEN = 0.62; // the flip, plus a beat before the stamp lands

/** A few numbers from the game: how long it took, how many misses, the quickest turn. */
function Stats({ s }) {
  const turns = Math.max(1, Math.ceil(s.turn / s.count));
  const wrong = s.misses ?? 0;
  const fast = s.timer > 0 && s.fastest;
  return (
    <dl className="stats">
      <div>
        <dt>Turn{turns === 1 ? '' : 's'} each</dt>
        <dd>{turns}</dd>
      </div>
      <div>
        <dt>Wrong guess{wrong === 1 ? '' : 'es'}</dt>
        <dd>{wrong}</dd>
      </div>
      {fast && (
        <div>
          <dt>Fastest · {nameOf(s, s.fastest.p)}</dt>
          <dd>
            {Math.max(1, Math.round(s.fastest.ms / 1000))}
            <small>s</small>
          </dd>
        </div>
      )}
    </dl>
  );
}

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

  // The cards turn over one by one; the one that decided it goes last and gets stamped.
  const players = playersOf(s);
  const key = solved ? s.secrets.indexOf(s.lastAccused) : loser;
  const order = [...players.filter((p) => p !== key), ...(key >= 0 ? [key] : [])];
  const delay = (p) => FLIP_START + order.indexOf(p) * FLIP_GAP;
  useEffect(() => {
    if (key < 0) return undefined;
    const t = setTimeout(() => play('stamp'), (delay(key) + FLIP_LEN) * 1000);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`stage p${w} shake`}>
      <span className={`slam${solved ? '' : ' loss'}`}>{solved ? 'Got it!' : 'Out of cards'}</span>
      <h1>
        <span className="who-big" style={{ '--fit': Math.min(1, 9 / Math.max(nameOf(s, w).length, 1)) }}>{nameOf(s, w)}</span> wins
      </h1>
      <p className="lede">{line}</p>
      <Story s={s} />
      <div className="secrets">
        {players.map((p) => (
          <div className={`mini p${p}`} key={p} style={{ '--d': `${delay(p)}s` }}>
            <span className="k">{nameOf(s, p)} picked</span>
            <FitName text={getItem(s.categoryId, s.secrets[p])?.name ?? ''} maxLines={2} min={14} />
            {p === key && (
              <span className="st" aria-hidden="true">
                <span>{solved ? 'Guessed' : 'Out'}</span>
              </span>
            )}
          </div>
        ))}
      </div>
      <Stats s={s} />
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
