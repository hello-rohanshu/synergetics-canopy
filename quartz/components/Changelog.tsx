// quartz/components/Changelog.tsx
import changelogData from "../static/data/changelog.json"
import { QuartzComponent, QuartzComponentConstructor } from "./types"

interface Release {
  version: string
  date: string
  sections: { name: string; items: string[] }[]
}

interface ChangelogData {
  generated: string
  releases: Release[]
}

const data = changelogData as ChangelogData

const sectionColor: Record<string, string> = {
  Added: "var(--secondary)",
  Changed: "var(--tertiary)",
  Fixed: "var(--tertiary)",
  Deprecated: "var(--gray)",
  Removed: "#ef4444",
  Security: "#ef4444",
}

// Minimal inline markdown: **bold**, *italic*, [text](url). Not a full parser —
// changelog entries are short, controlled, single-line strings.
function renderInline(text: string) {
  const parts: (string | JSX.Element)[] = []
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))
    if (match[1] !== undefined) {
      parts.push(<a href={match[2]} key={key++}>{match[1]}</a>)
    } else if (match[3] !== undefined) {
      parts.push(<strong key={key++}>{match[3]}</strong>)
    } else if (match[4] !== undefined) {
      parts.push(<em key={key++}>{match[4]}</em>)
    }
    lastIndex = re.lastIndex
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}

const formatTime = (dStr: string) => {
  if (!dStr) return ""
  const secs = Math.floor((Date.now() - new Date(dStr).getTime()) / 1000)
  if (secs < 30) return "just now"
  const units = [{ l: 'y', s: 31536000 }, { l: 'mo', s: 2592000 }, { l: 'd', s: 864000 }, { l: 'h', s: 3600 }, { l: 'm', s: 60 }]
  for (const u of units) {
    const c = Math.floor(secs / u.s)
    if (c >= 1) return `${c}${u.l} ago`
  }
  return "recently"
}

const Changelog: QuartzComponent = () => (
  <>
    <style>{`
      .chg-container { margin: 2rem 0; font-family: var(--bodyFont); color: var(--dark); }
      .chg-timestamp { font-size: 0.85rem; color: var(--gray); margin-bottom: 2rem; display: block; }

      .chg-release { border: 1px solid var(--lightgray); border-radius: 8px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; }
      .chg-release-header { display: flex; align-items: baseline; gap: 0.75rem; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--lightgray); }
      .chg-version { font-family: var(--codeFont); font-weight: 700; font-size: 1.1rem; color: var(--secondary); }
      .chg-date { font-size: 0.85rem; color: var(--gray); }

      .chg-section { margin-bottom: 1.1rem; }
      .chg-section:last-child { margin-bottom: 0; }
      .chg-section-name { font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.5rem; display: inline-block; padding: 0.1rem 0.5rem; border-radius: 4px; background: var(--highlight); }
      .chg-items { margin: 0; padding-left: 1.25rem; display: flex; flex-direction: column; gap: 0.4rem; }
      .chg-items li { font-size: 0.92rem; line-height: 1.5; color: var(--darkgray); }
      .chg-items a { color: var(--secondary); }

      .chg-empty { font-size: 0.9rem; color: var(--gray); font-style: italic; }
    `}</style>

    <div className="chg-container">
      {data.generated && <span className="chg-timestamp">Last updated {formatTime(data.generated)}</span>}

      {(!data.releases || data.releases.length === 0) && (
        <p className="chg-empty">No releases logged yet.</p>
      )}

      {data.releases?.map((release) => (
        <div className="chg-release" key={release.version}>
          <div className="chg-release-header">
            <span className="chg-version">v{release.version}</span>
            <span className="chg-date">{release.date}</span>
          </div>
          {release.sections.map((section) => (
            <div className="chg-section" key={section.name}>
              <span
                className="chg-section-name"
                style={{ color: sectionColor[section.name] || "var(--darkgray)" }}
              >
                {section.name}
              </span>
              <ul className="chg-items">
                {section.items.map((item, idx) => (
                  <li key={idx}>{renderInline(item)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ))}
    </div>
  </>
)

export default (() => Changelog) satisfies QuartzComponentConstructor
