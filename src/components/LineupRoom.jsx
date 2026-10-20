/**
 * The setup screen's header: a police lineup room. A height chart on the wall, five stylized
 * suspects, a spotlight on the middle one (who wears a fedora) and the booking placard that
 * carries the game's title. Everything except the title is decorative.
 */

/* One stylized figure: round head on rounded shoulders. Every piece is the same opaque colour
   and they overlap, so it reads as a single shape. */
function Figure({ x, h, opacity, lit = false, fedora = false }) {
  const w = Math.round(h * 0.4);
  return (
    <svg
      className={`suspect${lit ? ' lit' : ''}`}
      viewBox="0 -6 60 156"
      preserveAspectRatio="xMidYMax meet"
      aria-hidden="true"
      focusable="false"
      style={{ left: `calc(50% + ${x}px)`, width: w, height: h, marginLeft: -w / 2, opacity }}
    >
      <g fill={lit ? 'var(--figure-lit)' : 'var(--figure)'}>
        <circle cx="30" cy="20" r="15" />
        <path d="M30 31 C12 31 4 43 4 63 L4 150 L56 150 L56 63 C56 43 48 31 30 31 Z" />
        {fedora && (
          <>
            <path d="M18.5 14 C18.5 6 20.5 0.5 25 -0.5 Q30 2.6 35 -0.5 C39.5 0.5 41.5 6 41.5 14 Z" />
            <path d="M10 14.5 C10 11.8 50 11.8 50 14.5 C50 17.4 44 17.6 30 17.6 C16 17.6 10 17.4 10 14.5 Z" />
          </>
        )}
      </g>
    </svg>
  );
}

const MARKS = ['7′', '6′', '5′', '4′', '3′', '2′', '1′'];

/** Today as 10·20·26, like a booking-photo date. */
function today() {
  const d = new Date();
  return [d.getMonth() + 1, d.getDate(), d.getFullYear() % 100].map((n) => String(n).padStart(2, '0')).join('·');
}

export default function LineupRoom({ caseNo }) {
  return (
    <div className="room">
      <div className="room-chart" aria-hidden="true" />
      <div className="room-marks" aria-hidden="true">
        {MARKS.map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
      <div className="room-beam" aria-hidden="true" />
      <Figure x={-150} h={206} opacity={0.55} />
      <Figure x={-76} h={232} opacity={0.75} />
      <Figure x={76} h={218} opacity={0.75} />
      <Figure x={150} h={240} opacity={0.55} />
      <Figure x={0} h={252} opacity={1} lit fedora />
      <div className="room-floor" aria-hidden="true" />
      <div className="placard">
        <span className="placard-row" aria-hidden="true">
          <span>Case Nº {caseNo}</span>
          <span>{today()}</span>
        </span>
        <h1>
          <span className="t1">Prime</span> <span className="t2">Suspicion</span>
        </h1>
        <span className="placard-rule" aria-hidden="true" />
        <span className="placard-row placard-foot" aria-hidden="true">Suspect Nº 3</span>
      </div>
    </div>
  );
}
