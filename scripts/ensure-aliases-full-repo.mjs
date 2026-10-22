#!/usr/bin/env node
// scripts/ensure-aliases.mjs
//
// Guarantees every .md file under content/ has its own relative path in its
// `aliases` front-matter list. Quartz turns those aliases into redirect stubs,
// so old URLs keep working after a rename.
//
// The script only ever adds — never removes. Running it twice is safe.
//
// USAGE
//   node scripts/ensure-aliases.mjs          # one-off sweep of all files
//
// PRE-COMMIT HOOK (recommended — runs automatically on every commit)
//   Create or edit .git/hooks/pre-commit:
//     #!/bin/sh
//     node scripts/ensure-aliases.mjs || exit 1
//   Then make it executable:
//     chmod +x .git/hooks/pre-commit   (Mac/Linux)
//     # On Windows Git Bash the file just needs to exist and be valid sh
//
// REQUIRES: gray-matter — already a Quartz dependency, no extra install needed.

import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, relative, dirname } from 'path'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'

const __dirname  = dirname(fileURLToPath(import.meta.url))
const CONTENT_ROOT = join(__dirname, '..', 'content')

// ── skip rules ────────────────────────────────────────────────────────────────
const SKIP_DIRS = new Set(['_site', '.obsidian'])
const shouldSkip = name => name.startsWith('.') || SKIP_DIRS.has(name)

// ── walk all .md files under a directory ─────────────────────────────────────
function* walkMd(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (shouldSkip(entry.name)) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) yield* walkMd(full)
    else if (entry.name.endsWith('.md')) yield full
  }
}

// ── derive the expected alias from a file's current path ─────────────────────
// content/Illustrations/Tables and Figures/Fig. 100.120 Image of Icosa and Tetra.md
//   → Illustrations/Tables and Figures/Fig. 100.120 Image of Icosa and Tetra
function toAlias(fullPath) {
  return relative(CONTENT_ROOT, fullPath)
    .replace(/\\/g, '/')   // Windows separators → forward slash
    .replace(/\.md$/, '')
}

// ── insert alias surgically — avoids reformatting unrelated front-matter ──────
// `existing` is whatever gray-matter returned for the aliases key.
function withAlias(raw, alias, existing) {
  const bullet = `  - ${alias}`

  // ── no front-matter block at all ──
  if (!raw.startsWith('---')) {
    return `---\naliases:\n${bullet}\n---\n\n${raw}`
  }

  // locate closing ---
  const closeIdx = raw.indexOf('\n---', 3)
  if (closeIdx === -1) return null  // malformed; caller will warn

  const fm   = raw.slice(0, closeIdx)  // everything up to (not incl.) the closing \n---
  const rest = raw.slice(closeIdx)     // the \n--- and everything after it

  // ── no aliases key, or key present but null / empty array ──
  if (
    existing === undefined || existing === null ||
    (Array.isArray(existing) && existing.length === 0)
  ) {
    if (/^aliases:/m.test(fm)) {
      // key exists but carries no value — replace that line in place
      return fm.replace(/^aliases:[ \t]*.*$/m, `aliases:\n${bullet}`) + rest
    }
    // no key at all — insert before the closing ---
    return fm + `\naliases:\n${bullet}` + rest
  }

  // ── inline string value:  aliases: some/old/path ──
  if (typeof existing === 'string') {
    return fm.replace(
      /^aliases:[ \t]+(.+)$/m,
      `aliases:\n  - $1\n${bullet}`
    ) + rest
  }

  // ── normal block array — append after the last list item ──
  const keyMatch = fm.match(/^aliases:[ \t]*\n/m)
  if (!keyMatch) return null  // shouldn't happen

  const blockStart = keyMatch.index + keyMatch[0].length
  const blockLen   = (fm.slice(blockStart).match(/^(?:[ \t]+-[^\n]*\n)*/)?.[0] ?? '').length

  return (
    fm.slice(0, blockStart + blockLen) +
    bullet + '\n' +
    fm.slice(blockStart + blockLen) +
    rest
  )
}

// ── main ──────────────────────────────────────────────────────────────────────
let patched = 0
let warned  = 0

for (const filePath of walkMd(CONTENT_ROOT)) {
  // Normalise line endings on read; avoids regex issues on Windows-edited files.
  // The file is written back with \n. If your repo has a .gitattributes that
  // enforces CRLF, git will handle the conversion at commit time.
  const raw   = readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n')
  const alias = toAlias(filePath)

  let parsed
  try {
    parsed = matter(raw)
  } catch {
    console.warn(`⚠  unparseable front-matter — skipping: ${alias}`)
    warned++
    continue
  }

  const existing = parsed.data.aliases

  // guard against exotic types (object, number, boolean…)
  if (
    existing !== undefined && existing !== null &&
    typeof existing !== 'string' && !Array.isArray(existing)
  ) {
    console.warn(`⚠  aliases is ${typeof existing}, expected array — skipping: ${alias}`)
    warned++
    continue
  }

  // normalise to array just for the membership check
  const list = !existing             ? []
             : Array.isArray(existing) ? existing
             :                          [existing]

  if (list.includes(alias)) continue  // already present — nothing to do

  const updated = withAlias(raw, alias, existing)
  if (updated === null) {
    console.warn(`⚠  could not patch front-matter — skipping: ${alias}`)
    warned++
    continue
  }

  writeFileSync(filePath, updated, 'utf8')
  console.log(`+ ${alias}`)
  patched++
}

console.log(`\n${patched} file(s) patched, ${warned} skipped with warnings.`)
