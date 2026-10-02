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
      <h2 style={{ fontSize: 40 }}>Shuffling the case files…</h2>
    </div>
  );
}
