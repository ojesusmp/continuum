# continuum — Configuration

continuum runs with **zero configuration** — install it, wire the hooks, and it keeps
project-local memory on its own. Everything below is optional and only needed to change the
project name, relocate storage, or mirror memory to an engram backend.

There are two configuration surfaces: a **config file** and a set of **environment variables**.
Environment variables win over the config file where they overlap.

---

## 1. Config file

Path (single, user-global): `~/.claude/continuum/config.json`

```json
{
  "project": "my-project",
  "engram": {
    "cmd": ["engram", "remember", "claude", "{note}", "--project", "{project}", "--kind", "{kind}"]
  }
}
```

| Key | Type | Default | Meaning |
|---|---|---|---|
| `project` | string | the project folder's basename | The name stamped on bundles and passed to engram as `--project`. |
| `engram.cmd` | string[] | *(unset)* | The argv used to mirror a note to engram. If absent, continuum stays local-only. |

The file is read defensively: if it is missing or not valid JSON, continuum silently falls back
to defaults (local-only). It never throws on a bad config.

---

## 2. Environment variables

| Variable | Overrides | Example | Effect |
|---|---|---|---|
| `CONTINUUM_PROJECT_DIR` | `process.cwd()` | `/srv/app` | Treat this path as the project root (where `.continuum/` lives). |
| `CONTINUUM_PROJECT_NAME` | `config.project` / folder name | `billing-api` | Force the project name on bundles + engram. |
| `CONTINUUM_ENGRAM_CMD` | `config.engram.cmd` | `["engram","remember","claude","{note}","--project","{project}","--kind","{kind}"]` | A JSON argv array; mirrors notes to engram without a config file. |

Precedence for the project name: `CONTINUUM_PROJECT_NAME` → `config.project` → folder basename.
Precedence for the engram command: `CONTINUUM_ENGRAM_CMD` → `config.engram.cmd`.

---

## 3. engram integration (optional)

continuum is **engram-agnostic**: it does not import engram or assume any particular binary. It
just runs whatever argv you give it, substituting three placeholders per call:

| Placeholder | Replaced with |
|---|---|
| `{note}` | the (already secret-redacted) note text |
| `{project}` | the resolved project name |
| `{kind}` | the note kind (e.g. `session`) |

Because it is *just an argv*, any backend works. Examples:

**A native binary on PATH:**
```json
{ "engram": { "cmd": ["engram", "remember", "claude", "{note}", "--project", "{project}", "--kind", "{kind}"] } }
```

**A PowerShell script (Windows):**
```json
{ "engram": { "cmd": ["pwsh", "-NoProfile", "-File", "C:/path/engram.ps1", "remember", "claude", "{note}", "--project", "{project}", "--kind", "{kind}"] } }
```

**A Python entrypoint:**
```json
{ "engram": { "cmd": ["python3", "/opt/engram/cli.py", "remember", "{note}", "--project", "{project}"] } }
```

The command runs with a 10-second timeout and `windowsHide: true`. A non-zero exit (or a throw)
is treated as "engram unreachable" and the note is queued — see §4.

---

## 4. The three memory states

No matter how engram is configured, the **local JSONL is always written first**, so a note can
never be lost:

| State | Condition | `status` shows | Where the note lands |
|---|---|---|---|
| Local-only | no `engram.cmd` configured | `engram: local-only` | `.continuum/memory/notes.jsonl` |
| Mirrored | `engram.cmd` set, command exits 0 | `engram: configured` | local JSONL **and** engram |
| Queued (offline) | `engram.cmd` set, command fails/times out | `engram: configured`, `outboxQueued > 0` | local JSONL **and** `.continuum/outbox/<id>.json` |

Queued notes are replayed automatically on the next successful checkpoint, or on demand:

```
node ~/.claude/skills/continuum/bin/continuum.mjs flush
```

`flush` prints `{ "flushed": N, "remaining": M }`. Items that land are deleted from the outbox;
items that still fail stay queued for the next attempt.

---

## 5. Storage layout

All runtime state is project-local under `<projectRoot>/.continuum/`:

```
<projectRoot>/.continuum/
├── resume-latest.md     distilled bundle injected on the next SessionStart
├── pending.flag         consume-once resume marker (ISO timestamp)
├── state.json           { lastCheckpoint, reason, transcript }
├── memory/notes.jsonl   local durable memory — always written, source of truth
└── outbox/*.json        engram writes queued while engram was unreachable
```

Add `.continuum/` to your project's `.gitignore` — it is working state, not source.

---

## 6. silex integration (automatic, no config)

If a project has a silex journal at `.journal/STATE.md`, continuum reads it and embeds the
snapshot in every bundle under a "silex journal snapshot" heading. No configuration is needed —
it is detected per checkpoint. If the file is absent, the bundle simply notes that none exists.

See [`docs/USAGE.md`](USAGE.md) for day-to-day commands and [`docs/TROUBLESHOOTING.md`](TROUBLESHOOTING.md)
if a setting does not seem to take effect.
