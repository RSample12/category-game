import { useRef, useState } from 'react';
import { Fingerprint } from 'lucide-react';
import { play } from '../lib/sound.js';

/** Hold to reveal your own secret. Releasing (or leaving the button) hides it. */
export default function PeekButton({
  secretName,
  label = 'Hold to peek at my secret',
  owner = 'Your secret',
  ariaLabel = 'Hold to peek at your secret',
  className = '',
}) {
  const [show, setShow] = useState(false);
  const shown = useRef(false); // up, leave and blur can all fire for one release: one sound
  const hide = () => {
    if (shown.current) play('unpeek');
    shown.current = false;
    setShow(false);
  };
  return (
    <button
      type="button"
      className={`btn btn-ghost peek${show ? ' show' : ''}${className ? ` ${className}` : ''}`}
      aria-label={ariaLabel}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture?.(e.pointerId);
        play('peek');
        shown.current = true;
        setShow(true);
      }}
      onPointerUp={hide}
      onPointerCancel={hide}
      onPointerLeave={hide}
      onBlur={hide}
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => {
        if (e.detail === 0) {
          // keyboard: toggle
          play(show ? 'unpeek' : 'peek');
          shown.current = !show;
          setShow(!show);
        }
      }}
    >
      <span className="hint">
        <Fingerprint className="ico" aria-hidden="true" /> {label}
      </span>
      <span className="reveal">
        {owner}: <b>{secretName}</b>
      </span>
    </button>
  );
}
