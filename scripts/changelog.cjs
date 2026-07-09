// scripts/changelog.js
// ------------------------------------------------------------------
// CHANGELOG SCRIPT
// Parses the root CHANGELOG.md (single source of truth) and writes
// a structured report to quartz/static/data/changelog.json for the
// ChangelogView component to render.
//
// content/changelog.md stays an empty stub (frontmatter only) so
// Quartz has a route to mount the component on — same pattern as
// content-audit.md / ContentAudit.tsx. There is only one file to
// edit: the root CHANGELOG.md.
// ------------------------------------------------------------------

const fs = require('fs');
const path = require('path');

const CONFIG = {
  // The single source of truth. Edit this file, nothing else.
  sourceFile: "CHANGELOG.md",

  // Where to save the parsed report
  outputFile: "quartz/static/data/changelog.json",

  // Recognized "### Section" names, in display order.
  // Sections found in the file but not listed here are still
  // included, appended after these in the order encountered.
  sectionOrder: ["Added", "Changed", "Deprecated", "Removed", "Fixed", "Security"],
};

function parseChangelog(raw) {
  // Split on version headers: one or more '#' followed by [version]
  // e.g. "# [1.0.0] — 2026-06-09" or "## [1.0.0] - 2026-06-09"
  const versionHeaderRe = /^#{1,6}\s*\[([^\]]+)\]\s*[—–-]\s*(.+)$/gm;

  const matches = [...raw.matchAll(versionHeaderRe)];
  const releases = [];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const version = match[1].trim();
    const date = match[2].trim();
    const startIdx = match.index + match[0].length;
    const endIdx = i + 1 < matches.length ? matches[i + 1].index : raw.length;
    const body = raw.slice(startIdx, endIdx);

    // Split body into "### Section" blocks
    const sectionRe = /^###\s+(.+)$/gm;
    const sectionMatches = [...body.matchAll(sectionRe)];

    const sectionsMap = {};
    for (let j = 0; j < sectionMatches.length; j++) {
      const sMatch = sectionMatches[j];
      const sName = sMatch[1].trim();
      const sStart = sMatch.index + sMatch[0].length;
      const sEnd = j + 1 < sectionMatches.length ? sectionMatches[j + 1].index : body.length;
      const sBody = body.slice(sStart, sEnd);

      // Extract markdown list items ("- ...") as entries
      const items = sBody
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("- "))
        .map((line) => line.slice(2).trim());

      if (items.length > 0) {
        sectionsMap[sName] = items;
      }
    }

    // Order known sections first, then any unrecognized ones encountered
    const orderedNames = [
      ...CONFIG.sectionOrder.filter((s) => sectionsMap[s]),
      ...Object.keys(sectionsMap).filter((s) => !CONFIG.sectionOrder.includes(s)),
    ];

    const sections = orderedNames.map((name) => ({
      name,
      items: sectionsMap[name],
    }));

    releases.push({ version, date, sections });
  }

  return releases;
}

function main() {
  const sourcePath = path.join(process.cwd(), CONFIG.sourceFile);
  const outputPath = path.join(process.cwd(), CONFIG.outputFile);

  if (!fs.existsSync(sourcePath)) {
    console.error(`[changelog] Source file not found: ${CONFIG.sourceFile}`);
    process.exit(0); // don't fail the build over a missing changelog
  }

  const raw = fs.readFileSync(sourcePath, "utf-8");
  const releases = parseChangelog(raw);

  const report = {
    generated: new Date().toISOString(),
    releases,
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

  console.log(`[changelog] Parsed ${releases.length} release(s) from ${CONFIG.sourceFile} -> ${CONFIG.outputFile}`);
}

main();
