// scripts/illustrations.cjs
// ------------------------------------------------------------------
// ILLUSTRATIONS SCRIPT
// Scans content/Illustrations/ and writes a single unified manifest
// to quartz/static/data/illustrations.json for IllustrationGallery.tsx.
//
// Every entry has: title, href, thumb, tags[].
// Tags drive the pill filter on the frontend:
//   - Type tag (at most one): Tables (Table*/Chart*), Drawings, Color Plates
//   - Chapter tag derived from the first number in the name if >= 100:
//     Math.floor(n / 100) * 100, formatted as "<chapter>.00" (e.g. "400.00")
//   - "Misc" tag if neither type nor chapter applies
//
// Source logic (unchanged from before, just flattened):
//   - Tables and Figures/*.md (excluding Drawing N) + Interactive/*.md
//       href = .md page, thumb = first ![[...]] embed
//   - Tables and Figures/Drawing *.md
//       href = .md page, thumb = first ![[...]] embed
//   - Attachments/* (excluding Fig/Table/Chart/Drawing prefixes)
//       href = asset URL, thumb = same asset URL
// ------------------------------------------------------------------

const fs = require('fs');
const path = require('path');

const CONFIG = {
  illustrationsRoot: 'content/Illustrations',
  figuresDirs: ['Tables and Figures', 'Interactive'],
  attachmentsDir: 'Attachments',
  miscExcludePrefixes: ['Fig', 'Table', 'Chart', 'Drawing'],
  imageExts: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif'],
  outputFile: 'quartz/static/data/illustrations.json',
};

