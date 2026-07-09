import { QuartzTransformerPlugin } from "../types"
import fs from "fs"
import path from "path"

// Markers you place directly in index.md:
//   {{buildstat:audit-pct}}
//   {{buildstat:changelog-version}}
//   {{buildstat:systems-status}}
//
// All are replaced with static text at build time, before markdown parsing.

const AUDIT_JSON_PATH = path.join(
  process.cwd(),
  "quartz",
  "static",
  "data",
  "content-audit.json",
)

const CHANGELOG_JSON_PATH = path.join(
  process.cwd(),
  "quartz",
  "static",
  "data",
  "changelog.json",
)

const SYSTEMS_JSON_PATH = path.join(
  process.cwd(),
  "quartz",
  "static",
  "data",
  "systems-manifest.json",
)

function readAuditPct(): string {
  try {
    const raw = fs.readFileSync(AUDIT_JSON_PATH, "utf-8")
    const data = JSON.parse(raw)
    const values: number[] = Object.values(data?.vault ?? {})
    if (!values.length) return "—"
    const avg = Math.round(values.reduce((sum, v) => sum + v, 0) / values.length)
    return `${avg}%`
  } catch (err) {
    console.warn(`[BuildStats] Failed to read/parse ${AUDIT_JSON_PATH}:`, err)
    return "—"
  }
}

function readChangelogVersion(): string {
  try {
    const raw = fs.readFileSync(CHANGELOG_JSON_PATH, "utf-8")
    const data = JSON.parse(raw)
    const latest = data?.releases?.[0]
    return latest?.version ? `v${latest.version}` : "—"
  } catch (err) {
    console.warn(`[BuildStats] Failed to read/parse ${CHANGELOG_JSON_PATH}:`, err)
    return "—"
  }
}

function readSystemsStatus(): string {
  try {
    const raw = fs.readFileSync(SYSTEMS_JSON_PATH, "utf-8")
    const data = JSON.parse(raw)
    const roots: any[] = data?.roots ?? []

    if (roots.length === 0) return "Nothing tracked"

    let fresh = 0
    let needsReview = 0
    let stale = 0

    for (const r of roots) {
      // Use pre‑computed attestationStatus from the manifest generator
      const status = r.attestationStatus || "stale"
      if (status === "fresh") fresh++
      else if (status === "needs-review") needsReview++
      else if (status === "stale") stale++
    }

    const total = roots.length

    // All fresh
    if (fresh === total) return "All fresh"

    // Everything is stale
    if (stale === total) return "Fossilized"

    // 3 or more stale
    if (stale >= 3) return "Moldy"

    // Any stale (1‑2) OR everything is needs‑review
    if (stale > 0 || needsReview === total) return "Getting stale"

    // 3 or more needs‑review, no stale
    if (needsReview >= 3) return "Collecting dust"

    // 1‑2 needs‑review, no stale
    return "A little dusty"
  } catch (err) {
    console.warn(`[BuildStats] Failed to read/parse ${SYSTEMS_JSON_PATH}:`, err)
    return "—"
  }
}

export const BuildStats: QuartzTransformerPlugin = () => {
  return {
    name: "BuildStats",
    textTransform(_ctx, src) {
      if (typeof src !== "string") {
        src = (src as Buffer).toString()
      }

      if (src.includes("{{buildstat:audit-pct}}")) {
        const pct = readAuditPct()
        src = src.replaceAll("{{buildstat:audit-pct}}", pct)
      }

      if (src.includes("{{buildstat:changelog-version}}")) {
        const version = readChangelogVersion()
        src = src.replaceAll("{{buildstat:changelog-version}}", version)
      }

      if (src.includes("{{buildstat:systems-status}}")) {
        src = src.replaceAll("{{buildstat:systems-status}}", readSystemsStatus())
      }

      return src
    },
  }
}