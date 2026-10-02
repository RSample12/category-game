import { ArrowRight } from 'lucide-react';
import { getItem } from '../data/categories.js';
import { remainingIds } from '../game/engine.js';
import { nameOf } from './shared.jsx';
import PeekButton from './PeekButton.jsx';

function Report({ s }) {
  const r = s.report;
  if (!r) return null;
  const who = <b>{nameOf(s, r.p)}</b>;
  let body;
  if (r.kind === 'accused') {
    body = (
      <>
        {who} accused <b>{getItem(s.categoryId, r.itemId).name}</b>. Wrong.
      </>
    );
  } else if (r.count > 0) {
    body = (
      <>
        {who} ruled out <b>{r.count}</b> suspect{r.count > 1 ? 's' : ''}.
      </>
    );
  } else {
    body = <>{who} asked a question and ruled nothing out.</>;
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
