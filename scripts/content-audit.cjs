// scripts/content-audit.js
// ------------------------------------------------------------------
// CONTENT AUDIT SCRIPT
// Scans markdown files, checks boolean frontmatter properties,
// and writes a completion report to quartz/static/data/content-audit.json
// ------------------------------------------------------------------

const fs = require('fs');
const path = require('path');
const grayMatter = require('gray-matter');

// ------------------------------------------------------------------
// CONFIGURATION
// Edit this section to add/remove properties or change groups.
// Each property needs: label (shown in UI) and description (shown in tooltip).
//
// SCOPE NOTE: the audit only ever scans entries named in `groups`
// below. Anything in content/ that isn't listed there (content-audit.md,
// corpus.md, systems-stack.md, synergetics-ai.md, the systems/ folder,
// _site/, etc.) is never touched — `groups` is treated as the
// canonical table of contents for the book, everything else is
// site tooling/UI and is out of scope by construction.
// ------------------------------------------------------------------

const CONFIG = {

  // Where to find markdown files
  contentDir: "content",

  // Where to save the report
  outputFile: "quartz/static/data/content-audit.json",

  // Filenames to skip when recursing into a directory-type entry
  // (e.g. "300.00 Universe/index.md" is structural, not book content).
  // This only applies inside entries listed in `groups` below — it is
  // not a vault-wide exclusion list.
  skipFilenames: ["index.md"],

  // Properties to check in frontmatter
  "properties": {
    "p-replication": {
      "label": "Replication",
      "description": "Full text reproduced from the source"
    },
    "p-headings": {
      "label": "Headings",
      "description": "Correct hierarchy present throughout"
    },
    "p-images": {
      "label": "Images",
      "description": "All source images present and rendering"
    },
    "p-structure": {
      "label": "Structure",
      "description": "Tables, spacing, and layout confirmed correct"
    },
    "p-emDash": {
      "label": "Em Dashes",
      "description": "Double-underscore artifacts replaced with proper em dashes"
    },
    "p-italics": {
      "label": "Italics",
      "description": "Italic formatting applied throughout"
    },
    "p-equations": {
      "label": "Equations",
      "description": "Equations rendered via LaTeX, SVG, or equivalent"
    },
    "p-links": {
      "label": "Links (Placed)",
      "description": "Link markers placed in text"
    },
    "p-links-2": {
      "label": "Links (Resolved)",
      "description": "Placed links connected to their destinations"
    }
  },

  // Entries to skip (filenames without .md) — e.g. a chapter you've
  // intentionally pulled from the audit temporarily.
  exclusions: [],

  // Groups define how entries are organized in the report.
  // This list IS the scan scope — only these entries are ever read.
  groups: {
    "Front Matter": [
      "Foreword",
      "Introduction - The Wellspring of Reality",
      "Humans In Universe",
      "Scenarios"
    ],
    "Main Chapters": [
      "100.00 Synergy", "200.00 Synergetics", "300.00 Universe",
      "400.00 System", "500.00 Conceptuality", "600.00 Structure",
      "700.00 Tensegrity", "800.00 Operational Mathematics",
      "900.00 Modelability", "1000.00 Omnitopology",
      "1100.00 Constant Zenith Projection", "1200.00 Numerology"
    ],
    "Back Matter": [
      "Afterpiece", "32 Color Plates", "Evolution of Synergetics",
      "Book Index", "Illustrations"
    ]
  }
};

// Derive the list of property names from the config
const booleanProps = Object.keys(CONFIG.properties);

// ------------------------------------------------------------------
// FILE SCANNING
// Recursively finds all .md files in a directory, skipping any
// filename listed in CONFIG.skipFilenames (e.g. index.md).
// ------------------------------------------------------------------

function findMarkdownFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      if (CONFIG.skipFilenames.includes(entry.name)) continue;
      results.push(fullPath);
    }
  }
  return results;
}

// ------------------------------------------------------------------
// ENTRY SCANNING
// Given an entry name, finds its markdown file(s) and counts
// how many have each boolean property set to true.
// ------------------------------------------------------------------

