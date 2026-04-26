## Configured Feeds

This instance runs two daily briefs:

- **AI Pulse** (6:30am) — Tracks frontier AI labs, model releases, agentic systems
- **Market Brief** (7:00am) — Personal portfolio + macro signals

Both use the same orchestrator-worker pipeline (Haiku triage → Sonnet synthesis).
Add your own feed in `feeds/` — see [feeds/README.md](feeds/README.md).
