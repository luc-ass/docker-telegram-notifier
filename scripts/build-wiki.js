#!/usr/bin/env node
/**
 * Renders docs/ into the flat page layout a GitHub wiki expects.
 *
 * The wiki lives in its own repository, so it cannot follow the relative
 * links docs/ uses: `securing-the-docker-socket.md` has to become
 * `Securing-the-Docker-Socket`, and anything pointing outside docs/ has to
 * become an absolute URL into the code repository.
 *
 * Page order comes from the table in docs/README.md rather than the
 * filesystem, so the sidebar keeps the order a reader was meant to see and a
 * new page is picked up by adding it to that table.
 *
 * Usage: node scripts/build-wiki.js [docs] [outdir]
 */
const fs = require('fs');
const path = require('path');

const [, , docsDir = 'docs', outDir = 'wiki'] = process.argv;

const REPO = 'https://github.com/luc-ass/docker-telegram-notifier';
const BLOB = `${REPO}/blob/main`;

// Words a title case leaves alone, so `chats-and-topics` reads as
// "Chats and Topics" rather than "Chats And Topics".
const SMALL_WORDS = new Set(['a', 'an', 'and', 'as', 'at', 'for', 'from',
  'in', 'of', 'on', 'or', 'the', 'to', 'via', 'with']);

function fail(message) {
  console.error(message);
  process.exit(1);
}

/** docs/basic-setup.md -> Basic-Setup, docs/README.md -> Home */
function pageName(file) {
  const base = path.basename(file, '.md');
  if (base === 'README') return 'Home';

  return base.split('-')
    .map((word, i) => i > 0 && SMALL_WORDS.has(word) ?
      word : word.charAt(0).toUpperCase() + word.slice(1))
    .join('-');
}

function read(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch (e) {
    fail(`Could not read ${file}: ${e.message}`);
  }
}

/**
 * The order of the documentation table in docs/README.md, which doubles as
 * the list of pages worth syncing. A page missing from it would end up in the
 * wiki with no way to navigate to it, so that is an error rather than a
 * default to alphabetical.
 */
function orderedPages(index) {
  const linked = [...index.matchAll(/\]\(([a-z0-9-]+\.md)\)/g)].map(m => m[1]);
  const onDisk = fs.readdirSync(docsDir)
    .filter(f => f.endsWith('.md') && f !== 'README.md');

  const missing = onDisk.filter(f => !linked.includes(f));
  if (missing.length > 0) {
    fail(`Not listed in ${docsDir}/README.md, so unreachable in the wiki: ` +
      missing.join(', '));
  }

  return linked;
}

/**
 * Relative links are the whole reason this script exists: the wiki resolves
 * them against its own flat namespace, so every one of them has to be
 * rewritten or turned into an absolute URL.
 */
function rewriteLinks(body, file, pages) {
  return body.replace(/\]\((?!https?:)([^)]+)\)/g, (match, target) => {
    const [target_, anchor = ''] = target.split(/(#.*)$/);
    const suffix = anchor;

    if (target_.startsWith('../')) {
      return `](${BLOB}/${target_.slice(3)}${suffix})`;
    }

    if (target_.endsWith('.md')) {
      if (!pages.includes(target_) && target_ !== 'README.md') {
        fail(`${file} links to ${target_}, which is not a wiki page`);
      }
      return `](${pageName(target_)}${suffix})`;
    }

    // A bare anchor stays put; anything else points at a repository file.
    return target_ === '' ? match : `](${BLOB}/${target_}${suffix})`;
  });
}

const index = read(path.join(docsDir, 'README.md'));
const pages = orderedPages(index);

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const file of ['README.md', ...pages]) {
  const body = rewriteLinks(read(path.join(docsDir, file)), file, pages);
  fs.writeFileSync(path.join(outDir, `${pageName(file)}.md`), body);
}

const sidebar = pages
  .map(file => `- [${pageName(file).replace(/-/g, ' ')}](${pageName(file)})`)
  .join('\n');

fs.writeFileSync(path.join(outDir, '_Sidebar.md'),
  `### [Documentation](Home)\n\n${sidebar}\n`);

fs.writeFileSync(path.join(outDir, '_Footer.md'),
  `_Generated from [\`docs/\`](${BLOB}/docs) — edits made here are ` +
  `overwritten by the next sync. Open a pull request against the ` +
  `repository instead._\n`);

console.log(`Wrote ${pages.length + 3} pages to ${outDir}/`);
