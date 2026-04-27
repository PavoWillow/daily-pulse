# daily-pulse

> Personalized morning intelligence agent — triages feeds with Claude Haiku, synthesizes a daily brief with Claude Sonnet.

**Status: Under active development. v0.1 scaffolded 2026-04-26. First feed coming soon.**

## How it works

1. **Triage pass (Haiku)** — Fetches RSS/Atom feeds, scores each item for relevance.
2. **Synthesis pass (Sonnet)** — Distills the top items into a concise morning brief.
3. **Delivery** — Brief is committed to `briefs/` as a markdown file via GitHub Actions cron.

## Roadmap

- [x] v0.1 — Project scaffold (TypeScript, pnpm, Anthropic SDK)
- [x] v0.2a — Feed config schema + AI Pulse sources verified
- [ ] v0.2b — RSS feed fetcher + Haiku triage pass
- [ ] v0.3 — Sonnet synthesis pass → markdown brief
- [ ] v0.4 — GitHub Actions cron + auto-commit to briefs/
- [ ] v0.5 — First production feed (AI Pulse) running daily

## Local development

```bash
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

pnpm install
pnpm dev          # tsx watch — restarts on save
pnpm start        # single run
pnpm build        # tsc compile to dist/
```

## Project structure

```
src/            TypeScript source
feeds/          Feed config files (one per source)
briefs/         Generated daily briefs (committed by CI)
.github/
  workflows/    GitHub Actions (added in v0.4)
```

## Requirements

- Node >= 20
- pnpm
- Anthropic API key (`ANTHROPIC_API_KEY` in `.env`)
