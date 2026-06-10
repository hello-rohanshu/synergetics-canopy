// quartz/components/ContentAudit.tsx
import vaultAudit from "../static/data/content-audit.json"
import { QuartzComponent, QuartzComponentConstructor } from "./types"

interface AuditData {
  generated: string
  properties: Record<string, { label: string; description: string }>
  vault: Record<string, number>
  entries: Record<string, Record<string, number>>
}

const data = vaultAudit as AuditData

const formatPct = (val: number) => Math.max(0, Math.min(100, Math.round(Number(val) || 0)))
const getColor = (p: number) => p >= 90 ? "var(--secondary)" : p >= 50 ? "var(--tertiary)" : "var(--gray)"

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

// 1. By Property Metrics
const propertyMetrics = Object.entries(data.vault || {}).map(([name, val]) => ({
  label: data.properties?.[name]?.label || name,
  desc: data.properties?.[name]?.description || "",
  pct: formatPct(val)
}))
const totalVaultPct = propertyMetrics.length ? Math.round(propertyMetrics.reduce((s, p) => s + p.pct, 0) / propertyMetrics.length) : 0

// 2. By Chapter Metrics (Retaining nested props for expandable details)
const chapterMetrics = Object.entries(data.entries || {}).map(([name, props]) => {
  const itemProps = Object.entries(props).map(([pName, val]) => ({
    label: data.properties?.[pName]?.label || pName,
    pct: formatPct(val)
  }))
  const avg = itemProps.length ? Math.round(itemProps.reduce((s, p) => s + p.pct, 0) / itemProps.length) : 0
  return { name, props: itemProps, avg }
})

const ContentAudit: QuartzComponent = () => (
  <>
    <style>{`
      .aud-container { margin: 2rem 0; font-family: var(--bodyFont); color: var(--dark); }
      .aud-section-title {font-weight: 600; margin: 3.5rem 0 1rem 0; color: var(--darkgray); solid var(--lightgray); padding-bottom: 0.5rem; }
      
      /* Hero Banner */
      .aud-hero { display: flex; align-items: center; gap: 1.25rem; margin-bottom: 2rem; background: var(--highlight); padding: 1rem; border-radius: 8px; border-left: 4px solid var(--secondary); }
      .aud-pill-badge { font-size: 1.25rem; font-weight: 700; color: var(--secondary); font-family: var(--codeFont); }
      .aud-timestamp { font-size: 0.85rem; color: var(--gray); }
      
      /* Grid Layout (Properties) */
      .aud-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
      .aud-card { border: 1px solid var(--lightgray); border-radius: 6px; padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; background: transparent; }
      
      /* Shared Item Typography & Bars */
      .aud-meta { display: flex; justify-content: space-between; align-items: baseline; gap: 0.5rem; }
      .aud-label { color: var(--darkgray); font-weight: 600; font-size: 0.85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .aud-value { font-weight: 600; font-size: 0.85rem; font-family: var(--codeFont); min-width: 35px; text-align: right; }
      .aud-bar-bg { height: 6px; background: var(--lightgray); width: 100%; border-radius: 4px; overflow: hidden; }
      .aud-bar-fill { height: 100%; transition: width 0.4s ease; }
      .aud-desc { font-size: 0.75rem;  font-style: italic; color: var(--darkgray); margin: 0; line-height: 1.4; }

      /* Expandable List Layout (Chapters) */
      .aud-list { display: flex; flex-direction: column; gap: 0.5rem; }
      .aud-collapsible { border: 1px solid var(--lightgray); border-radius: 6px; padding: 0.6rem 1rem; transition: background 0.2s ease; }
      .aud-collapsible[open] { background: var(--highlight); border-color: var(--gray); }
      
      .aud-summary { display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; cursor: pointer; user-select: none; outline: none; }
      .aud-summary::-webkit-details-marker { display: none; }
      .aud-summary-left { display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 0; }
      .aud-summary-right { display: flex; align-items: center; gap: 1rem; width: 40%; max-width: 300px; }
      
      /* Inner Hidden Grid Toggle */
      .aud-expanded-content { margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px dashed var(--lightgray); display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; }
      .aud-sub-item { display: flex; flex-direction: column; gap: 0.2rem; }
    `}</style>
    
    <div className="aud-container">
      <div className="aud-hero">
        <div className="aud-pill-badge">{totalVaultPct}% Complete</div>
        {data.generated && <span className="aud-timestamp">Analyzed {formatTime(data.generated)}</span>}
      </div>

      {/* Group 1: By Property */}
      <h3 className="aud-section-title">By Property</h3>
      <div className="aud-grid">
        {propertyMetrics.map(({ label, desc, pct }) => {
          const color = getColor(pct)
          return (
            <div className="aud-card" key={label}>
              <div className="aud-meta">
                <span className="aud-label" title={label}>{label}</span>
                <span className="aud-value" style={{ color }}>{pct}%</span>
              </div>
              <div className="aud-bar-bg">
                <div className="aud-bar-fill" style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
              {desc && <p className="aud-desc">{desc}</p>}
            </div>
          )
        })}
      </div>

      {/* Group 2: By Chapter (Clean Expandable List Layout) */}
      <h3 className="aud-section-title">By Chapter</h3>
      <div className="aud-list">
        {chapterMetrics.map(({ name, props, avg }) => {
          const color = getColor(avg)
          return (
            <details className="aud-collapsible" key={name}>
              <summary className="aud-summary">
                <div className="aud-summary-left">
                  <span className="aud-label" title={name}>{name}</span>
                </div>
                <div className="aud-summary-right">
                  <div className="aud-bar-bg">
                    <div className="aud-bar-fill" style={{ width: `${avg}%`, backgroundColor: color }} />
                  </div>
                  <span className="aud-value" style={{ color }}>{avg}%</span>
                </div>
              </summary>
              
              <div className="aud-expanded-content">
                {props.map((p) => (
                  <div className="aud-sub-item" key={p.label}>
                    <div className="aud-meta">
                      <span className="aud-label" style={{ fontSize: "0.75rem", fontWeight: 500 }}>{p.label}</span>
                      <span className="aud-value" style={{ color: getColor(p.pct), fontSize: "0.75rem" }}>{p.pct}%</span>
                    </div>
                    <div className="aud-bar-bg" style={{ height: "4px" }}>
                      <div className="aud-bar-fill" style={{ width: `${p.pct}%`, backgroundColor: getColor(p.pct) }} />
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )
        })}
      </div>
    </div>
  </>
)

export default (() => ContentAudit) satisfies QuartzComponentConstructor