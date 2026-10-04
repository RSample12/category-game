export default function Dealing({ caseNo, categoryName }) {
  return (
    <div className="stage">
      <div className="shuffle" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <span className="eyebrow">
        Case Nº {caseNo} · {categoryName}
      </span>
      <h1 style={{ fontSize: 40, letterSpacing: '.01em' }}>Shuffling the case files…</h1>
    </div>
  );
}
