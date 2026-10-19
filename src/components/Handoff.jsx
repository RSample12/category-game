import { ArrowRight } from 'lucide-react';
import { getItem } from '../data/categories.js';
import { remainingIds, hunterOf } from '../game/engine.js';
import { nameOf } from './shared.jsx';
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
        {nm(r.p)} cracked {nm(r.out)}’s suspect, {item(r.itemId)}. {nm(r.out)} is out.{' '}
        {nm(r.p)} now questions {nm(r.next)}, starting fresh.
      </>
    );
  } else if (r.kind === 'out') {
    const h = hunterOf(s, r.p);
    body = (
      <>
        {nm(r.p)} accused {item(r.itemId)}. Wrong, and that was their last suspect, so {nm(r.p)} is out.{' '}
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
        {nm(r.p)} accused {item(r.itemId)}. Wrong.
      </>
    );
  } else if (r.count > 0) {
    body = (
      <>
        {nm(r.p)} ruled out <b>{r.count}</b> suspect{r.count > 1 ? 's' : ''}.
      </>
    );
  } else {
    body = <>{nm(r.p)} asked a question and ruled nothing out.</>;
  }
  return <p className="report">{body}</p>;
}

/** Between turns: the device changes hands here, with nothing secret on screen. */
export default function Handoff({ s, send }) {
  const p = s.current;
  const left = remainingIds(s, p).length;
  const secret = getItem(s.categoryId, s.secrets[p]);
  return (
    <div className={`stage p${p}`}>
      <span className="badge">Turn {s.turn}</span>
      <h1>
        Pass to <span className="who-big">{nameOf(s, p)}</span>
      </h1>
      <Report s={s} />
      <p className="lede">
        {left} suspect{left === 1 ? '' : 's'} still on your board.
        {s.count > 2 && (
          <>
            {' '}You’re questioning <b className={`who-inline p${s.targets[p]}`}>{nameOf(s, s.targets[p])}</b>.
          </>
        )}
      </p>
      <div className="stack">
        <button className="btn btn-primary" onClick={() => send({ type: 'START_TURN' })}>
          I'm {nameOf(s, p)}. Start my turn <ArrowRight className="ico" aria-hidden="true" />
        </button>
        <PeekButton secretName={secret.name} />
      </div>
    </div>
  );
}
