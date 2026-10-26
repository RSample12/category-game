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
import { saveLastGame } from './lib/lastGame.js';
import { getItem } from './data/categories.js';
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
    case 'setup': return 'Guesswork. Pick a lineup and play.';
    case 'dealing': return 'Dealing cards.';
    case 'reveal':
      return s.revealStep % 2 === 0
        ? `Hand the device to ${nameOf(s, Math.floor(s.revealStep / 2))}.`
        : `${nameOf(s, Math.floor(s.revealStep / 2))}, your secret is on screen.`;
    case 'handoff': return `Pass the device to ${nameOf(s, s.current)}.`;
    case 'turn':
      return `${nameOf(s, s.current)}'s turn, questioning ${nameOf(s, s.targets[s.current])}. ${remainingIds(s, s.current).length} cards left.`;
    case 'over': return `${nameOf(s, s.winner)} wins.`;
    default: return '';
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, init);
  const root = useRef(null);
  // The setup recap repeats the game-over screen, so skip it until the next visit.
  const finishedThisVisit = useRef(false);

  // Stable dispatch with small haptic cues.
  const send = useCallback((action) => {
    dispatch(action);
    if (action.type === 'TAP_ITEM') buzz(8);
    else if (action.type === 'END_TURN' || action.type === 'SHEET_CONFIRM') buzz(18);
    if (action.type === 'SET_CATEGORY') play('select');
  }, []);

  const deal = useCallback(
    (type, caseNo, categoryId = state.categoryId) => {
      trackEvent(type === 'REMATCH' ? 'rematch' : 'game_started', {
        category: categoryId,
        players: state.count,
        rules: state.count > 2 ? state.rules : 'duel',
      });
      if (categoryId !== state.categoryId) send({ type: 'SET_CATEGORY', id: categoryId });
      const dealt = dealSecrets(categoryId, state.count);
      // The setup panel shows a case number before dealing; keep that same number.
      send({ type, ...dealt, caseNo: caseNo || dealt.caseNo });
    },
    [send, state.categoryId, state.count, state.rules],
  );

  // Anonymous count of finished games (no names, no personal data).
  useEffect(() => {
    if (state.screen !== 'over') return;
    finishedThisVisit.current = true;
    trackEvent('game_finished', { category: state.categoryId });
    // Remember a one-line summary for the setup screen's "Last game" recap.
    const w = nameOf(state, state.winner);
    let text;
    if (state.reason === 'solved') {
      const owner = state.secrets.indexOf(state.lastAccused);
      const item = getItem(state.categoryId, state.lastAccused)?.name ?? '';
      const turns = Math.max(1, Math.ceil(state.turn / state.count));
      text = `guessed it in ${turns} turn${turns === 1 ? '' : 's'}${owner >= 0 && item ? ` · ${item}` : ''}`;
    } else {
      text = 'won when the others ran out of cards';
    }
    saveLastGame({ categoryId: state.categoryId, winner: w, text, count: state.count });
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
    case 'setup': view = <Setup s={state} send={send} onDeal={(caseNo) => deal('DEAL', caseNo)} onRematch={(categoryId) => deal('REMATCH', undefined, categoryId)} showRecap={!finishedThisVisit.current} />; break;
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
