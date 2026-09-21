# Category Detectives (React)

A pass-and-play mashup of Guess Who and Categories, built with React and
[lucide-react](https://lucide.dev/) icons. This is a small [Vite](https://vitejs.dev/)
project — Vite handles the build step that turns the JSX/ES-module source
into plain JS + CSS a browser can run, which is required here because
`lucide-react` is a real npm package, not something a plain static HTML
file can load.

## Project structure

```
category-detectives/
├── index.html              ← Vite entry point (meta tags, favicon, mounts #root)
├── package.json
├── vite.config.js
├── .gitignore
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx             ← mounts <CategoryDetectives /> into the page
    └── CategoryDetectives.jsx  ← the whole game (state, logic, styling, UI)
```

Everything about the game — rules, categories, styling, layout — lives in
`src/CategoryDetectives.jsx`. There's no other app code to worry about.

## Run it locally

You'll need [Node.js](https://nodejs.org) 18 or later installed.

```bash
npm install
npm run dev
```

This starts a local dev server (usually `http://localhost:5173`) with hot
reload — edit `CategoryDetectives.jsx` and the page updates instantly.

## Build for production

```bash
npm run build
```

This outputs a `dist/` folder containing the fully built, static
site — optimized JS/CSS bundles, no Node or build tools needed to serve it.
You can sanity-check the production build locally with:

```bash
npm run preview
```

## Deploy it

`dist/` is a static site once built, so any static host works. The two
easiest paths:

### Option A — Vercel (recommended for Vite projects)
1. Push this folder to a GitHub repo.
2. [vercel.com](https://vercel.com) → New Project → import the repo.
3. Vercel auto-detects Vite — no config needed. It runs `npm run build` and
   serves `dist/` automatically, with free HTTPS.
4. Project → Settings → Domains → add your `.io` domain and follow the DNS
   instructions shown there.

### Option B — Netlify
1. Push to GitHub, or drag the `dist/` folder (after running `npm run build`)
   onto Netlify's deploy area for a one-off deploy.
2. For ongoing deploys, connect the GitHub repo instead: Netlify will run
   `npm run build` and publish `dist/` on every push.
   - Build command: `npm run build`
   - Publish directory: `dist`
3. **Site settings → Domain management → Add custom domain**, enter your
   `.io` domain, and follow the DNS instructions (Netlify auto-provisions
   HTTPS).

### Option C — Cloudflare Pages
1. Cloudflare dashboard → Workers & Pages → Create → Pages → connect the repo.
2. Build command: `npm run build`, output directory: `dist`.
3. If you registered the `.io` domain through Cloudflare, attaching it is a
   couple of clicks with no external DNS step.

### Option D — GitHub Pages
GitHub Pages serves plain static files with no build step of its own, so
you build locally/in CI first, then publish `dist/`:
1. `npm run build`
2. Push the contents of `dist/` to a `gh-pages` branch (the
   [`gh-pages`](https://www.npmjs.com/package/gh-pages) npm package
   automates this: `npm i -D gh-pages`, add a `"deploy": "gh-pages -d dist"`
   script, then `npm run deploy`).
3. Repo → Settings → Pages → set source to the `gh-pages` branch.
4. Because the site isn't served from the domain root path in some GitHub
   Pages setups, you may need to set `base: '/your-repo-name/'` in
   `vite.config.js` — Vercel/Netlify/Cloudflare Pages don't have this
   wrinkle, which is why they're the simpler options above.

## Buying and connecting the `.io` domain

Same as any static site: register through Namecheap, Porkbun, Cloudflare
Registrar, or similar (check the **renewal** price, not just the first-year
one — `.io` renewals run noticeably higher than `.com`). Then add the
custom domain in whichever host you picked above and follow its DNS
instructions — usually one CNAME record, sometimes an A record or a
nameserver change.

## Before going live

- [ ] `npm run build && npm run preview` and click through the whole game
- [ ] Test on an actual phone over real cellular/WiFi
- [ ] Confirm the Google Fonts (Big Shoulders Display, Public Sans,
      JetBrains Mono) load correctly — they're fetched from
      `fonts.googleapis.com` at runtime via `CategoryDetectives.jsx`
- [ ] Share a link and check the Open Graph preview (the tags are already
      in `index.html`)

## Making future edits

Everything is in `src/CategoryDetectives.jsx` — game rules, the 11
categories and their items, and all styling (an injected `<style>` block
using CSS variables, no separate CSS file to hunt through). Edit it, and
`npm run dev` will hot-reload; for production, `npm run build` and
redeploy (or just push — Vercel/Netlify/Cloudflare Pages redeploy
automatically on every push to the connected repo).
