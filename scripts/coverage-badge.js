#!/usr/bin/env node
/**
 * Turns an lcov report into a shields.io endpoint badge description.
 *
 * Line coverage is summed across files rather than averaged, so a small
 * fully-covered file cannot flatter a large uncovered one.
 *
 * Usage: node scripts/coverage-badge.js [lcov.info] [coverage.json]
 */
const fs = require('fs');

const [, , lcovPath = 'lcov.info', outPath = 'coverage.json'] = process.argv;

let report;
try {
  report = fs.readFileSync(lcovPath, 'utf8');
} catch (e) {
  console.error(`Could not read the lcov report at ${lcovPath}: ${e.message}`);
  process.exit(1);
}

let found = 0;
let hit = 0;
for (const line of report.split('\n')) {
  if (line.startsWith('LF:')) found += Number.parseInt(line.slice(3), 10);
  else if (line.startsWith('LH:')) hit += Number.parseInt(line.slice(3), 10);
}

if (found === 0) {
  console.error(`No line records in ${lcovPath}; refusing to publish a badge.`);
  process.exit(1);
}

const percent = (hit / found) * 100;

// The colour has to be decided here: shields only applies its own scale to
// its built-in badges, not to endpoint ones.
const colour =
  percent >= 90 ? 'brightgreen' :
  percent >= 80 ? 'green' :
  percent >= 70 ? 'yellowgreen' :
  percent >= 60 ? 'yellow' :
  percent >= 50 ? 'orange' : 'red';

const badge = {
  schemaVersion: 1,
  label: 'coverage',
  message: `${percent.toFixed(0)}%`,
  color: colour
};

fs.writeFileSync(outPath, JSON.stringify(badge, null, 2) + '\n');
console.log(`${hit}/${found} lines covered - ${badge.message} (${colour}) written to ${outPath}`);