function scanEntry(entryName) {
  const basePath = path.join(CONFIG.contentDir, entryName);
  const filePath = basePath + '.md';
  const dirPath = basePath;

  let mdFiles = [];

  // Try as a single file first, then as a directory
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    mdFiles = [filePath];
  } else if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    mdFiles = findMarkdownFiles(dirPath);
  }

  // No markdown files found for this entry
  if (mdFiles.length === 0) {
    return null;
  }

  // Initialize counts to zero
  const trueCounts = {};
  booleanProps.forEach(prop => { trueCounts[prop] = 0; });

  // Scan each file's frontmatter
  for (const file of mdFiles) {
    let data = {};
    try {
      const parsed = grayMatter.read(file);
      data = parsed.data;
    } catch (err) {
      console.warn(`  Warning: Could not parse frontmatter in ${file} (${err.message})`);
      continue;
    }

    for (const prop of booleanProps) {
      if (data[prop] === true) {
        trueCounts[prop]++;
      }
    }
  }

  return { fileCount: mdFiles.length, trueCounts };
}

// ------------------------------------------------------------------
// PERCENTAGE CALCULATION
// Converts true counts to percentages (rounded to 1 decimal)
// ------------------------------------------------------------------

function computePercentages(trueCounts, fileCount) {
  const percentages = {};
  if (fileCount === 0) {
    booleanProps.forEach(prop => { percentages[prop] = 0; });
  } else {
    booleanProps.forEach(prop => {
      const pct = (trueCounts[prop] / fileCount) * 100;
      percentages[prop] = Math.round(pct * 10) / 10;
    });
  }
  return percentages;
}

// ------------------------------------------------------------------
// MAIN AUDIT
// Scans all groups/entries, calculates percentages at every level,
// and writes the report.
// ------------------------------------------------------------------

function audit() {

  // ---- Vault-wide accumulators ----
  let vaultFileCount = 0;
  const vaultTrueCounts = {};
  booleanProps.forEach(prop => { vaultTrueCounts[prop] = 0; });

  const groupsResult = {};
  const entriesResult = {};
  const missingEntries = [];   // <-- NEW: track entries listed but not found

  // ---- Scan each group ----
  for (const [groupName, entryNames] of Object.entries(CONFIG.groups)) {
    let groupFileCount = 0;
    const groupTrueCounts = {};
    booleanProps.forEach(prop => { groupTrueCounts[prop] = 0; });

    // ---- Scan each entry in the group ----
    for (const entryName of entryNames) {
      if (CONFIG.exclusions.includes(entryName)) continue;

      const scan = scanEntry(entryName);
      if (!scan || scan.fileCount === 0) {
        console.warn(`No markdown files found for entry: "${entryName}" – skipping.`);
        missingEntries.push(entryName);   // <-- NEW: collect for the report
        continue;
      }

      // Per-entry percentages
      entriesResult[entryName] = computePercentages(scan.trueCounts, scan.fileCount);

      // Add to group totals
      groupFileCount += scan.fileCount;
      for (const prop of booleanProps) {
        groupTrueCounts[prop] += scan.trueCounts[prop];
      }

      // Add to vault totals
      vaultFileCount += scan.fileCount;
      for (const prop of booleanProps) {
        vaultTrueCounts[prop] += scan.trueCounts[prop];
      }
    }

    // Per-group percentages
    groupsResult[groupName] = computePercentages(groupTrueCounts, groupFileCount);
  }

  // ---- Vault-wide percentages ----
  const vaultPercentages = computePercentages(vaultTrueCounts, vaultFileCount);

  // ---- Build the report ----
  const report = {
    generated: new Date().toISOString(),
    properties: CONFIG.properties,   // Label/description info for the UI
    vault: vaultPercentages,         // Overall completion per property
    groups: groupsResult,            // Completion per group
    entries: entriesResult,          // Completion per entry
    missing: missingEntries          // <-- NEW: entries in groups that weren't found
  };

  // ---- Write to file ----
  const outputDir = path.dirname(CONFIG.outputFile);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(CONFIG.outputFile, JSON.stringify(report, null, 2), 'utf8');

  // ---- Print summary ----
  const entryCount = Object.keys(entriesResult).length;
  console.log(
    `Vault audit complete. Scanned ${vaultFileCount} markdown ` +
    `file${vaultFileCount !== 1 ? 's' : ''} across ${entryCount} ` +
    `entr${entryCount !== 1 ? 'ies' : 'y'}.`
  );
  if (missingEntries.length > 0) {
    console.warn(
      `⚠  Warning: ${missingEntries.length} entr${missingEntries.length !== 1 ? 'ies' : 'y'} ` +
      `listed in groups but not found in content/: ${missingEntries.join(', ')}`
    );
  }
  console.log(`Timestamp: ${report.generated}`);
  console.log(`Report written to ${CONFIG.outputFile}`);
}

// ------------------------------------------------------------------
// RUN
// ------------------------------------------------------------------

audit();