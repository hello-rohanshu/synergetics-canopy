// scripts/illustrations.cjs
// ------------------------------------------------------------------
// ILLUSTRATIONS SCRIPT
// Scans content/Illustrations/ and writes a single unified manifest
// to quartz/static/data/illustrations.json for IllustrationGallery.tsx.
//
// Layout assumptions:
//   content/Illustrations/*.md           — figure/table/drawing pages
//   content/Illustrations/Attachments/*  — raw image assets
//
// Every entry has: title, href, thumb, tags[].
// Tags drive the pill filter on the frontend:
//   - Type tag (at most one): Tables (Table*/Chart*), Drawings, Color Plates
//   - Chapter tag derived from the first number in the name if >= 100:
//     Math.floor(n / 100) * 100, formatted as "<chapter>.00" (e.g. "400.00")
//   - "Misc" tag if neither type nor chapter applies
// ------------------------------------------------------------------

const fs = require('fs');
const path = require('path');

const CONFIG = {
  illustrationsRoot: 'content/Illustrations',
  attachmentsDir: 'Attachments',
  miscExcludePrefixes: ['Fig', 'Table', 'Chart', 'Drawing'],
  imageExts: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif'],
  outputFile: 'quartz/static/data/illustrations.json',
};

function sluggifySegment(seg) {
  return seg
    .replace(/\s/g, '-')
    .replace(/&/g, '-and-')
    .replace(/%/g, '-percent')
    .replace(/\?/g, '')
    .replace(/#/g, '');
}

function slugifyFilePath(fp) {
  const cleaned = fp.replace(/^\/+|\/+$/g, '');
  const withoutExt = cleaned.replace(/\.(md|html)$/i, '');
  return withoutExt.split('/').map(sluggifySegment).join('/');
}

function slugifyAssetPath(fp) {
  const cleaned = fp.replace(/^\/+|\/+$/g, '');
  return cleaned.split('/').map(sluggifySegment).join('/');
}

function stripFrontmatter(raw) {
  if (!raw.startsWith('---')) return raw;
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return raw;
  const after = raw.indexOf('\n', end + 4);
  return after === -1 ? '' : raw.slice(after + 1);
}

function firstWikilinkEmbed(body) {
  const m = body.match(/!\[\[([^\]|#]+)(?:\|[^\]]*)?\]\]/);
  return m ? m[1].trim() : null;
}

function leadingNumber(name) {
  const m = name.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : Infinity;
}

function numericSort(a, b) {
  const na = leadingNumber(a);
  const nb = leadingNumber(b);
  if (na !== nb) return na - nb;
  return a.localeCompare(b);
}

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

  // 1. All .md pages directly inside Illustrations/ (skip index.md — it
  //    hosts this gallery and isn't itself a figure).
  const mdFiles = fs.readdirSync(root)
    .filter((f) => f.endsWith('.md') && f.toLowerCase() !== 'index.md')
    .sort(numericSort);

  for (const file of mdFiles) {
    const raw = fs.readFileSync(path.join(root, file), 'utf-8');
    const body = stripFrontmatter(raw);
    const embed = firstWikilinkEmbed(body);

    const pageSlug = '/' + slugifyFilePath(`${illustrationsRel}/${file}`);

    let thumb = '';
    if (embed) {
      const ext = path.extname(embed).toLowerCase();
      if (CONFIG.imageExts.includes(ext)) {
        thumb = '/' + slugifyAssetPath(`${illustrationsRel}/${CONFIG.attachmentsDir}/${embed}`);
      }
    }

    items.push(makeItem(file.replace(/\.md$/, ''), pageSlug, thumb));
  }

  // 2. Loose attachments (Color Plates, Inline, Solo)
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