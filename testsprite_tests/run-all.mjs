#!/usr/bin/env node
/**
 * Runs every testsprite_tests/TC*.py with Python Playwright (same style as TestSprite MCP).
 * Prerequisite: serve the app (e.g. ng serve) so http://localhost:4200 responds — URLs are set in each .py file.
 */
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const python = process.env.PYTHON ?? 'python3';

const files = readdirSync(__dirname)
  .filter((f) => /^TC\d+_.*\.py$/.test(f))
  .sort();

if (files.length === 0) {
  console.error('No TC*.py files found in', __dirname);
  process.exit(1);
}

console.log(`testsprite:local — ${files.length} script(s) (python: ${python})\n`);

for (const f of files) {
  console.log(`=== ${f} ===`);
  const r = spawnSync(python, [join(__dirname, f)], {
    stdio: 'inherit',
    env: process.env,
  });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

console.log(`\nAll ${files.length} TestSprite Python scripts passed.`);
