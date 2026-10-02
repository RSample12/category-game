/**
 * Pure mapping from "what just changed in the game" to "which sound to play".
 * Kept separate from the audio code so it can be unit-tested without a browser.
 */
export function soundFor(prev, next) {
  if (!prev || prev === next) return null;

  if (prev.screen !== next.screen) {
    switch (next.screen) {
      case 'dealing':
        return 'shuffle';
      case 'handoff':
        // coming straight from a turn that ended in a wrong accusation
        return prev.screen === 'turn' && next.report?.kind === 'accused' ? 'wrong' : 'handoff';
      case 'over':
        return next.reason === 'solved' ? 'win' : 'lose';
      default:
        return null;
    }
  }

  if (next.screen === 'reveal' && prev.revealStep !== next.revealStep) return 'flip';

  if (next.screen === 'turn') {
    const before = prev.boards[next.current].pending.length;
    const after = next.boards[next.current].pending.length;
    if (after > before) return 'stamp';
    if (after < before) return 'undo';
    if (!prev.sheet && next.sheet) return 'sheet';
  }
  return null;
}
