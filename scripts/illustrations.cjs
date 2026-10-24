// scripts/illustrations.cjs
// ------------------------------------------------------------------
// ILLUSTRATIONS SCRIPT
// Scans content/Illustrations/ and writes a JSON gallery manifest to
// quartz/static/data/illustrations.json for IllustrationGallery.tsx.
//
// Buckets:
//   figures — one entry per .md in "Tables and Figures/" (excluding
//             Drawing N) and "Interactive/"
//             thumb = first ![[...]] embed with an image extension
//             href  = slugified path to the .md page
//   misc    — Drawing N .md pages, plus every file in "Attachments/"
//             whose name does NOT start with Fig / Table / Chart / Drawing
//             (Solo, Inline, Color Plate, etc.)
//             href  = slugified asset path (opens image directly)
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
// Strips a trailing .md/.html, slugifies every segment.
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

// First number anywhere in a filename, for numeric sort. Items with no
// number (e.g. "VE symbol SVG code") sort to the end.
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

function main() {
  const root = path.join(process.cwd(), CONFIG.illustrationsRoot);
  if (!fs.existsSync(root)) {
    console.error(`[illustrations] Not found: ${CONFIG.illustrationsRoot}`);
    process.exit(0);
  }

  const illustrationsRel = CONFIG.illustrationsRoot.replace(/^content\//, '');
  const figures = [];

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

      // Only accept embeds with an image extension — GLBs etc. fall back to placeholder.
      let thumb = '';
      if (embed) {
        const ext = path.extname(embed).toLowerCase();
        if (CONFIG.imageExts.includes(ext)) {
          thumb = '/' + slugifyAssetPath(`${illustrationsRel}/${CONFIG.attachmentsDir}/${embed}`);
        }
      }

      figures.push({
        title: file.replace(/\.md$/, ''),
        href: pageSlug,
        thumb,
      });
    }
  }

  const misc = [];

  // Drawing .md pages live in "Tables and Figures" but are not numbered
  // like the rest of the book's figures, so they go into Misc instead.
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

      misc.push({
        title: file.replace(/\.md$/, ''),
        href: pageSlug,
        thumb,
      });
    }
  }

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
      misc.push({ title: file, href: assetSlug, thumb: assetSlug });
    }
  }

  const report = { generated: new Date().toISOString(), figures, misc };
  const outputPath = path.join(process.cwd(), CONFIG.outputFile);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

  console.log(
    `[illustrations] ${figures.length} figure(s), ${misc.length} misc image(s) -> ${CONFIG.outputFile}`,
  );
}

main();