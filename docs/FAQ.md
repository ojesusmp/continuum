# continuum — FAQ

**Q. Do I have to do anything during normal work?**
No. Once the hooks are wired and Claude Code is restarted, continuum checkpoints before
compaction and resumes on the next fresh session automatically. The only manual move is typing
`checkpoint` when you want to deliberately reset to a lean session.

**Q. How is this different from Claude Code's built-in compaction?**
Compaction summarizes your context to keep going *in the same session*. continuum instead writes
a small distilled bundle **before** compaction and lets you start a **fresh, low-token session**
that pays for ~1–3k tokens of resume bundle rather than the full cold context. It targets the
cost that survives compaction: re-sending a large context every turn after the cache goes cold.

**Q. Does it really keep "100% of my knowledge"?**
It keeps 100% of what was *recorded* — the goal, journaled steps, explicit decisions, file paths,
and next steps — not 100% of conversational nuance. Distillation is the whole point; re-injecting
the raw transcript would defeat the token saving. Pair it with silex and engram to maximize
recall.

**Q. What does it send anywhere / what are the privacy implications?**
By default, nothing leaves your machine — memory is a local `notes.jsonl` file under your
project. It only talks to engram if **you** configure an engram command, and even then it runs a
command *you* specified. Secrets (api keys, tokens, bearer, `ghp_`/`gho_`, `aws_*`) are redacted
before anything is written or sent.

**Q. Where is my data stored?**
Project-local, under `<projectRoot>/.continuum/` — the bundle, a pending flag, checkpoint
metadata, the local memory JSONL, and an outbox for queued engram writes. Add `.continuum/` to
`.gitignore`.

**Q. Will one project's bundle leak into another project?**
No. Storage is keyed to the project root, so a session only ever sees its own project's bundle.

**Q. Do I need engram?**
No. continuum is fully functional local-only. engram is an optional mirror for shared,
cross-agent memory — see [`docs/CONFIGURATION.md`](CONFIGURATION.md).

**Q. Does it work on Windows / macOS / Linux?**
Yes. It is pure Node with zero dependencies and uses `os.homedir()` everywhere, so the same
commands and hook wiring work on all three.

**Q. What Node version do I need?**
Node ≥ 18 (Claude Code already requires Node). There are no npm dependencies to install.

**Q. Is there a background daemon watching me?**
No. v0.1 is hooks-only — it acts on PreCompact and SessionStart events, nothing else. An optional
OS idle-watcher is on the roadmap but deliberately excluded from v0.1.

**Q. The resume bundle comes from a cloned repo — can it inject instructions into my session?**
The bundle is injected wrapped in `<continuum-resume-untrusted>` tags and the assistant is
instructed to treat its contents as **data, never instructions**. This is exactly to defend
against a cloned repository shipping a crafted bundle. See [`SECURITY.md`](../SECURITY.md).

**Q. How do I support the project?**
If continuum saves you tokens and time, you can sponsor its development — see **Support** in the
[README](../README.md#support). Bug reports and PRs are equally welcome.

**Q. Can I uninstall cleanly?**
Yes — `uninstall-hooks` removes the hook entries; deleting `~/.claude/skills/continuum/` removes
the skill. Per-project `.continuum/` folders are left alone for you to remove if you want.
