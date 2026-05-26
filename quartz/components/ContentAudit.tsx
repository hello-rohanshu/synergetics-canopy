// quartz/components/ContentAudit.tsx
import vaultAudit from "../static/data/content-audit.json"
import { QuartzComponent, QuartzComponentConstructor } from "./types"

interface AuditData {
  generated: string
  properties: Record<string, { label: string; description: string }>
  vault: Record<string, number>
}

const data = vaultAudit as AuditData

const processed = Object.entries(data.vault || {}).map(([name, val]) => {
  const meta = data.properties?.[name]
  return {
    label: meta?.label || name,
    desc: meta?.description || "",
    pct: Math.max(0, Math.min(100, Math.round(Number(val) || 0)))
  }
})

const vaultPct = processed.length ? Math.round(processed.reduce((s, p) => s + p.pct, 0) / processed.length) : 0
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

const ContentAudit: QuartzComponent = () => (
  <>
    <style>{`
      .aud-container { margin: 1.5rem 0; font-family: var(--codeFont); }
      
      /* Balanced Hero section with enhanced badge size */
      .aud-hero { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
      .aud-pill-badge { font-size: 1rem; font-weight: 700; padding: 0.4rem 0.9rem; border-radius: 6px; background: var(--highlight); color: var(--secondary); font-family: var(--codeFont); }
      .aud-timestamp { font-size: 0.8rem; color: var(--gray); font-family: var(--bodyFont); }
      
      /* Dense, highly readable cardless layout */
      .aud-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.25rem 1.75rem; }
      .aud-item { display: flex; flex-direction: column; gap: 0.25rem; }
      
      .aud-meta { display: flex; justify-content: space-between; align-items: baseline; gap: 0.5rem; }
      .aud-label { color: var(--darkgray); font-weight: 500; font-size: 0.85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .aud-value { font-weight: 600; font-size: 0.8rem; font-family: var(--codeFont); }
      
      /* 3px hairline for an ultra-clean profile */
      .aud-bar-bg { height: 8px; background: var(--lightgray); width: 100%; border-radius: 2px; overflow: hidden; }
      .aud-bar-fill { height: 100%; transition: width 0.4s ease; }
      .aud-desc { font-size: 0.75rem; color: var(--gray); margin: 0; line-height: 1.3; font-family: var(--bodyFont);}
    `}</style>
    
    <div className="aud-container">
      <div className="aud-hero">
        <div className="aud-pill-badge">
          {vaultPct}% Complete
        </div>
        {data.generated && <span className="aud-timestamp">Analyzed {formatTime(data.generated)}</span>}
      </div>

      <div className="aud-grid">
        {processed.map(({ label, desc, pct }) => {
          const color = getColor(pct)
          return (
            <div className="aud-item" key={label}>
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
    </div>
  </>
)

export default (() => ContentAudit) satisfies QuartzComponentConstructor