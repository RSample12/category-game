/**
 * The setup screen's header: an "Eyes only" manila dossier. The title's second word is in red
 * with a torn scrap of redaction tape still stuck to it — the cover has just been blown.
 */
function today() {
  const d = new Date();
  return [d.getMonth() + 1, d.getDate(), d.getFullYear() % 100].map((n) => String(n).padStart(2, '0')).join('·');
}

export default function Dossier({ caseNo }) {
  return (
    <div className="dossier">
      <span className="dossier-tab" aria-hidden="true">Eyes only</span>
      <svg className="dossier-clip" viewBox="0 0 22 56" aria-hidden="true" focusable="false">
        <path d="M6 10 V42 a5 5 0 0 0 10 0 V6 a3.5 3.5 0 0 0 -7 0 V38" fill="none" stroke="#9aa2a6" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
      <span className="dossier-typed" aria-hidden="true">
        <span>File Nº {caseNo}</span>
        <span>{today()}</span>
      </span>
      <h1>
        <span className="c">Cover</span>{' '}
        <span className="b">
          Blown
          <i className="tape" aria-hidden="true" />
          <i className="peel" aria-hidden="true" />
        </span>
      </h1>
      <p className="dossier-sub">
        Everyone guards a secret identity. Ask yes/no questions,{' '}
        <span className="bar" aria-hidden="true" /> redact the impostors, and blow their cover first.
      </p>
      <span className="dossier-stamp" aria-hidden="true">Classified</span>
    </div>
  );
}
