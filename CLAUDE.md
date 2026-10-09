# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Arcade Vault: an online platform to play games and compete for the highest score. The project follows a spec-driven workflow (`/spec` and `/spec-impl`) using the skills from `Klerith/fernando-skills` (installed via `npx skills@latest add Klerith/fernando-skills`). The README is written in Spanish. The repo is currently a fresh Create Next App scaffold; no game or scoring code exists yet.

## Commands

- `npm run dev` — start dev server (Turbopack)
- `npm run build` / `npm run start` — production build / serve
- `npm run lint` — ESLint (flat config in `eslint.config.mjs`, uses `eslint-config-next`)
- No test runner is configured yet.

## Next.js version warning

This uses Next.js 16.4 / React 19.3, which has breaking changes versus common training data (see `AGENTS.md`). Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/` (`01-app`, `02-pages`, `03-architecture`, `04-community`) and heed deprecation notices.

## Architecture

- App Router only, with the `app/` directory at the repo root (no `src/`): `app/layout.tsx`, `app/page.tsx`, `app/globals.css`.
- Path alias `@/*` maps to the repo root (`./*`), not `src/`.
- `next.config.ts` enables non-default features: `cacheComponents: true`, `partialPrefetching: true`, and `experimental.agentFeedback`. `cacheComponents` changes caching/rendering semantics (opt-in caching, dynamic data needs Suspense boundaries), so check the docs before writing data fetching.
- Tailwind CSS v4 is wired through Turbopack via a custom rule in `next.config.ts` (`*.css` → `@tailwindcss/turbopack`), not through a PostCSS config.
- TypeScript is `strict`.
