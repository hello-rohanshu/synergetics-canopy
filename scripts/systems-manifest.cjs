// scripts/systems-manifest.cjs
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Define paths based on running this script from the root of the Quartz project
const CONTENT_DIR = path.join(__dirname, '../content/systems');
const OUTPUT_FILE = path.join(__dirname, '../quartz/static/data/systems-manifest.json');

// ── Helpers ─────────────────────────────────────────────────────────
const parseWikilinks = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item !== "string") return null;
      const match = item.match(/\[\[(.+?)\]\]/);
      return match ? match[1].trim() : item.trim();
    })
    .filter(Boolean);
};

const slugToName = (slug) => slug.split("/").pop()?.replace(/-/g, " ") ?? slug;

const parseStatus = (raw) => {
  const vals = Array.isArray(raw) ? raw : [raw];
  if (vals.includes("defunct") || vals.includes("down")) return "down";
  if (vals.includes("wip")) return "wip";
  return "active";
};

const parseRetired = (raw) => {
  if (raw === true || raw === "true") return true;
  if (Array.isArray(raw)) {
    const strArr = raw.map(String).map(s => s.toLowerCase());
    if (strArr.includes("true") || strArr.includes("retired")) return true;
  }
  if (typeof raw === "string" && raw.toLowerCase() === "retired") return true;
  return false;
};

const parseCritical = (raw) => {
  if (raw === true || raw === "true") return true;
  if (Array.isArray(raw)) {
    const arr = raw.map(String).map(s => s.toLowerCase());
    if (arr.includes("true") || arr.includes("critical")) return true;
  }
  if (typeof raw === "string") {
    const lower = raw.toLowerCase();
    if (lower === "true" || lower === "critical") return true;
  }
  return false;
};

// Recursive folder read
function getFiles(dir, filesList = []) {
  if (!fs.existsSync(dir)) return filesList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, filesList);
    } else {
      filesList.push(name);
    }
  }
  return filesList;
}

// ── Main Graph Logic ────────────────────────────────────────────────
function generateManifest() {
  // Apply depth and file type filtering immediately
  const allFiles = getFiles(CONTENT_DIR).filter(filePath => {
    const relPath = path.relative(CONTENT_DIR, filePath).replace(/\\/g, '/');
    // Keep only files directly in the systems folder (no subdirectories)
    return !relPath.includes('/') && filePath.endsWith('.md') && relPath !== 'index.md';
  });
  
  const byName = new Map();

  // 1. Build map of ALL valid nodes
  for (const filePath of allFiles) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data: fm } = matter(fileContent);

    // Replicate Quartz slug logic: systems/FileName
    const relPath = path.relative(CONTENT_DIR, filePath).replace(/\\/g, '/');
    const slug = `systems/${relPath.replace(/\.md$/, '')}`;

    const retired = parseRetired(fm.retired) || parseRetired(fm.lifecycle);
    const name = fm.title || slugToName(slug);

    let attestation = "";
    if (fm.attestation) {
      if (fm.attestation instanceof Date) {
        attestation = fm.attestation.toISOString().split('T')[0];
      } else {
        attestation = String(fm.attestation).trim();
      }
    }

    byName.set(name.toLowerCase(), {
      slug,
      name,
      ownStatus: parseStatus(fm.status),
      critical: parseCritical(fm.critical),
      retired,
      attestation,
      pingUrl: fm.ping_url || "",
      url: fm.url || "",
      childNames: parseWikilinks(fm.children),
      children: []
    });
  }

  // 2. Link children
  for (const node of byName.values()) {
    for (const childName of node.childNames) {
      const searchKey = childName.toLowerCase();
      // Try exact match, fallback to replacing hyphens with spaces
      let child = byName.get(searchKey) || byName.get(searchKey.replace(/-/g, " "));
      if (child) node.children.push(child);
    }
  }

  // 3. Mark retired descendants
  const retiredRoots = [...byName.values()].filter(n => n.retired);
  const descendantsOfRetired = new Set();
  const dfsMark = (node) => {
    if (descendantsOfRetired.has(node.name)) return;
    descendantsOfRetired.add(node.name);
    for (const child of node.children) {
      dfsMark(child);
    }
  };
  for (const retiredNode of retiredRoots) {
    dfsMark(retiredNode);
  }

  // 4. Clean tree (remove retired nodes)
  const validNodes = [...byName.values()].filter(n => !n.retired && !descendantsOfRetired.has(n.name));
  const validMap = new Map(validNodes.map(n => [n.name.toLowerCase(), n]));
  
  for (const node of validNodes) {
    node.children = node.childNames
      .map(cn => {
        const searchKey = cn.toLowerCase();
        // Also apply the fallback here when filtering out the pruned children
        return validMap.get(searchKey) || validMap.get(searchKey.replace(/-/g, " "));
      })
      .filter(c => c !== undefined);
  }

  // 5. Pre-calculate Rollup Statuses for everything
  const hasCriticalDownInSubtree = (node) => {
    for (const child of node.children) {
      if (child.ownStatus === "down" && child.critical) return true;
      if (hasCriticalDownInSubtree(child)) return true;
    }
    return false;
  };

  const hasNonCriticalDownInSubtree = (node) => {
    for (const child of node.children) {
      if (child.ownStatus === "down" && !child.critical) return true;
      if (hasNonCriticalDownInSubtree(child)) return true;
    }
    return false;
  };

  const hasWipInSubtree = (node) => {
    for (const child of node.children) {
      if (child.ownStatus === "wip") return true;
      if (hasWipInSubtree(child)) return true;
    }
    return false;
  };

  const calculateRolledStatus = (node) => {
    if (node.ownStatus === "down") return "down";
    if (node.ownStatus === "wip") return "wip";
    if (hasCriticalDownInSubtree(node)) return "down";
    if (hasNonCriticalDownInSubtree(node)) return "degraded";
    if (hasWipInSubtree(node)) return "wip";
    return "active";
  };

  for (const node of validNodes) {
    node.rolledStatus = calculateRolledStatus(node);
  }

  // 6. Find absolute roots (Nodes that are not children of any other node)
  const allChildNames = new Set();
  for (const node of validNodes) {
    for (const child of node.children) {
      allChildNames.add(child.name.toLowerCase());
    }
  }

  const roots = validNodes.filter(n => !allChildNames.has(n.name.toLowerCase()));

  // 7. Output Result
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ roots }, null, 2));
  console.log(`✅ systems.json successfully generated with ${roots.length} root systems.`);
}

generateManifest();