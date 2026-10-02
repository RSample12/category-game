import { useEffect, useRef, useState } from 'react';
import { Home } from 'lucide-react';

/** Asks before leaving, so a stray tap can never throw away a game in progress. */
function ConfirmHome({ onStay, onLeave }) {
  const ref = useRef(null);
  const stayRef = useRef(null);

  // Focus the safe choice, trap Tab inside, close on Escape, restore focus after.
  useEffect(() => {
    const previous = document.activeElement;
    stayRef.current?.focus({ preventScroll: true });
    const onKey = (e) => {
      if (e.key === 'Escape') {
        onStay();
      } else if (e.key === 'Tab') {
        const buttons = ref.current?.querySelectorAll('button');
        if (!buttons?.length) return;
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.({ preventScroll: true });
    };
  }, [onStay]);

  return (
    <div className="scrim" onClick={(e) => e.target === e.currentTarget && onStay()}>
      <div className="sheet" role="alertdialog" aria-modal="true" aria-labelledby="home-title" aria-describedby="home-desc" ref={ref}>
        <h3 id="home-title">Leave this game?</h3>
        <p id="home-desc">
          This game ends and its secret suspects are lost. Scores from earlier rounds are kept.
        </p>
        <div className="row">
          <button className="btn btn-ghost" ref={stayRef} onClick={onStay}>
            Keep playing
          </button>
          <button className="btn btn-danger" onClick={onLeave}>
            Go home
          </button>
        </div>
      </div>
    </div>
  );
}

/** Fixed top-left on every in-game screen. Tapping it only opens the confirmation. */
export default function HomeButton({ send }) {
  const [asking, setAsking] = useState(false);
  return (
    <>
      <button
        type="button"
        className="home-btn"
        aria-label="Home. Leave this game"
        aria-haspopup="dialog"
        onClick={() => setAsking(true)}
      >
        <Home className="ico" aria-hidden="true" />
      </button>
      {asking && (
        <ConfirmHome
          onStay={() => setAsking(false)}
          onLeave={() => {
            setAsking(false);
            send({ type: 'GO_HOME' });
          }}
        />
      )}
    </>
  );
}
