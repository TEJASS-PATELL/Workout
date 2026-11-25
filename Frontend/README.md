# VTaper

Lean-bulk and V-taper workout + nutrition tracker. React 18, Vite, TypeScript, Tailwind, Zustand (localStorage), Recharts, Framer Motion, installable PWA. No backend, no login.

## Run
```
npm install
npm run dev        # http://localhost:5173
npm test           # overload + weekly-gain unit tests
npm run build      # type-check + production build into dist/
npm run preview    # serve the build; check install + offline here
```
Plan and meal data: `src/data/plan.ts`. Progression and weight-rate logic: `src/lib/logic.ts`.

## Deploy
**Vercel:** push to GitHub, then Add New Project, import the repo (Vite is detected), build `npm run build`, output `dist`, Deploy.
**Netlify:** push to GitHub, Add new site, Import, build `npm run build`, publish `dist`. Or `npx netlify-cli deploy --prod --dir=dist`.

Both serve over HTTPS, which the PWA install and offline mode need. The icons in `public/` are plain placeholders: replace `icon-192.png` and `icon-512.png` with your own.
