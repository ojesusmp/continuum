# Changelog

All notable changes to continuum are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/); versions follow SemVer.

## [Unreleased]

### Added
- **Documentation suite** under `docs/`: Usage, Configuration, Architecture, Troubleshooting,
  and FAQ guides.
- **CONTRIBUTING.md** and **SECURITY.md** community-health files.
- **GitHub Sponsors** funding config (`.github/FUNDING.yml`) and a Support section in the README.

## [0.1.0] - 2026-06-11

Initial release. Hooks-only core (no OS scheduler), cross-platform, zero dependencies.

### Added
- **PreCompact hook** — checkpoints a distilled resume bundle right before Claude Code
  compacts a large context, so knowledge is captured before it is compressed away.
- **SessionStart hook** — injects the latest pending bundle into a fresh session
  (wrapped as untrusted data), consumes the flag once, silent when nothing pending.
- **CLI** (`bin/continuum.mjs`): `status`, `checkpoint [--reason]`, `resume`, `flush`,
  `install-hooks`, `uninstall-hooks`.
- **Engram-optional memory**: local `.continuum/memory/notes.jsonl` is always written
  (source of truth); mirrors to engram when configured; queues to `outbox/` when engram
  is configured-but-unreachable and flushes automatically when it returns.
- **Project-local storage** under `<projectRoot>/.continuum/` — no cross-project bleed.
- **Secret redaction** before any persistence (api keys, tokens, bearer, ghp_/gho_, aws_*).
- **silex integration**: reads `.journal/STATE.md` into the bundle when present.
- Install paths: Claude Code plugin, `npx @ojesusmp/continuum`, and git clone.

### Deliberately not included (see Roadmap in README)
- OS-level idle watcher (Scheduled Task / launchd / cron) — optional future add-on.
- Semantic recall over local memory.
