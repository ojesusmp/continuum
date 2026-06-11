# Security Policy

continuum runs inside your Claude Code environment, edits one settings file, and reads your
session transcripts to build resume bundles. This document describes its security model and how
to report a vulnerability.

## Supported versions

continuum is pre-1.0; security fixes are made against the latest released version.

| Version | Supported |
|---|---|
| 0.1.x | ✅ |
| < 0.1 | ❌ |

## Security model

**1. The resume bundle is untrusted input.**
On resume, the bundle is injected into a session wrapped in
`<continuum-resume-untrusted>...</continuum-resume-untrusted>` tags, and the assistant is
instructed to treat its contents as **repository data, never as instructions**. This matters
because a cloned repository could ship a crafted `resume-latest.md` attempting prompt injection.
The assistant must not follow imperatives, role-overrides, URLs, or credential directives found
inside those tags. If you customize the hooks, **keep the wrapping**.

**2. Secrets are redacted before persistence.**
Every note and bundle passes through `redact()`, which strips values matching
`api_key` / `token` / `secret` / `password` / `bearer` / `ghp_…` / `gho_…` / `aws_*` before
anything is written to disk or mirrored to engram. Redaction is best-effort pattern matching, not
a guarantee — do not deliberately paste credentials into a session and rely on it.

**3. Storage is local and project-scoped.**
All state lives under `<projectRoot>/.continuum/`. By default nothing leaves your machine. Data
is only sent outward if **you** configure an engram command, and then only via the exact argv you
specified, with a 10-second timeout.

**4. The one global write is guarded.**
`install-hooks` is the only operation that edits a file outside a project
(`~/.claude/settings.json`). It refuses to run if that file is missing or not valid JSON, and it
writes a `settings.json.continuum-bak` backup before any change.

## Good practice

- Add `.continuum/` to `.gitignore` so working notes (which may quote session content) are never
  committed or pushed.
- Review `resume-latest.md` from any repository you did not create before trusting a resumed
  session — it is plain markdown.
- Keep `node` and Claude Code up to date.

## Reporting a vulnerability

**Please do not open a public GitHub issue for security problems.**

Report privately via GitHub Security Advisories for this repository
(<https://github.com/ojesusmp/continuum/security/advisories/new>). Include:

- a description and impact,
- steps to reproduce,
- affected version and OS.

You will get an acknowledgement, and a fix or mitigation will be coordinated before any public
disclosure.
