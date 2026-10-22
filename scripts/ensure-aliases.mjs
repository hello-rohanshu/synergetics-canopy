#!/usr/bin/env node
// scripts/ensure-aliases.mjs
//
// Guarantees every .md file under content/ has its own relative path in its
// `aliases` front-matter list. Quartz turns those aliases into redirect stubs,
// so old URLs keep working after a rename.
//
// The script only ever adds — never removes. Running it twice is safe.
//
// MODES
//   Full repo sweep (manual):
//     node scripts/ensure-aliases.mjs
//
//   Staged-files only (pre-commit hook):
//     Reads staged paths from stdin; prints patched absolute paths to stdout.
//     Warnings and summary go to stderr so they don't pollute the pipeline.
//
// HOOK SETUP — run once from repo root:
//   cat > .git/hooks/pre-commit << 'EOF'
//   #!/bin/sh
//   git -c core.quotePath=false diff --cached --name-only | node scripts/ensure-aliases.mjs | while IFS= read -r f; do
//     [ -n "$f" ] && git add -- "$f"
//   done
//   EOF
//   chmod +x .git/hooks/pre-commit
//
// Note: if the script crashes, the commit still proceeds (pipe swallows the
// exit code). This is intentional — alias fixes shouldn't block commits.
//
// REQUIRES: gray-matter — already a Quartz dependency, no extra install needed.

import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, relative, resolve, dirname, sep } from 'path'
import { fileURLToPath } from 'url'
import { createInterface } from 'readline'
import matter from 'gray-matter'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..')
const CONTENT_ROOT = join(REPO_ROOT, 'content')
const isPiped = !process.stdin.isTTY

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

// ── read staged .md paths from stdin (hook mode) ─────────────────────────────
// git diff --cached --name-only emits paths relative to the repo root
async function stagedFiles() {
  const files = []
  const rl = createInterface({ input: process.stdin, crlfDelay: Infinity })
  for await (const line of rl) {
    const trimmed = line.trim()
    if (!trimmed.endsWith('.md')) continue
    const full = resolve(REPO_ROOT, trimmed)
    if (!full.startsWith(CONTENT_ROOT + sep) && full !== CONTENT_ROOT) continue
    const rel = relative(CONTENT_ROOT, full)
    if (rel.split(sep).some(shouldSkip)) continue
    files.push(full)
  }
  return files
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
function withAlias(raw, alias, existing) {
  const bullet = `  - ${alias}`

  // ── no front-matter block at all ──
  if (!raw.startsWith('---')) {
    return `---\naliases:\n${bullet}\n---\n\n${raw}`
  }

  // locate closing ---
  const closeIdx = raw.indexOf('\n---', 3)
  if (closeIdx === -1) return null  // malformed; caller will warn

  const fm = raw.slice(0, closeIdx)
  const rest = raw.slice(closeIdx)

  // ── no aliases key, or key present but null / empty array ──
  if (
    existing === undefined || existing === null ||
    (Array.isArray(existing) && existing.length === 0)
  ) {
    if (/^aliases:/m.test(fm)) {
      return fm.replace(/^aliases:[ \t]*.*$/m, `aliases:\n${bullet}`) + rest
    }
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
  if (!keyMatch) return null

  const blockStart = keyMatch.index + keyMatch[0].length
  const blockLen = (fm.slice(blockStart).match(/^(?:[ \t]+-[^\n]*\n)*/)?.[0] ?? '').length

  return (
    fm.slice(0, blockStart + blockLen) +
    bullet + '\n' +
    fm.slice(blockStart + blockLen) +
    rest
  )
}

// ── process one file; returns true if patched ─────────────────────────────────
function processFile(filePath, onWarn, onPatch) {
  const alias = toAlias(filePath)

  let raw, parsed
  try {
    // Normalise line endings on read; avoids regex issues on Windows-edited files.
    raw = readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n')
    parsed = matter(raw)
  } catch {
    onWarn(`⚠  could not read or parse — skipping: ${alias}`)
    return false
  }

  const existing = parsed.data.aliases

  // guard against exotic types (object, number, boolean…)
  if (
    existing !== undefined && existing !== null &&
    typeof existing !== 'string' && !Array.isArray(existing)
  ) {
    onWarn(`⚠  aliases is ${typeof existing}, expected array — skipping: ${alias}`)
    return false
  }

  const list = !existing ? []
    : Array.isArray(existing) ? existing
      : [existing]

  if (list.includes(alias)) return false  // already present — nothing to do

  const updated = withAlias(raw, alias, existing)
  if (updated === null) {
    onWarn(`⚠  could not patch front-matter — skipping: ${alias}`)
    return false
  }

  writeFileSync(filePath, updated, 'utf8')
  onPatch(filePath, alias)
  return true
}

// ── main ──────────────────────────────────────────────────────────────────────
async function main() {
  let patched = 0
  let warned = 0

  const files = isPiped ? await stagedFiles() : [...walkMd(CONTENT_ROOT)]

  for (const filePath of files) {
    const ok = processFile(
      filePath,
      msg => { console.error(msg); warned++ },          // warnings always → stderr
      (fp, alias) => {
        if (isPiped) console.log(fp)                    // absolute path → stdout for git add
        else console.log(`+ ${alias}`)          // human-readable
      }
    )
    if (ok) patched++
  }

  const summary = `${patched} file(s) patched, ${warned} skipped with warnings.`
  if (isPiped) console.error(`\n${summary}`)            // don't pollute stdout in hook mode
  else console.log(`\n${summary}`)
}

main()