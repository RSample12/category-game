import { useState } from 'react';
import { Fingerprint } from 'lucide-react';

/** Hold to reveal your own secret. Releasing (or leaving the button) hides it. */
export default function PeekButton({
  secretName,
  label = 'Hold to peek at my secret',
  owner = 'Your secret',
  ariaLabel = 'Hold to peek at your secret',
  className = '',
}) {
  const [show, setShow] = useState(false);
  const hide = () => setShow(false);
  return (
    <button
      type="button"
      className={`btn btn-ghost peek${show ? ' show' : ''}${className ? ` ${className}` : ''}`}
      aria-label={ariaLabel}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture?.(e.pointerId);
        setShow(true);
      }}
      onPointerUp={hide}
      onPointerCancel={hide}
      onPointerLeave={hide}
      onBlur={hide}
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => {
        if (e.detail === 0) setShow((v) => !v); // keyboard: toggle
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
