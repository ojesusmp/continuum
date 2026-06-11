# Contributing to continuum

Thanks for your interest in improving continuum. It is intentionally small — pure Node, zero
dependencies — so contributing is low-ceremony.

## Principles

continuum follows a few non-negotiable design rules. PRs are evaluated against them:

1. **Zero runtime dependencies.** Node builtins only (`fs`, `path`, `os`, `child_process`). No
   npm packages in the skill runtime.
2. **Cross-platform.** It must behave identically on Linux, macOS, and Windows. Use
   `os.homedir()` and `path.join()` — never hardcode separators or absolute paths.
3. **Hooks never throw.** A hook that crashes can break a user's session. Every hook path is
   wrapped in `try/catch` and exits `0`. Keep it that way.
4. **Distilled, never raw.** The resume bundle carries goal/progress/decisions/next-steps only.
   Do not add raw-transcript injection.
5. **Secrets never persist.** Anything written or mirrored passes through `redact()` first.
6. **Project-local storage.** All state stays under `<projectRoot>/.continuum/`.

## Project layout

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full map. In short: the engine is
`skills/continuum/lib/core.mjs`; the CLI and hooks are thin shells over it.

## Development setup

```
git clone https://github.com/ojesusmp/continuum.git
cd continuum
node skills/continuum/bin/continuum.mjs status   # smoke test the CLI
```

No build step, no install of dependencies — it runs straight from source.

## Testing a change manually

continuum has no compiled artifacts; verify behavior directly:

```
# from inside a throwaway project dir:
node /path/to/continuum/skills/continuum/bin/continuum.mjs checkpoint --reason=manual
node /path/to/continuum/skills/continuum/bin/continuum.mjs status      # expect pendingResume: true
node /path/to/continuum/skills/continuum/bin/continuum.mjs resume      # prints + consumes the bundle
node /path/to/continuum/skills/continuum/bin/continuum.mjs status      # expect pendingResume: false
```

For engram changes, test all three states (local-only, mirrored, queued/offline) — see
[`docs/CONFIGURATION.md`](docs/CONFIGURATION.md) §4.

For hook changes, wire them into a test Claude Code profile with `install-hooks`, restart, and
confirm a real PreCompact / SessionStart fires as expected. Always verify `install-hooks` stays
idempotent and that the `settings.json.continuum-bak` backup is written.

## Pull requests

- Keep changes surgical — touch only what the change requires; match the existing style.
- Update the relevant doc (`README.md`, `docs/*`, or `SKILL.md`) in the same PR.
- Add a `CHANGELOG.md` entry under an `Unreleased` heading.
- Describe what you tested and the output you observed.

## Reporting bugs

Open an issue at <https://github.com/ojesusmp/continuum/issues> with your `status` output (it
carries no secrets), your OS, and your Node version. Security issues: see
[`SECURITY.md`](SECURITY.md) — please do **not** open a public issue for those.

## License

By contributing you agree your contributions are licensed under the project's
[MIT License](LICENSE).
