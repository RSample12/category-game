import { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { isMuted, setMuted, unlock, play } from '../lib/sound.js';

/** Fixed mute switch, top right on every screen. The choice is remembered. */
export default function SoundToggle() {
  const [muted, setMutedState] = useState(isMuted());
  const toggle = () => {
    const next = !muted;
    unlock();
    setMuted(next);
    setMutedState(next);
    if (!next) play('select'); // a tick confirms sound is back on
  };
  return (
    <button
      type="button"
      className="sound-toggle"
      aria-pressed={!muted}
      aria-label={muted ? 'Sound off. Turn sound on' : 'Sound on. Mute sound'}
      onClick={toggle}
    >
      {muted ? <VolumeX className="ico" aria-hidden="true" /> : <Volume2 className="ico" aria-hidden="true" />}
    </button>
  );
}
