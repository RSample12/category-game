import { useLayoutEffect, useRef } from 'react';

/**
 * A name that shrinks to fit its card.
 *  1. Try one line: step down from the CSS size to `oneLineFloor` × that size.
 *  2. If it still wraps, allow up to `maxLines` lines, stepping down (to `min` px) until no word
 *     is split or spills past the card edge.
 * Lines and overflow are measured from the rendered text itself, so it works with any font.
 */
export default function FitName({ text, className = 'n', maxLines = 2, min = 20, oneLineFloor = 0.85 }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const measure = () => {
      const node = el.firstChild;
      if (!node) return { lines: 0, overflow: false };
      const range = document.createRange();
      range.selectNodeContents(el);
      const box = el.getBoundingClientRect();
      const rects = [...range.getClientRects()].filter((r) => r.width > 0);
      const tops = new Set(rects.map((r) => Math.round(r.top)));
      // a hair of slack: text that exactly touches the edge would still break once overflow-wrap is restored
      const overflow = rects.some((r) => r.right > box.right - 2 || r.left < box.left - 1);
      return { lines: tops.size, overflow };
    };
    const fit = () => {
      el.style.fontSize = '';
      el.style.overflowWrap = 'normal'; // never split a word while measuring
      const base = parseFloat(getComputedStyle(el).fontSize);
      const tryRange = (from, to, ok) => {
        for (let size = from; size >= to; size -= 1) {
          el.style.fontSize = `${size}px`;
          if (ok(measure())) return true;
        }
        return false;
      };
      const oneLine = tryRange(base, Math.max(min, Math.floor(base * oneLineFloor)), (m) => m.lines <= 1 && !m.overflow);
      if (!oneLine) tryRange(base, min, (m) => m.lines <= maxLines && !m.overflow);
      el.style.overflowWrap = ''; // CSS fallback still breaks a word that can never fit
    };
    fit();
    document.fonts?.ready?.then(fit);
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [text, maxLines, min, oneLineFloor]);
  return (
    <span className={className} ref={ref}>
      {text}
    </span>
  );
}
