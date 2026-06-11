# continuum

**Project continuity across Claude Code session boundaries — at near-zero token cost.**

`continuum` checkpoints a small, distilled **resume bundle** (goal · progress · key decisions ·
file paths · next steps) right before Claude Code compacts a large context, and on demand. The
next session starts **fresh and lean**, and a SessionStart hook injects that bundle — so you
continue a big project with the important knowledge instead of paying to re-read 100k+ tokens
of stale context every turn.

It is the snapshot/resume companion to:
- **[silex](https://github.com/ojesusmp/Silex)** — continuous append-only journal (every step)
- **engram** — durable cross-agent memory (facts)

continuum fills the gap between them: the across-session checkpoint + lean resume.

---

## Why it actually saves tokens

Claude Code is event-driven, so **idle time itself is free** — the cost is re-sending a large
context every turn. Prompt caching discounts that, **but the cache expires after ~5 minutes
idle.** Across a gap of an hour, or a compaction event, the cache is cold: a bloated session
pays full input price on its next turn and every turn after. continuum replaces that with a
~1–3k-token distilled bundle in a fresh session.

The saving is real **only because the bundle is distilled** — goal, progress, decisions, next
steps. continuum never re-injects the raw transcript.

> **Honest scope of "keeps 100% of knowledge":** continuum preserves 100% of what was
> *recorded* — journaled steps, explicit decisions, paths, the goal, next steps — not 100% of
> conversational nuance. The triad of silex (continuous journal) + PreCompact dump + engram
> (facts) maximizes recall; it does not claim total transcript fidelity.

---

## Install

continuum is cross-platform (Linux · macOS · Windows). It needs `node` on PATH (Claude Code
already requires it) and zero npm dependencies.

### Option A — Claude Code plugin
```
/plugin marketplace add ojesusmp/continuum
/plugin install continuum
```

### Option B — npx (npm)
```
npx @ojesusmp/continuum
```

### Option C — git clone
```
git clone https://github.com/ojesusmp/continuum.git
node continuum/bin/install.js
```

All three copy the skill to `~/.claude/skills/continuum/`. Then wire the hooks (one command,
same on every OS):

```
node ~/.claude/skills/continuum/bin/continuum.mjs install-hooks
```

Restart Claude Code.

### Verify (any OS)
```
node ~/.claude/skills/continuum/bin/continuum.mjs status
```
Expected: JSON with `project`, `idleMinutes`, `pendingResume`, `engram`, `outboxQueued`.

---

## How it works

| Trigger | When | Action |
|---|---|---|
| **PreCompact** (auto) | Claude Code is about to compact a large context | Distill goal/progress/decisions/next → write bundle + journal + memory **before** knowledge is compressed away |
| **SessionStart** (auto) | A fresh session opens in a project with a pending checkpoint | Inject the bundle (as untrusted data), consume the flag once |
| **Manual** | You type `checkpoint` / "save and resume lean" | Same as PreCompact, on demand — then start a fresh session to resume lean |

Storage is **project-local** (no cross-project bleed):

```
<projectRoot>/.continuum/
├── resume-latest.md   distilled bundle injected on next SessionStart
├── pending.flag       consume-once resume marker
├── state.json         last checkpoint metadata
├── memory/notes.jsonl local durable memory (always written; source of truth)
└── outbox/*.json      engram writes queued while engram was unreachable
```

Add `.continuum/` to your `.gitignore` — it holds working notes, not source.

---

## CLI

```
node bin/continuum.mjs status          # idle minutes, pending resume, engram backend, outbox
node bin/continuum.mjs checkpoint [--reason=manual|idle|compact]
node bin/continuum.mjs resume          # print + consume the pending bundle
node bin/continuum.mjs flush           # retry queued engram writes (outbox -> engram)
node bin/continuum.mjs install-hooks   # wire PreCompact + SessionStart into settings.json
node bin/continuum.mjs uninstall-hooks
```

---

## engram-optional

continuum works with **no configuration** (local memory only). To mirror notes to engram, set
either the `CONTINUUM_ENGRAM_CMD` env var (a JSON argv array) or
`~/.claude/continuum/config.json`:

```json
{
  "project": "my-project",
  "engram": {
    "cmd": ["engram", "remember", "claude", "{note}", "--project", "{project}", "--kind", "{kind}"]
  }
}
```

`{note}` `{project}` `{kind}` are substituted per call. **Any** command/argv works — a binary,
or `["pwsh","-NoProfile","-File","/path/engram.ps1","remember", ...]` — which is what makes it
engram-agnostic and cross-platform.

Three states, all handled:
- **No engram configured** → local memory only (`memory/notes.jsonl`).
- **engram reachable** → note mirrored to engram.
- **engram configured but offline** → note queued to `outbox/`, auto-flushed on the next
  successful run. Local memory is always written first, so nothing is ever lost.

---

## Security

The resume bundle is injected wrapped in `<continuum-resume-untrusted>...</continuum-resume-untrusted>`
tags. The assistant treats its contents as **repository data, never instructions** — a cloned
repo could ship a crafted bundle. Secrets (api keys, tokens, bearer, `ghp_`/`gho_`, `aws_*`)
are redacted before anything is persisted.

---

## Documentation

Detailed guides live in [`docs/`](docs/):

| Guide | What's in it |
|---|---|
| [Usage](docs/USAGE.md) | Day-to-day workflow, full CLI, every `status` field, manual checkpoint→resume |
| [Configuration](docs/CONFIGURATION.md) | Config file, env vars, engram setup, the three memory states |
| [Architecture](docs/ARCHITECTURE.md) | Module map, checkpoint/resume data flow, bundle lifecycle, design decisions |
| [Troubleshooting](docs/TROUBLESHOOTING.md) | Hooks not firing, install errors, offline engram, uninstalling |
| [FAQ](docs/FAQ.md) | Common questions about scope, privacy, platforms |
| [Contributing](CONTRIBUTING.md) | Dev setup, design rules, how to test, PRs |
| [Security](SECURITY.md) | Threat model, secret redaction, how to report a vulnerability |

---

## Support

continuum is free and MIT-licensed. If it saves you tokens and time, you can help fund its
development:

[![Sponsor](https://img.shields.io/badge/Sponsor-%E2%9D%A4-db61a2?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/ojesusmp)

- **Sponsor on GitHub:** <https://github.com/sponsors/ojesusmp> — click the **Sponsor** button at
  the top of the repository.
- **No budget?** Starring the repo, reporting bugs, and sending PRs help just as much.

---

## Roadmap (not in v0.1)

- Optional OS idle-watcher add-on (Windows Scheduled Task / macOS launchd / Linux cron) for
  capturing true >1h idle gaps. v0.1 is hooks-only on purpose: silex already journals
  continuously, and PreCompact captures the real knowledge-loss event.
- Optional semantic recall over `memory/notes.jsonl`.

---

## License

MIT © 2026 ojesusmp
