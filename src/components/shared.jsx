export const cx = (...parts) => parts.filter(Boolean).join(' ');
export const pad = (n) => String(n).padStart(2, '0');
export const nameOf = (s, p) => s.names[p].trim() || `Player ${p + 1}`;

export function Scoreboard({ s }) {
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
