#!/usr/bin/env node
/**
 * continuum installer.
 *
 * Copies the bundled skill content from the package's `skills/continuum/` directory
 * into the user's Claude Code skills folder:  <homedir>/.claude/skills/continuum/
 *
 * Cross-platform: uses os.homedir() so the same script works on Linux, macOS, and
 * Windows. No personal paths embedded. Your projects' .continuum/ folders are never
 * touched. After copying, it prints the one command that wires the hooks.
 *
 * Plugin alternative: `/plugin install ojesusmp/continuum` inside Claude Code.
 */
const fs = require("fs");
const path = require("path");
const os = require("os");

const PKG_ROOT = path.resolve(__dirname, "..");
const SOURCE = path.join(PKG_ROOT, "skills", "continuum");
const TARGET = path.join(os.homedir(), ".claude", "skills", "continuum");

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

function countFiles(dir) {
  let n = 0;
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry);
    if (fs.statSync(p).isDirectory()) n += countFiles(p);
    else n++;
  }
  return n;
}

function main() {
  console.log("continuum installer");
  console.log("  source : " + SOURCE);
  console.log("  target : " + TARGET);

  if (!fs.existsSync(SOURCE)) {
    console.error("\ncontinuum installer failed: skill source missing at " + SOURCE);
    console.error("The package may be packed incorrectly. File an issue: https://github.com/ojesusmp/continuum/issues");
    process.exit(1);
  }

  if (fs.existsSync(TARGET)) {
    console.log("\n  target exists — overwriting skill files (project .continuum/ folders are NOT touched).");
  }
  fs.mkdirSync(TARGET, { recursive: true });
  copyRecursive(SOURCE, TARGET);

  console.log("\ncontinuum installed (" + countFiles(TARGET) + " files) at " + TARGET);
  console.log("");
  console.log("Next steps:");
  console.log("  1. Wire the hooks (PreCompact + SessionStart) into your settings.json:");
  console.log("       node \"" + path.join(TARGET, "bin", "continuum.mjs") + "\" install-hooks");
  console.log("  2. Restart Claude Code.");
  console.log("  3. (optional) Point continuum at engram — see README 'engram-optional'.");
  console.log("");
  console.log("Docs: https://github.com/ojesusmp/continuum");
}

try {
  main();
} catch (err) {
  console.error("continuum installer failed: " + err.message);
  process.exit(1);
}
