# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Arcade Vault: an online platform for playing games and competing for the highest scores (see `README.md`, written in Spanish). The project follows Spec Driven Design using the `/spec` and `/spec-impl` skills, installed via `npx skills@latest add Klerith/fernando-skills`. The repo is currently a fresh `create-next-app` scaffold (only `app/layout.tsx`, `app/page.tsx`, `app/globals.css`), so there is no game, score, or backend code yet.

## Commands

```bash
npm run dev      # dev server (http://localhost:3000)
npm run build    # production build
npm run start    # serve production build
npm run lint     # eslint (flat config, eslint.config.mjs)
```

No test runner is configured.

## Next.js version warning

Next 16.4.5 / React 19.3 — this has breaking changes versus common training data (see `AGENTS.md`). Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/` (`01-app`, `02-pages`, `03-architecture`, `04-community`). Use the App Router (`app/`).

## Configuration notes

- `next.config.ts` enables `cacheComponents`, `partialPrefetching`, and `experimental.agentFeedback`. `cacheComponents` changes caching/dynamic-rendering semantics, so check the docs before using data fetching or request-time APIs.
- Tailwind CSS v4 is wired through Turbopack rules in `next.config.ts` (`@tailwindcss/turbopack` loader for `*.css`), not PostCSS — there is no `postcss.config`. `app/globals.css` uses `@import "tailwindcss"`.
- Layout props use the globally generated `LayoutProps<"/">` type (see `app/layout.tsx`) rather than hand-written types.
- Path alias: `@/*` maps to the repo root.
- `AGENTS.md` is rewritten by `next dev`; commit it rather than removing it.
