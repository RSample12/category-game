# Crack the Case

Pass-and-play deduction game for two players on one phone: a mashup of Guess Who and Categories.
React + Vite, no backend.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # game-rule tests (Node's built-in runner, no extra packages)
npm run build      # production build in dist/
npm run preview    # serve dist/ locally
```

`package.json` lists dependencies as `latest`. After your first `npm install`, commit the generated
`package-lock.json`, or replace `latest` with the versions it resolved.

## How it is organised

```
src/
  data/categories.js     category lists (the only place content lives)
  game/engine.js         pure game state + reducer: every rule, no React, no randomness inside
  game/engine.test.js    game-rule tests (sound mapping tests live in lib/)
  components/            one component per screen (Setup, Reveal, Handoff, Turn, Over) + shared bits
  styles/app.css         the night-desk theme: tokens, layout, components
  styles/extras.css      React-build additions (icons, deal-in, case-closed stamp)
  lib/haptics.js         vibration cues, only after the first tap
  lib/sound.js           synthesized sound effects + mute
  lib/soundEvents.js     pure "which sound for this change" mapping (tested)
  App.jsx                reducer wiring, persistence, focus + screen-reader announcements
```

## Sound

Effects are synthesized with Web Audio (no audio files). Each sound is a small list of voices in
`src/lib/sound.js`; `src/lib/soundEvents.js` maps game changes to sounds and is unit-tested.
Stamp thump on a rule-out, soft tick on undo, shuffle on deal, card turn on reveals, chime on
handoff, buzzer on a wrong accusation, gavel and jingle on a win. A speaker button (top right)
mutes everything and remembers the choice. Audio starts after the first tap, as browsers require.

## Adding categories

Add one `define(...)` call in `src/data/categories.js`:

```js
define('birds', 'Birds', 'Wings and whistles.', ['Robin', 'Owl', 'Penguin' /* ... */]),
```

Item ids are slugs of the name (`birds-robin`), so reordering or growing a list is safe.
When you want larger pools with random sampling at deal time, do it inside `dealSecrets()` and
the board setup in `src/game/engine.js`; the UI only reads `getCategory(id).items`.

## Rules (as implemented)

- Both players are dealt a different secret item from the chosen category.
- Each turn is either eliminating items or guessing, never both.
- Eliminations made this turn can be tapped again to undo; ending the turn locks them.
- Guess mode is unavailable while this turn's eliminations are pending.
- When one item remains it opens a confirm prompt. Confirming is the guess.
- Correct guess wins. Wrong guess eliminates that item and passes the turn. Wrong on your last
  item means the opponent wins by default.
- Score carries across rematches. Rematch re-deals in the same category and alternates who starts.

## Resume after refresh

State is saved to `localStorage`. A reload during a game restores it, but never onto a screen that
could show a secret: a reload mid-turn lands on that player's handoff screen, and a reload during a
secret reveal returns to the hidden step.

## Deploying (Vercel)

Framework preset "Vite", build command `npm run build`, output directory `dist`.
`base: './'` in `vite.config.js` keeps the build portable.
