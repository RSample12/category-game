import { ArrowRight } from 'lucide-react';
import { getCategory, getItem } from '../data/categories.js';
import { remainingIds, hunterOf } from '../game/engine.js';
import { nameOf, playersOf } from './shared.jsx';
import PeekButton from './PeekButton.jsx';

function Report({ s }) {
  const r = s.report;
  if (!r) return null;
  const nm = (p) => <b>{nameOf(s, p)}</b>;
  const item = (id) => <b>{getItem(s.categoryId, id).name}</b>;
  let body;
  if (r.kind === 'cracked') {
    body = (
      <>
        {nm(r.p)} guessed {nm(r.out)}’s pick, {item(r.itemId)}. {nm(r.out)} is out.{' '}
        {nm(r.p)} now questions {nm(r.next)}, starting fresh.
      </>
    );
  } else if (r.kind === 'out') {
    const h = hunterOf(s, r.p);
    body = (
      <>
        {nm(r.p)} guessed {item(r.itemId)}. Wrong, and that was their last card, so {nm(r.p)} is out.{' '}
        {r.takeover >= 0 ? (
          <>{nm(r.takeover)} now questions {nm(r.next)}, starting fresh.</>
        ) : (
          h >= 0 && <>{nm(r.p)} still answers {nm(h)}’s questions.</>
        )}
      </>
    );
  } else if (r.kind === 'accused') {
    body = (
      <>
        {nm(r.p)} guessed {item(r.itemId)}. Wrong.
      </>
    );
  } else if (r.count > 0) {
    body = (
      <>
        {nm(r.p)} ruled out <b>{r.count}</b> card{r.count > 1 ? 's' : ''}.
      </>
    );
  } else {
    body = r.timeUp ? <>{nm(r.p)} ruled nothing out.</> : <>{nm(r.p)} asked a question and ruled nothing out.</>;
  }
  return (
    <p className={`report${r.timeUp ? ' time-up' : ''}`}>
      {r.timeUp && <b className="tu">Time’s up! </b>}
      {body}
    </p>
  );
}

/**
 * The race: cards left for everyone still in, you first. Each bar drains as that board
 * empties, so the shortest bar is closest to a guess.
 */
function Race({ s }) {
  const total = getCategory(s.categoryId).items.length;
  const me = s.current;
  const order = [me, ...playersOf(s).filter((q) => q !== me && s.alive[q])];
  return (
    <ul className="race" aria-label="Cards left">
      {order.map((q) => {
        const left = remainingIds(s, q).length;
        return (
          <li key={q} className={`p${q}${q === me ? ' me' : ''}`}>
            <span className="nm">{q === me ? 'You' : nameOf(s, q)}</span>
            <span className="track" aria-hidden="true">
              <i style={{ '--f': left / total }} />
            </span>
            <span className="n">
              <b>{left}</b> left
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Between turns: the device changes hands here, with nothing secret on screen. */
export default function Handoff({ s, send }) {
  const p = s.current;
  const secret = getItem(s.categoryId, s.secrets[p]);
  return (
    <div className={`stage p${p}`}>
      <span className="badge">Turn {s.turn}</span>
      <h1>
        Pass to <span className="who-big" style={{ '--fit': Math.min(1, 9 / Math.max(nameOf(s, p).length, 1)) }}>{nameOf(s, p)}</span>
      </h1>
      <Report s={s} />
      <Race s={s} />
      {s.count > 2 && (
        <p className="lede">
          You’re questioning <b className={`who-inline p${s.targets[p]}`}>{nameOf(s, s.targets[p])}</b>.
        </p>
      )}
      <div className="stack">
        <button className="btn btn-primary" onClick={() => send({ type: 'START_TURN' })}>
          I'm {nameOf(s, p)}. Start my turn <ArrowRight className="ico" aria-hidden="true" />
        </button>
        <PeekButton secretName={secret.name} />
      </div>
    </div>
  );
}
