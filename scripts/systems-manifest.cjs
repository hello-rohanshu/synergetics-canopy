// scripts/systems-manifest.cjs
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

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

const parseRetired = (raw) => {
  if (raw === true || raw === "true") return true;
  if (Array.isArray(raw)) {
    const strArr = raw.map(String).map(s => s.toLowerCase());
    if (strArr.includes("true") || strArr.includes("retired")) return true;
  }
  if (typeof raw === "string" && raw.toLowerCase() === "retired") return true;
  return false;
};

// Compute attestation status based on days since last review
function getAttestationStatus(dateStr) {
  if (!dateStr) return "stale"; // never reviewed → stale
  const [y, m, d] = dateStr.split("-").map(Number);
  const days = Math.floor((Date.now() - new Date(y, m - 1, d).getTime()) / 86400000);
  if (days <= 21) return "fresh";
  if (days <= 49) return "needs-review";
  return "stale";
}

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
  const allFiles = getFiles(CONTENT_DIR).filter(filePath => {
    const relPath = path.relative(CONTENT_DIR, filePath).replace(/\\/g, '/');
    return !relPath.includes('/') && filePath.endsWith('.md') && relPath !== 'index.md';
  });
  
  const byName = new Map();

  // 1. Build map of ALL valid nodes (temporarily include retired flag for pruning)
  for (const filePath of allFiles) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data: fm } = matter(fileContent);

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
      retired,               // kept only for pruning, removed later
      attestation,
      attestationStatus: getAttestationStatus(attestation),
      pingUrl: fm.ping_url || "",
      url: fm.url || "",
      childNames: parseWikilinks(fm.children),   // temp for linking
      children: []
    });
  }

  // 2. Link children
  for (const node of byName.values()) {
    for (const childName of node.childNames) {
      const searchKey = childName.toLowerCase();
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

  // 4. Clean tree (remove retired nodes + their descendants)
  const validNodes = [...byName.values()].filter(
    n => !n.retired && !descendantsOfRetired.has(n.name)
  );
  const validMap = new Map(validNodes.map(n => [n.name.toLowerCase(), n]));
  
  for (const node of validNodes) {
    node.children = node.childNames
      .map(cn => {
        const searchKey = cn.toLowerCase();
        return validMap.get(searchKey) || validMap.get(searchKey.replace(/-/g, " "));
      })
      .filter(c => c !== undefined);
    // Remove temporary linking fields
    delete node.childNames;
    delete node.retired;
  }

  // 5. Find absolute roots
  const allChildNames = new Set();
  for (const node of validNodes) {
    for (const child of node.children) {
      allChildNames.add(child.name.toLowerCase());
    }
  }

  const roots = validNodes.filter(n => !allChildNames.has(n.name.toLowerCase()));

  // 6. Output
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ roots }, null, 2));
  console.log(`✅ systems-manifest.json generated with ${roots.length} root systems.`);
}

generateManifest();