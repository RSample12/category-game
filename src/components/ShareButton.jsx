import { useEffect, useRef, useState } from 'react';
import { Share2 } from 'lucide-react';
import { shareGame, shareUrl } from '../lib/share.js';

/** "Share the game" button. Shows a short confirmation when the link was copied instead of shared. */
export default function ShareButton({ where, className = 'btn btn-ghost' }) {
  const [note, setNote] = useState('');
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  const onClick = async () => {
    const result = await shareGame(where);
    const msg = result === 'copied' ? 'Link copied. Paste it anywhere.' : result === 'failed' ? shareUrl() : '';
    setNote(msg);
    clearTimeout(timer.current);
    if (msg) timer.current = setTimeout(() => setNote(''), 3500);
  };

  return (
    <>
      <button type="button" className={className} onClick={onClick}>
        <Share2 className="ico" aria-hidden="true" /> Share the game
      </button>
      <p className="share-note" role="status" aria-live="polite">{note}</p>
    </>
  );
}
