import { Eye, EyeOff } from 'lucide-react';
import { getCategory, getItem } from '../data/categories.js';
import { hunterOf } from '../game/engine.js';
import { nameOf, pad } from './shared.jsx';
import FitName from './FitName.jsx';

/**
 * Two private reveals: each player hides their secret before the phone moves on.
 *
 * "Hand it over" and "here's your secret" share ONE layout (badge, headline,
 * card, note, button), so the card and the button sit in exactly the same place
 * on both steps. Only the card's face and the words change, so the player never
 * has to scroll or re-find anything between taps. The layout is sized to fit a
 * single screen (see .reveal-stage in extras.css).
 */
export default function Reveal({ s, send }) {
  const p = Math.floor(s.revealStep / 2);
  const last = p === s.count - 1;
  const showing = s.revealStep % 2 === 1;
  const next = () => send({ type: 'REVEAL_NEXT' });
  const name = nameOf(s, p);

  let card;
  if (showing) {
    const item = getItem(s.categoryId, s.secrets[p]);
    const cat = getCategory(s.categoryId);
    const idx = cat.items.findIndex((i) => i.id === item.id);
    card = (
      <div className="bigtag" key="face" role="img" aria-label={`Your pick is ${item.name}`}>
        <span className="k">Your pick</span>
        <FitName text={item.name} maxLines={2} min={22} />
        <span className="f">
          <span>{cat.name}</span>
          <span>Nº {pad(idx + 1)}</span>
        </span>
      </div>
    );
  } else {
    card = (
      <div className="cover" key="back" aria-hidden="true">
        <span>Top secret</span>
      </div>
    );
  }

  return (
    <div className={`stage reveal-stage p${p}`}>
      <span className="badge">Secret {p + 1} of {s.count}</span>
      {/* Always two lines: a small label, then the name. Long names shrink to fit (--fit). */}
      <h1 style={{ '--fit': Math.min(1, 9 / Math.max(name.length, 1)) }}>
        <span className="lead">{showing ? 'Secret for' : 'Hand it to'}</span>
        <span className="who-big name">{name}</span>
      </h1>
      {card}
      <p className="lede reveal-note">
        {showing
          ? s.count > 2
            ? `Memorize it. ${nameOf(s, hunterOf(s, p))} will ask you yes/no questions about it, and you’ll question ${nameOf(s, s.targets[p])}. You can peek again before your turn or while you’re answering.`
            : 'Memorize it. Your opponent will ask you yes/no questions about it. You can peek again before your turn or while you’re answering.'
          : s.count > 2
            ? `Everyone except ${name}, look away. ${name} is about to see their pick.`
            : `${nameOf(s, 1 - p)}, look away. ${name} is about to see their pick.`}
      </p>
      <div className="stack">
        <button className="btn btn-primary" onClick={next}>
          {showing ? (
            <>
              <EyeOff className="ico" aria-hidden="true" /> Hide it{last ? '' : ' and pass'}
            </>
          ) : (
            <>
              <Eye className="ico" aria-hidden="true" /> Show my secret
            </>
          )}
        </button>
      </div>
    </div>
  );
}
