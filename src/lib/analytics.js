/**
 * Privacy-friendly analytics (Vercel Web Analytics): anonymous page views and a few
 * game events. No cookies, no accounts, no personal data. It only runs on the deployed
 * site, never in development, and any failure is swallowed so it can never break the game.
 *
 * Custom events (game_started and friends) are recorded on Vercel plans that support them;
 * page views work on every plan.
 */
import { inject, track } from '@vercel/analytics';

export function startAnalytics() {
  try {
    if (import.meta.env.PROD) inject({ mode: 'production' });
  } catch {
    /* analytics is optional */
  }
}

export function trackEvent(name, props) {
  try {
    if (import.meta.env.PROD) track(name, props);
  } catch {
    /* analytics is optional */
  }
}
