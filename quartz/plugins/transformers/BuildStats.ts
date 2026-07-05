import { QuartzTransformerPlugin } from "../types"
import fs from "fs"
import path from "path"

// Markers you place directly in index.md:
//   {{buildstat:audit-pct}}
//   {{buildstat:changelog-version}}
//   {{buildstat:systems-neglected}}
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

function getDaysSince(dateStr: string): number {
  if (!dateStr) return 999
  const [y, m, d] = dateStr.split("-").map(Number)
  return Math.floor((Date.now() - new Date(y, m - 1, d).getTime()) / 86_400_000)
}

function readSystemsStatus(): string {
  try {
    const raw = fs.readFileSync(SYSTEMS_JSON_PATH, "utf-8")
    const data = JSON.parse(raw)
    const roots: any[] = data?.roots ?? []
    if (!roots.length) return "No systems tracked"

    const total = roots.length
    const neglected = roots.filter(r => getDaysSince(r.attestation) > 21).length

    if (neglected === 0) return "All systems functional"
    if (neglected === 1) return "1 system needs review"
    return `${neglected} systems need review`
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