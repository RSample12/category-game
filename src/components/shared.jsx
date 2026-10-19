export const cx = (...parts) => parts.filter(Boolean).join(' ');
export const pad = (n) => String(n).padStart(2, '0');
export const nameOf = (s, p) => (s.names[p] ?? '').trim() || `Player ${p + 1}`;
export const playersOf = (s) => Array.from({ length: s.count }, (_, i) => i);

/** "Ann", "Ann and Bo", "Ann, Bo and Cy". */
export const listNames = (s, ps) => {
  const n = ps.map((p) => nameOf(s, p));
  return n.length < 2 ? n.join('') : `${n.slice(0, -1).join(', ')} and ${n[n.length - 1]}`;
};

export function Scoreboard({ s }) {
  if (s.count > 2) {
    return (
      <div className="score multi" aria-label="Score" style={{ '--n': s.count }}>
        {playersOf(s).map((p) => (
          <div className={`who p${p}`} key={p}>
            <span className="nm">{nameOf(s, p)}</span>
            <span className="pts">{s.scores[p]}</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="score" aria-label="Score">
      <div className="who p0">
        <span className="nm">{nameOf(s, 0)}</span>
        <span className="pts">{s.scores[0]}</span>
      </div>
      <span className="vs">SCORE</span>
      <div className="who p1">
        <span className="nm">{nameOf(s, 1)}</span>
        <span className="pts">{s.scores[1]}</span>
      </div>
    </div>
  );
}
