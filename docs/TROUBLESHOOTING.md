# continuum — Troubleshooting

Symptoms, causes, and fixes. Every check uses the CLI you already have:
`node ~/.claude/skills/continuum/bin/continuum.mjs <command>`.

---

## The bundle is not injected when I start a new session

**Most common cause: the hooks are wired but Claude Code has not been restarted.** Hooks load at
startup only.

1. Confirm a checkpoint exists and is pending:
   ```
   node ~/.claude/skills/continuum/bin/continuum.mjs status
   ```
   You want `bundleExists: true` and `pendingResume: true`. If `pendingResume` is already
   `false`, the bundle was consumed by a previous session — checkpoint again.
2. Confirm the hooks are actually in `settings.json`:
   - Open `~/.claude/settings.json` and look for two entries whose `command` contains
     `continuum/hooks` (`precompact.mjs` and `sessionstart.mjs`).
   - If they are missing, run `install-hooks` and **restart Claude Code**.
3. Make sure you opened the fresh session in the **same project folder**. Storage is
   project-local: a bundle written under `/projA/.continuum/` is only injected for sessions whose
   project root is `/projA`.

---

## `install-hooks` fails or refuses to run

| Message | Cause | Fix |
|---|---|---|
| `settings.json not found at …` | Claude Code settings do not exist for this user yet | Launch Claude Code once so it creates `~/.claude/settings.json`, then re-run. |
| `settings.json is not valid JSON … Aborting` | Your settings file has a syntax error | Fix the JSON (a trailing comma is the usual culprit). continuum refuses to write rather than corrupt it. |

A backup is always written to `~/.claude/settings.json.continuum-bak` before any change. To
revert, copy it back over `settings.json`.

Re-running `install-hooks` is safe — it is idempotent and prints `already present` instead of
duplicating entries.

---

## `idleMinutes` is `-1`

`-1` means continuum found **no active transcript** under `~/.claude/projects/`. This is normal
right after install, or if you are running the CLI outside a real Claude Code session. It does
not block checkpointing — the bundle is still written from whatever transcript tail is available
(possibly empty, which simply yields "not captured" fields).

---

## The Goal / Progress fields say "(not captured)"

The bundle's Goal comes from the last **user** message and Progress from the last **assistant**
message in the active transcript. They read "not captured" when:

- the checkpoint ran before any messages were exchanged, or
- no transcript could be located (`idleMinutes: -1`).

This is cosmetic and self-resolves once there is real conversation to distill. Pairing with silex
gives the bundle a `STATE.md` snapshot even when the transcript tail is thin.

---

## `engram: configured` but `outboxQueued` keeps growing

continuum reached your configured engram command and it failed (non-zero exit or a >10s timeout),
so notes are being queued safely to `outbox/`. Nothing is lost — the local JSONL is always
written first.

1. Test your engram command **by hand** with the same argv from your config / `CONTINUUM_ENGRAM_CMD`.
2. Fix whatever it reports (wrong path, backend down, auth).
3. Replay the queue:
   ```
   node ~/.claude/skills/continuum/bin/continuum.mjs flush
   ```
   `{ "flushed": N, "remaining": 0 }` means the queue drained.

See [`docs/CONFIGURATION.md`](CONFIGURATION.md) §3–4 for the engram command format.

---

## I want to stop the bundle from resuming next time

Two ways:

- **Consume it:** `node ~/.claude/skills/continuum/bin/continuum.mjs resume` prints and clears the
  pending flag, so the next SessionStart injects nothing.
- **Drop the flag:** delete `<projectRoot>/.continuum/pending.flag`. `status` then shows
  `pendingResume: false`. The `resume-latest.md` file can stay — it is overwritten on the next
  checkpoint.

---

## `node: command not found` when a hook fires

continuum's hooks invoke `node`. Claude Code already requires Node, but if your shell environment
for hooks lacks it on `PATH`, the hook silently no-ops (hooks never throw by design). Ensure
`node` is on the PATH that Claude Code launches hooks under, then restart.

---

## Uninstalling

```
node ~/.claude/skills/continuum/bin/continuum.mjs uninstall-hooks   # remove hook entries
```

Then delete `~/.claude/skills/continuum/` if you want the skill gone too. Per-project
`.continuum/` folders are never touched by install/uninstall — remove them manually if desired.

---

Still stuck? Open an issue with your `status` output (it contains no secrets):
<https://github.com/ojesusmp/continuum/issues>
