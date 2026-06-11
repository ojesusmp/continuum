#!/usr/bin/env node
// continuum SessionStart hook: if this project has a pending checkpoint, inject the
// resume bundle as additionalContext (wrapped untrusted) so a fresh lean session
// continues with full knowledge. Consumes the flag once. Silent when nothing pending.
import * as core from '../lib/core.mjs';

let done = false;
function finish() {
  if (done) return; done = true;
  try {
    const out = core.emitResume();
    if (out) process.stdout.write(JSON.stringify(out));
  } catch { /* never throw from a hook */ }
  process.exit(0);
}
// SessionStart may or may not pipe stdin; don't block on it.
const guard = setTimeout(finish, 1500);
let input = '';
process.stdin.on('data', d => { input += d; });
process.stdin.on('end', () => { clearTimeout(guard); finish(); });
