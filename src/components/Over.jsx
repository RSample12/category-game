import { RotateCcw, LayoutGrid } from 'lucide-react';
import { getCategory, getItem } from '../data/categories.js';
import { winnerTurns } from '../game/engine.js';
import { nameOf, Scoreboard } from './shared.jsx';
import ShareButton from './ShareButton.jsx';

export default function Over({ s, send, onRematch }) {
  const w = s.winner;
  const l = 1 - w;
  const solved = s.reason === 'solved';
  const accused = getItem(s.categoryId, s.lastAccused)?.name ?? '';
  const line = solved
    ? `${nameOf(s, w)} named ${accused} and cracked the case.`
    : `${nameOf(s, l)} accused ${accused}, their last suspect, and it was wrong. ${nameOf(s, w)} wins by default.`;

  const turns = winnerTurns(s);
  const turnsLine = `Cracked in ${turns} ${turns === 1 ? 'turn' : 'turns'}`;
  const shareText = solved
    ? `I cracked the case in ${turns} ${turns === 1 ? 'turn' : 'turns'}. Can you beat that?`
    : undefined;

  return (
    <div className={`stage p${w} shake`}>
      <span className={`slam${solved ? '' : ' loss'}`}>{solved ? 'Case closed' : 'Out of suspects'}</span>
      <h1>
        <span className="who-big">{nameOf(s, w)}</span> wins
      </h1>
      <p className="lede">{line}</p>
      {solved && <p className="turns-line">{turnsLine}</p>}
      <div className="secrets">
        {[0, 1].map((p) => (
          <div className={`mini p${p}`} key={p}>
            <span className="k">{nameOf(s, p)} held</span>
            <span className="n">{getItem(s.categoryId, s.secrets[p])?.name}</span>
          </div>
        ))}
      </div>
      <Scoreboard s={s} />
      <div className="stack">
        <button className="btn btn-primary" onClick={onRematch}>
          <RotateCcw className="ico" aria-hidden="true" /> Rematch · {getCategory(s.categoryId).name}
        </button>
        <button className="btn btn-ghost" onClick={() => send({ type: 'NEW_CATEGORY' })}>
          <LayoutGrid className="ico" aria-hidden="true" /> New category
        </button>
        <ShareButton where="over" text={shareText} />
      </div>
    </div>
  );
}
