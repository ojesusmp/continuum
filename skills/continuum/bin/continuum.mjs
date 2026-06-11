#!/usr/bin/env node
// continuum CLI — status | checkpoint | resume | flush | install-hooks | uninstall-hooks
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import * as core from '../lib/core.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.resolve(__dirname, '..');           // .../skills/continuum
const HOOK_PRECOMPACT = path.join(SKILL_ROOT, 'hooks', 'precompact.mjs');
const HOOK_SESSIONSTART = path.join(SKILL_ROOT, 'hooks', 'sessionstart.mjs');
const SETTINGS = path.join(os.homedir(), '.claude', 'settings.json');

const MARK = 'continuum/hooks';   // marker substring used for idempotency

function nodeCmd(scriptPath) {
  // quote for the shell the hook runs under; works on win + posix
  return `node "${scriptPath}"`;
}

function installHooks() {
  if (!fs.existsSync(SETTINGS)) {
    console.error(`settings.json not found at ${SETTINGS} — is Claude Code installed for this user?`);
    process.exit(1);
  }
  const raw = fs.readFileSync(SETTINGS, 'utf8');
  let cfg;
  try { cfg = JSON.parse(raw); } catch (e) {
    console.error(`settings.json is not valid JSON (${e.message}). Aborting to avoid corruption.`);
    process.exit(1);
  }
  fs.writeFileSync(SETTINGS + '.continuum-bak', raw, 'utf8'); // backup
  cfg.hooks = cfg.hooks || {};

  const ensure = (event, scriptPath) => {
    cfg.hooks[event] = cfg.hooks[event] || [];
    const already = JSON.stringify(cfg.hooks[event]).includes(MARK) &&
                    JSON.stringify(cfg.hooks[event]).includes(path.basename(scriptPath));
    if (already) return false;
    cfg.hooks[event].unshift({ hooks: [{ type: 'command', command: nodeCmd(scriptPath) }] });
    return true;
  };

  const a = ensure('SessionStart', HOOK_SESSIONSTART);
  const b = ensure('PreCompact', HOOK_PRECOMPACT);
  fs.writeFileSync(SETTINGS, JSON.stringify(cfg, null, 2), 'utf8');
  console.log(`continuum hooks wired into ${SETTINGS}`);
  console.log(`  SessionStart: ${a ? 'added' : 'already present'}`);
  console.log(`  PreCompact  : ${b ? 'added' : 'already present'}`);
  console.log(`  backup      : ${SETTINGS}.continuum-bak`);
  console.log('Restart Claude Code for hooks to take effect.');
}

function uninstallHooks() {
  if (!fs.existsSync(SETTINGS)) return;
  const cfg = JSON.parse(fs.readFileSync(SETTINGS, 'utf8'));
  for (const ev of ['SessionStart', 'PreCompact']) {
    if (!Array.isArray(cfg.hooks?.[ev])) continue;
    cfg.hooks[ev] = cfg.hooks[ev].filter(entry => !JSON.stringify(entry).includes(MARK));
  }
  fs.writeFileSync(SETTINGS, JSON.stringify(cfg, null, 2), 'utf8');
  console.log('continuum hooks removed from settings.json');
}

const [action = 'status', ...rest] = process.argv.slice(2);
const reasonArg = (rest.find(a => a.startsWith('--reason=')) || '').split('=')[1] || 'manual';

switch (action) {
  case 'status':
    console.log(JSON.stringify(core.status(), null, 2));
    break;
  case 'checkpoint': {
    const r = core.checkpoint({ reason: reasonArg });
    console.log(`checkpoint (${r.reason}) -> ${r.bundle}  | memory: ${r.memory.engram}`);
    break;
  }
  case 'resume': {
    const out = core.emitResume();
    if (out) process.stdout.write(JSON.stringify(out));
    else console.log('(no pending resume)');
    break;
  }
  case 'flush':
    console.log(JSON.stringify(core.flushOutbox(), null, 2));
    break;
  case 'install-hooks':
    installHooks();
    break;
  case 'uninstall-hooks':
    uninstallHooks();
    break;
  default:
    console.log('continuum — usage: status | checkpoint [--reason=manual|idle|compact] | resume | flush | install-hooks | uninstall-hooks');
}
