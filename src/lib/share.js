import { trackEvent } from './analytics.js';

const TITLE = 'Cover Blown';
const TEXT = '2–4 agents, one phone. Can you blow my cover?';

/** The link people receive. Uses whatever domain the game is served from, so it keeps
 *  working if the site moves. `ref=share` lets analytics tell shared visits apart. */
export function shareUrl() {
  return `${window.location.origin}/?ref=share`;
}

/**
 * Opens the phone's native share sheet when there is one, otherwise copies the link.
 * Resolves to 'shared' | 'copied' | 'cancelled' | 'failed'.
 */
export async function shareGame(where) {
  const url = shareUrl();
  try {
    if (navigator.share) {
      await navigator.share({ title: TITLE, text: TEXT, url });
      trackEvent('share', { where, method: 'sheet' });
      return 'shared';
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return 'cancelled';
    /* any other failure: fall through to copying */
  }
  try {
    await navigator.clipboard.writeText(`${TEXT} ${url}`);
    trackEvent('share', { where, method: 'copy' });
    return 'copied';
  } catch {
    return 'failed';
  }
}
