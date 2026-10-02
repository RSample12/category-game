/**
 * Small vibration cues on phones that support it. Silent everywhere else, and
 * silent until the player has tapped the page once (browsers block vibration
 * before a user gesture, e.g. right after a refresh-resume).
 */
export const buzz = (pattern) => {
  try {
    if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
    navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
};
