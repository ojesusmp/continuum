# continuum — Usage Guide

How continuum behaves day to day, the full CLI, the status fields explained, and the manual
checkpoint → resume workflow. For installation see the [README](../README.md); for internals see
[`docs/ARCHITECTURE.md`](ARCHITECTURE.md).

---

## 1. The mental model

You usually do **nothing** — continuum is automatic:

- When a session grows large and Claude Code is about to **compact**, the PreCompact hook
  checkpoints a distilled bundle *before* knowledge is compressed away.
- When you open a **fresh session** in that project, the SessionStart hook injects the bundle so
  you resume with the goal, progress, decisions, and next steps — not the 100k-token transcript.

The one manual move worth knowing: when a session feels bloated, **checkpoint, then start
fresh** (`/clear` or a new session). You come back with the knowledge, not the token bill.

---

## 2. Why it saves tokens

Claude Code is event-driven, so *idle time itself is free* — the real cost is re-sending a large
context every turn. Prompt caching discounts that, **but the cache expires after ~5 minutes
idle**. Across an hour-long gap or a compaction event the cache is cold: a bloated session pays
full input price on its next turn and every turn after.

continuum replaces that cold, bloated context with a **~1–3k-token distilled bundle** in a fresh
session. The saving is real *only because the bundle is distilled* — goal, progress, decisions,
next steps — never the raw transcript.

> **Honest scope.** continuum preserves 100% of what was *recorded* (journaled steps, explicit
> decisions, paths, the goal, next steps), not 100% of conversational nuance. Pair it with silex
> (continuous journal) and engram (facts) to maximize recall.

---

## 3. CLI reference

Run against the installed skill (`~/.claude/skills/continuum/bin/continuum.mjs`) or, inside the
repo, `bin/continuum.mjs`.

```
node bin/continuum.mjs status
node bin/continuum.mjs checkpoint [--reason=manual|idle|compact]
node bin/continuum.mjs resume
node bin/continuum.mjs flush
node bin/continuum.mjs install-hooks
node bin/continuum.mjs uninstall-hooks
```

| Command | What it does |
|---|---|
| `status` | Prints a JSON snapshot of the current project's continuum state (see §4). |
| `checkpoint` | Distills the active session into `resume-latest.md`, sets `pending.flag`, writes a memory note, updates `state.json`. `--reason` is recorded on the bundle (default `manual`). |
| `resume` | Prints the pending bundle as a SessionStart hook payload **and consumes the flag**. Mostly used by the hook; handy for inspecting what would be injected. |
| `flush` | Retries engram writes queued in `outbox/`; prints `{ flushed, remaining }`. |
| `install-hooks` | Wires PreCompact + SessionStart into `~/.claude/settings.json` (backs it up first, idempotent). |
| `uninstall-hooks` | Removes continuum's hook entries from `settings.json`. |

### `--reason` values

| Reason | Source | Bundle label |
|---|---|---|
| `manual` | you, via the CLI | `manual checkpoint` |
| `compact` | the PreCompact hook | `context grew large (pre-compact)` |
| `idle` | a future idle watcher | `session went idle` |

---

## 4. Reading `status`

```json
{
  "project": "my-project",
  "projectRoot": "/abs/path/to/project",
  "idleMinutes": 12,
  "pendingResume": false,
  "bundleExists": true,
  "engram": "configured",
  "outboxQueued": 0,
  "silex": "absent"
}
```

| Field | Meaning | Typical values |
|---|---|---|
| `project` | Resolved project name | folder basename, or your override |
| `projectRoot` | Where `.continuum/` lives | absolute path |
| `idleMinutes` | Minutes since the active transcript was last touched | `0` live, `-1` if no transcript found |
| `pendingResume` | Is a bundle waiting to be injected on next SessionStart? | `true` after a checkpoint, `false` once consumed |
| `bundleExists` | Does `resume-latest.md` exist on disk? | `true` after the first checkpoint |
| `engram` | Memory backend state | `local-only` or `configured` |
| `outboxQueued` | Notes waiting to reach engram | `0` healthy; `>0` engram was offline |
| `silex` | Is a `.journal/STATE.md` present? | `present` or `absent` |

A clean, freshly installed project shows `pendingResume: false`, `bundleExists: false`,
`outboxQueued: 0` — all expected.

---

## 5. The manual checkpoint → resume workflow

```
# 1. Mid-task, context feeling heavy — checkpoint:
node ~/.claude/skills/continuum/bin/continuum.mjs checkpoint --reason=manual
#    -> writes resume-latest.md, sets pending.flag

# 2. Confirm it landed:
node ~/.claude/skills/continuum/bin/continuum.mjs status
#    -> pendingResume: true, bundleExists: true

# 3. Start a fresh session (/clear or a new window) in the SAME project folder.
#    The SessionStart hook injects the bundle automatically; pendingResume flips to false.
```

The bundle is injected wrapped in `<continuum-resume-untrusted>` tags — the assistant reads it as
notes and continues from "How to continue", never restarting from scratch.

---

## 6. Trigger phrases

The assistant treats any of these as "checkpoint and resume lean": `continuum`, `/continuum`,
`checkpoint`, `save and resume lean`, `context too high`. It will run a manual checkpoint and
suggest you start a fresh session.

---

## 7. Good habits

- **Add `.continuum/` to `.gitignore`** — it is working state, not source.
- **Checkpoint before you walk away** from a long session, so the next session resumes lean even
  if compaction never fires.
- **Pair with silex** for a continuous step-by-step journal; continuum embeds its `STATE.md` in
  every bundle.
- **Pair with engram** if you want notes to reach a shared cross-agent memory — see
  [`docs/CONFIGURATION.md`](CONFIGURATION.md).

Stuck? See [`docs/TROUBLESHOOTING.md`](TROUBLESHOOTING.md) and the [FAQ](FAQ.md).
