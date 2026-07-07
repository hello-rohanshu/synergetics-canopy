import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import systemsData from "../static/data/systems-manifest.json"

// --- Types ---

interface SystemNode {
  slug: string
  name: string
  url: string
  pingUrl: string
  attestation: string
  children: SystemNode[]
}

const roots = systemsData.roots as SystemNode[]

// --- Helpers ---

const getDays = (dateStr: string): number => {
  if (!dateStr) return 999
  const [y, m, d] = dateStr.split("-").map(Number)
  return Math.floor((Date.now() - new Date(y, m - 1, d).getTime()) / 86400000)
}

const getCat = (days: number) => (days <= 21 ? "fresh" : days <= 49 ? "stale" : "neglected")

const relativeDate = (dateStr: string): string => {
  if (!dateStr) return "Never reviewed"
  const days = getDays(dateStr)
  if (days === 0) return "Reviewed today"
  if (days === 1) return "Reviewed yesterday"
  if (days < 7) return `Reviewed ${days}d ago`
  if (days < 60) return `Reviewed ${Math.floor(days / 7)}w ago`
  if (days < 365) return `Reviewed ${Math.floor(days / 30)}mo ago`
  return `Reviewed ${Math.floor(days / 365)}y ago`
}

const getDomain = (url: string) => {
  try { return new URL(url).hostname.replace(/^www\./, "") } catch { return "" }
}

const formatPingId = (slug: string) =>
  slug.replace("systems/", "").replace(/\s+/g, "-").toLowerCase()

// --- Sub-Components ---

const Favicon = ({ url, hidePlaceholder }: { url: string; hidePlaceholder?: boolean }) => {
  const d = getDomain(url)
  if (!d) {
    if (hidePlaceholder) return null // no dot for parents
    return <div class="si-fav si-fav-placeholder" aria-hidden="true"><span /></div>
  }
  return <img class="si-fav" src={`https://icon.horse/icon/${d}`} alt="" width="14" height="14" />
}

const Chevron = () => (
  <svg class="si-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const PingDot = ({ slug, pingUrl }: { slug: string; pingUrl: string }) => {
  if (!pingUrl) return null
  return (
    <div class="si-ping-wrap">
      <span class="si-pdot" id={`si-pdot-${formatPingId(slug)}`} data-ping-url={pingUrl} />
    </div>
  )
}

const TreeNode = ({ node }: { node: SystemNode }) => {
  const hasChildren = node.children.length > 0
  const RowContent = (
    <div class="si-item-row">
      <div class="si-item-left">
        {hasChildren ? <Chevron /> : <span class="si-chevron-spacer" />}
        <Favicon url={node.url} hidePlaceholder={hasChildren} />
        <span class="si-iname">{node.name}</span>
      </div>
      <div class="si-item-right">
        {!hasChildren && <PingDot slug={node.slug} pingUrl={node.pingUrl} />}
      </div>
    </div>
  )

  if (!hasChildren) return RowContent

  return (
    <details class="si-node-details" open>
      <summary class="si-node-summary">{RowContent}</summary>
      <div class="si-node-children">
        {node.children.map(child => <TreeNode key={child.slug} node={child} />)}
      </div>
    </details>
  )
}

// --- Main Component ---