// Mirrors Quartz's sluggify() for one path segment.
function sluggifySegment(seg) {
  return seg
    .replace(/\s/g, '-')
    .replace(/&/g, '-and-')
    .replace(/%/g, '-percent')
    .replace(/\?/g, '')
    .replace(/#/g, '');
}

// Mirrors Quartz's slugifyFilePath for a path already relative to content/.
function slugifyFilePath(fp) {
  const cleaned = fp.replace(/^\/+|\/+$/g, '');
  const withoutExt = cleaned.replace(/\.(md|html)$/i, '');
  return withoutExt.split('/').map(sluggifySegment).join('/');
}

// Same as above but keeps the extension (used for asset URLs).
function slugifyAssetPath(fp) {
  const cleaned = fp.replace(/^\/+|\/+$/g, '');
  return cleaned.split('/').map(sluggifySegment).join('/');
}

// Returns only the body of a markdown file, frontmatter stripped.
function stripFrontmatter(raw) {
  if (!raw.startsWith('---')) return raw;
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return raw;
  const after = raw.indexOf('\n', end + 4);
  return after === -1 ? '' : raw.slice(after + 1);
}

// First ![[...]] embed in the body, or null.
function firstWikilinkEmbed(body) {
  const m = body.match(/!\[\[([^\]|#]+)(?:\|[^\]]*)?\]\]/);
  return m ? m[1].trim() : null;
}

// First number anywhere in a filename, for numeric sort.
function leadingNumber(name) {
  const m = name.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : Infinity;
}

// Sort comparator: by leading number, then alphabetically.
function numericSort(a, b) {
  const na = leadingNumber(a);
  const nb = leadingNumber(b);
  if (na !== nb) return na - nb;
  return a.localeCompare(b);
}

// Compute pill-filter tags from an item's title.
function computeTags(title) {
  const tags = [];
  const lower = title.toLowerCase();

  if (lower.startsWith('table') || lower.startsWith('chart')) {
    tags.push('Tables');
  } else if (lower.startsWith('drawing')) {
    tags.push('Drawings');
  } else if (lower.startsWith('color plate')) {
    tags.push('Color Plates');
  }

  const numMatch = title.match(/(\d+)/);
  if (numMatch) {
    const n = parseInt(numMatch[1], 10);
    if (n >= 100) {
      const chapter = Math.floor(n / 100) * 100;
      tags.push(`${chapter}.00`);
    }
  }

  if (tags.length === 0) tags.push('Misc');

  return tags;
}

function makeItem(title, href, thumb) {
  return { title, href, thumb, tags: computeTags(title) };
}

function main() {
  const root = path.join(process.cwd(), CONFIG.illustrationsRoot);
  if (!fs.existsSync(root)) {
    console.error(`[illustrations] Not found: ${CONFIG.illustrationsRoot}`);
    process.exit(0);
  }

  const illustrationsRel = CONFIG.illustrationsRoot.replace(/^content\//, '');
  const items = [];

  // 1. Figures from Tables and Figures + Interactive (excluding Drawings)
  for (const dirName of CONFIG.figuresDirs) {
    const dirPath = path.join(root, dirName);
    if (!fs.existsSync(dirPath)) continue;

    const files = fs.readdirSync(dirPath)
      .filter((f) => f.endsWith('.md') && !f.toLowerCase().startsWith('drawing'))
      .sort(numericSort);

    for (const file of files) {
      const raw = fs.readFileSync(path.join(dirPath, file), 'utf-8');
      const body = stripFrontmatter(raw);
      const embed = firstWikilinkEmbed(body);

      const pageSlug = '/' + slugifyFilePath(`${illustrationsRel}/${dirName}/${file}`);

      let thumb = '';
      if (embed) {
        const ext = path.extname(embed).toLowerCase();
        if (CONFIG.imageExts.includes(ext)) {
          thumb = '/' + slugifyAssetPath(`${illustrationsRel}/${CONFIG.attachmentsDir}/${embed}`);
        }
      }

      items.push(makeItem(file.replace(/\.md$/, ''), pageSlug, thumb));
    }
  }

  // 2. Drawing .md pages
  const tfDir = path.join(root, CONFIG.figuresDirs[0]);
  if (fs.existsSync(tfDir)) {
    const drawingFiles = fs.readdirSync(tfDir)
      .filter((f) => f.endsWith('.md') && f.toLowerCase().startsWith('drawing'))
      .sort(numericSort);

    for (const file of drawingFiles) {
      const raw = fs.readFileSync(path.join(tfDir, file), 'utf-8');
      const body = stripFrontmatter(raw);
      const embed = firstWikilinkEmbed(body);

      const pageSlug = '/' + slugifyFilePath(`${illustrationsRel}/${CONFIG.figuresDirs[0]}/${file}`);

      let thumb = '';
      if (embed) {
        const ext = path.extname(embed).toLowerCase();
        if (CONFIG.imageExts.includes(ext)) {
          thumb = '/' + slugifyAssetPath(`${illustrationsRel}/${CONFIG.attachmentsDir}/${embed}`);
        }
      }

      items.push(makeItem(file.replace(/\.md$/, ''), pageSlug, thumb));
    }
  }

  // 3. Loose attachments (Color Plates, Inline, Solo)
  const attachmentsPath = path.join(root, CONFIG.attachmentsDir);
  if (fs.existsSync(attachmentsPath)) {
    const files = fs.readdirSync(attachmentsPath).sort(numericSort);

    for (const file of files) {
      const full = path.join(attachmentsPath, file);
      if (!fs.statSync(full).isFile()) continue;

      const excluded = CONFIG.miscExcludePrefixes.some((p) =>
        file.toLowerCase().startsWith(p.toLowerCase()),
      );
      if (excluded) continue;

      const assetSlug = '/' + slugifyAssetPath(`${illustrationsRel}/${CONFIG.attachmentsDir}/${file}`);
      items.push(makeItem(file, assetSlug, assetSlug));
    }
  }

  const report = { generated: new Date().toISOString(), items };
  const outputPath = path.join(process.cwd(), CONFIG.outputFile);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

  console.log(`[illustrations] ${items.length} item(s) -> ${CONFIG.outputFile}`);
}

main();