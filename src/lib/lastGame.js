/** The most recent finished game, kept on this phone only, for the setup screen's recap. */
const KEY = 'category-detectives:last-game';

export function saveLastGame(game) {
  try {
    localStorage.setItem(KEY, JSON.stringify(game));
  } catch {
    /* storage unavailable */
  }
}

export function loadLastGame() {
  try {
    const g = JSON.parse(localStorage.getItem(KEY) || 'null');
    return g && typeof g.text === 'string' && typeof g.categoryId === 'string' ? g : null;
  } catch {
    return null;
  }
}