const SystemsManifest: QuartzComponent = () => {
  const stats = roots.reduce((acc, r) => {
    acc[getCat(getDays(r.attestation))]++
    return acc
  }, { fresh: 0, stale: 0, neglected: 0 })

  const countNodes = (node: SystemNode): number =>
    1 + node.children.reduce((sum, child) => sum + countNodes(child), 0)

  const leftCol: SystemNode[] = []
  const rightCol: SystemNode[] = []
  let leftWeight = 0
  let rightWeight = 0

  const sortedRoots = [...roots].sort((a, b) => countNodes(b) - countNodes(a))
  sortedRoots.forEach(root => {
    const weight = countNodes(root)
    if (leftWeight <= rightWeight) {
      leftCol.push(root)
      leftWeight += weight
    } else {
      rightCol.push(root)
      rightWeight += weight
    }
  })

  const renderColumn = (columnRoots: SystemNode[]) => (
    <div class="si-column">
      {columnRoots.map(root => {
        const days = getDays(root.attestation)
        const cat = getCat(days)
        const accent = { fresh: "#22c55e", stale: "#eab308", neglected: "#ef4444" }[cat]

        return (
          <div class="si-panel" style={`border-left-color: ${accent}`} key={root.slug}>
            <div class="si-panel-header">
              <div class="si-panel-title-group">
                <div class="si-panel-title-row">
                  <Favicon url={root.url} hidePlaceholder={true} />
                  <span class="si-panel-name">{root.name}</span>
                  {root.children.length === 0 && <PingDot slug={root.slug} pingUrl={root.pingUrl} />}
                </div>
                <span class={`si-attest si-attest-${cat}`}>{relativeDate(root.attestation)}</span>
              </div>
            </div>
            {root.children.length > 0 && (
              <div class="si-panel-body">
                {root.children.map(child => <TreeNode key={child.slug} node={child} />)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  return (
    <div class="si-root">
      <div class="si-summary-card">
        <div class={`si-summary-badge ${stats.fresh === 0 ? 'si-summary-zero' : 'si-summary-fresh'}`}>
          <span class="si-summary-dot" style="background:#22c55e" />
          <span class="si-summary-count">{stats.fresh}</span>
          <span class="si-summary-label">Fresh</span>
        </div>
        <div class={`si-summary-badge ${stats.stale === 0 ? 'si-summary-zero' : 'si-summary-stale'}`}>
          <span class="si-summary-dot" style="background:#eab308" />
          <span class="si-summary-count">{stats.stale}</span>
          <span class="si-summary-label">Stale</span>
        </div>
        <div class={`si-summary-badge ${stats.neglected === 0 ? 'si-summary-zero' : 'si-summary-neglected'}`}>
          <span class="si-summary-dot" style="background:#ef4444" />
          <span class="si-summary-count">{stats.neglected}</span>
          <span class="si-summary-label">Neglected</span>
        </div>
      </div>

      <div class="si-grid">
        {renderColumn(leftCol)}
        {renderColumn(rightCol)}
      </div>
    </div>
  )
}

const rollupScript = `
document.addEventListener("DOMContentLoaded", () => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(m => {
      if (m.type === "attributes" && m.attributeName === "class") {
        if (m.target.classList.contains("si-down")) {
          let parent = m.target.closest(".si-node-details")?.parentElement?.closest(".si-node-details, .si-panel")
          while (parent) {
            const pDot = parent.querySelector(":scope > summary .si-pdot, :scope > .si-panel-header .si-pdot")
            if (pDot) pDot.classList.add("si-down")
            parent = parent.parentElement?.closest(".si-node-details, .si-panel")
          }
        }
      }
    })
  })
  document.querySelectorAll(".si-pdot").forEach(d => observer.observe(d, { attributes: true }))
})
`

SystemsManifest.afterDOMLoaded = rollupScript

SystemsManifest.css = `
.si-root * { box-sizing: border-box; }
.si-root { margin-top: 1.5rem; font-family: inherit; }

/* Dynamic Summary Card */
.si-summary-card { 
  display: flex; gap: 12px; justify-content: space-between; 
  margin-bottom: 1.25rem; background: var(--light); padding: 12px 14px; 
  border-radius: 8px; border: 1px solid var(--lightgray); box-shadow: 0 1px 2px rgba(0,0,0,0.02); 
}
.si-summary-badge { 
  display: flex; align-items: center; justify-content: center; flex: 1; gap: 6px; 
  font-size: 11px; font-weight: 700; padding: 6px 10px; border-radius: 20px; 
}
.si-summary-fresh { background: rgba(34, 197, 94, 0.1); color: #16a34a; }
.si-summary-stale { background: rgba(234, 179, 8, 0.1); color: #ca8a04; }
.si-summary-neglected { background: rgba(239, 68, 68, 0.1); color: #dc2626; }
.si-summary-zero { background: var(--lightgray); color: var(--gray); opacity: 0.7; }
.si-summary-zero .si-summary-dot { background: currentColor !important; opacity: 0.5; }
.si-summary-dot { width: 6px; height: 6px; border-radius: 50%; }

@media (max-width: 480px) {
  .si-summary-card { flex-direction: column; gap: 8px; padding: 10px; }
  .si-summary-badge { padding: 8px 10px; }
}

/* Grid */
.si-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; align-items: start; width: 100%; }
.si-column { display: flex; flex-direction: column; gap: 10px; }
@media (max-width: 600px) { .si-grid { grid-template-columns: 1fr; } }

/* Panel Interior Mimicry */
.si-panel { 
  background: var(--light); 
  border: 1px solid var(--lightgray); border-left: 3px solid #22c55e; border-radius: 5px; 
  overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.03); transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.si-panel:hover { box-shadow: 0 4px 10px rgba(0,0,0,0.06); transform: translateY(-1px); }

.si-panel-header { 
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
  padding: 8px 12px 8px 11px; border-bottom: 1px solid var(--lightgray); background: rgba(0,0,0,0.012); 
}
.si-panel-title-group { display: flex; flex-direction: column; gap: 4px; }
.si-panel-title-row { display: flex; align-items: center; gap: 6px; }
.si-panel-name { font-size: 12px; font-weight: 600; color: var(--dark); line-height: 1.2; }
.si-panel-body { display: flex; flex-direction: column; padding: 4px 8px 6px; }

.si-attest { font-size: 10px; font-weight: 500; line-height: 1; }
.si-attest-fresh { color: #16a34a; }
.si-attest-stale { color: #ca8a04; }
.si-attest-neglected { color: #dc2626; }

/* Tree Nodes */
.si-node-summary { 
  list-style: none; cursor: pointer; margin: 0; padding: 0;
  display: block; /* kills any native disclosure marker */
}
.si-node-summary::-webkit-details-marker { display: none; } 

.si-item-row { 
  display: flex; align-items: center; justify-content: space-between; gap: 10px; 
  padding: 3px 4px; min-height: 32px; border-radius: 3px; transition: background 0.1s ease; 
}
.si-node-summary:hover .si-item-row { background: rgba(0,0,0,0.035); }

.si-node-children { margin-left: 8px; padding-left: 6px; border-left: 1.5px solid var(--lightgray); }
.si-item-left { display: flex; align-items: center; gap: 6px; min-width: 0; }
.si-item-right { display: flex; flex-shrink: 0; align-items: center; gap: 6px; }

.si-iname { font-size: 12px; color: var(--darkgray); word-break: break-word; overflow-wrap: anywhere; min-width: 0; line-height: 1.3; }

/* Icons & Indicators */
.si-fav { 
  width: 14px !important; height: 14px !important; margin: 0 !important; padding: 0 !important; 
  flex-shrink: 0; border-radius: 3px; object-fit: contain; display: block; 
}
.si-fav-placeholder { 
  width: 14px; height: 14px; display: inline-flex; align-items: center; justify-content: center; opacity: 0.3; margin: 0 !important; 
}
.si-fav-placeholder span { width: 6px; height: 6px; border-radius: 50%; background: currentColor; display: inline-block; }

.si-chevron { width: 10px; height: 10px; color: var(--gray); transition: transform 0.15s ease; flex-shrink: 0; }
.si-node-details[open] > summary .si-chevron { transform: rotate(90deg); }
.si-chevron-spacer { width: 10px; flex-shrink: 0; }

.si-ping-wrap { 
  display: flex; align-items: center; justify-content: center; 
  width: 12px; height: 12px; min-width: 12px; flex: 0 0 12px; contain: strict; 
}
.si-pdot { 
  display: block; width: 6px; height: 6px; min-width: 6px; flex: 0 0 6px;
  background: var(--lightgray); cursor: default;
  transition: background 0.3s ease, box-shadow 0.3s ease; 
  margin: 0; padding: 0; border-radius: 50%; clip-path: circle(3px at center);
}
.si-pdot.si-live { background: #22c55e; }
.si-pdot.si-down { background: #ef4444; box-shadow: 0 0 5px rgba(239,68,68,0.5); }
.si-pdot.si-checking { background: #eab308; opacity: 0.7; }
`

export default (() => SystemsManifest) satisfies QuartzComponentConstructor