#!/usr/bin/env node
// continuum PreCompact hook: fires right before Claude Code compacts a large context.
// Distills done + next + key state into a resume bundle + journal/engram BEFORE the
// knowledge is compressed away. Silent + non-throwing: a hook must never break a session.
import * as core from '../lib/core.mjs';

let input = '';
let done = false;
function run(transcriptPath) {
  if (done) return;
  done = true;
  try { core.checkpoint({ reason: 'compact', transcriptPath }); } catch { /* never throw from a hook */ }
  process.exit(0);
}

const guard = setTimeout(() => run(null), 4000); // if no stdin is piped, still checkpoint
process.stdin.on('data', d => { input += d; });
process.stdin.on('end', () => {
  clearTimeout(guard);
  let transcriptPath = null;
  try { transcriptPath = (JSON.parse(input || '{}')).transcript_path || null; } catch { /* ignore */ }
  run(transcriptPath);
});
