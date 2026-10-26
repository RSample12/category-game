export default function Dealing({ caseNo, categoryName }) {
  return (
    <div className="stage">
      <div className="shuffle" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <span className="eyebrow">
        Game Nº {caseNo} · {categoryName}
      </span>
      <h1>Shuffling the cards…</h1>
    </div>
  );
}
