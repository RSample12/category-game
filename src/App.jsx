import { useCallback, useEffect, useReducer, useRef } from 'react';
import {
  reducer,
  createInitialState,
  restoreState,
  serialize,
  dealSecrets,
  remainingIds,
} from './game/engine.js';
import { getCategory } from './data/categories.js';
import { buzz } from './lib/haptics.js';
import { play, unlock } from './lib/sound.js';
import { trackEvent } from './lib/analytics.js';
import { soundFor } from './lib/soundEvents.js';
import SoundToggle from './components/SoundToggle.jsx';
import HomeButton from './components/HomeButton.jsx';
import { nameOf } from './components/shared.jsx';
import Setup from './components/Setup.jsx';
import Dealing from './components/Dealing.jsx';
import Reveal from './components/Reveal.jsx';
import Handoff from './components/Handoff.jsx';
import Turn from './components/Turn.jsx';
import Over from './components/Over.jsx';

const STORAGE_KEY = 'category-detectives:v2';

function init() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return restoreState(raw);
  } catch {
    /* storage unavailable: start fresh */
  }
  return createInitialState();
}

/** What a screen reader should hear when the screen changes. */
function announcement(s) {
  switch (s.screen) {
    case 'setup': return 'Crack the Case. Pick a category and deal.';
    case 'dealing': return 'Dealing suspects.';
    case 'reveal':
      return s.revealStep % 2 === 0
        ? `Hand the device to ${nameOf(s, s.revealStep < 2 ? 0 : 1)}.`
        : `${nameOf(s, s.revealStep < 2 ? 0 : 1)}, your secret is on screen.`;
    case 'handoff': return `Pass the device to ${nameOf(s, s.current)}.`;
    case 'turn': return `${nameOf(s, s.current)}'s turn. ${remainingIds(s, s.current).length} suspects left.`;
    case 'over': return `${nameOf(s, s.winner)} wins.`;
    default: return '';
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, init);
  const root = useRef(null);

  // Stable dispatch with small haptic cues.
  const send = useCallback((action) => {
    dispatch(action);
    if (action.type === 'TAP_ITEM') buzz(8);
    else if (action.type === 'END_TURN' || action.type === 'SHEET_CONFIRM') buzz(18);
    if (action.type === 'SET_CATEGORY') play('select');
  }, []);

  const deal = useCallback(
    (type) => {
      trackEvent(type === 'REMATCH' ? 'rematch' : 'game_started', { category: state.categoryId });
      send({ type, ...dealSecrets(state.categoryId) });
    },
    [send, state.categoryId],
  );

  // Anonymous count of finished games (no names, no personal data).
  useEffect(() => {
    if (state.screen === 'over') trackEvent('game_finished', { category: state.categoryId });
  }, [state.screen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist so an accidental refresh can resume the game (secrets stay hidden on restore).
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, serialize(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  // Browsers only allow audio after a gesture: start it on the first tap or key press.
  useEffect(() => {
    const start = () => unlock();
    window.addEventListener('pointerdown', start, { once: true });
    window.addEventListener('keydown', start, { once: true });
    return () => {
      window.removeEventListener('pointerdown', start);
      window.removeEventListener('keydown', start);
    };
  }, []);

  // Sound follows what changed in the game (see lib/soundEvents.js).
  const prevState = useRef(null);
  useEffect(() => {
    const name = soundFor(prevState.current, state);
    prevState.current = state;
    if (name) play(name);
  }, [state]);

  // The "dealing" screen is a short beat before the first private reveal.
  useEffect(() => {
    if (state.screen !== 'dealing') return undefined;
    const t = setTimeout(() => dispatch({ type: 'DEAL_DONE' }), 900);
    return () => clearTimeout(t);
  }, [state.screen]);

  // Move focus and scroll to the top whenever the screen changes.
  useEffect(() => {
    root.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
    if (state.screen === 'handoff') buzz(14);
    if (state.screen === 'over') buzz([30, 60, 30]);
  }, [state.screen, state.revealStep, state.current]);

  let view;
  switch (state.screen) {
    case 'setup': view = <Setup s={state} send={send} onDeal={() => deal('DEAL')} />; break;
    case 'dealing': view = <Dealing caseNo={state.caseNo} categoryName={getCategory(state.categoryId).name} />; break;
    case 'reveal': view = <Reveal s={state} send={send} />; break;
    case 'handoff': view = <Handoff s={state} send={send} />; break;
    case 'turn': view = <Turn s={state} send={send} />; break;
    case 'over': view = <Over s={state} send={send} onRematch={() => deal('REMATCH')} />; break;
    default: view = null;
  }

  return (
    <div id="app" ref={root} tabIndex={-1}>
      <p className="sr-only" role="status" aria-live="polite">
        {announcement(state)}
      </p>
      <SoundToggle />
      {state.screen !== 'setup' && <HomeButton send={send} />}
      <main id="main">{view}</main>
    </div>
  );
}
