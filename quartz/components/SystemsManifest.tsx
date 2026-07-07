import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import systemsData from "../static/data/systems-manifest.json"

// --- Types & Data Fetching ---

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

const formatRelTime = (days: number): string => {
  if (days >= 999) return "Never reviewed"
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

// --- Sub-Components ---

const Favicon = ({ url }: { url: string }) => {
  const domain = getDomain(url)
  if (!domain) return <div class="si-fav-null" />
  return <img class="si-fav" src={`https://icon.horse/icon/${domain}`} alt="" width="14" height="14" />
}

const PingDot = ({ slug, pingUrl }: { slug: string; pingUrl: string }) => {
  if (!pingUrl) return null
  const id = slug.replace("systems/", "").replace(/\s+/g, "-").toLowerCase()
  return (
    <div class="si-ping-box">
      <span class="si-pdot" id={`si-pdot-${id}`} data-ping-url={pingUrl} />
    </div>
  )
}

const Attestation = ({ date }: { date: string }) => {
  const days = getDays(date)
  const cat = getCat(days)
  return <span class={`si-attest si-attest-${cat}`}>{formatRelTime(days)}</span>
}

const TreeNode = ({ node }: { node: SystemNode }) => {
  const hasChildren = node.children.length > 0
  
  const content = (
    <div class="si-row">
      <div class="si-row-left">
        {hasChildren && <span class="si-chevron" />}
        <Favicon url={node.url} />
        <span class="si-name">{node.name}</span>
      </div>
      <div class="si-row-right">
        <Attestation date={node.attestation} />
        <PingDot slug={node.slug} pingUrl={node.pingUrl} />
      </div>
    </div>
  )

  if (!hasChildren) return content

  return (
    <details class="si-tree" open>
      <summary>{content}</summary>
      <div class="si-children">
        {node.children.map(child => <TreeNode key={child.slug} node={child} />)}
      </div>
    </details>
  )
}

// --- Main Component ---

const SystemsManifest: QuartzComponent = () => {
  const stats = roots.reduce(
    (acc, r) => {
      acc[getCat(getDays(r.attestation))]++
      return acc
    },
    { fresh: 0, stale: 0, neglected: 0 }
  )

  return (
    <div class="si-manifest">
      <div class="si-summary">
        <div class="si-sum-item si-fresh"><b>{stats.fresh}</b> Fresh</div>
        <div class="si-sum-item si-stale"><b>{stats.stale}</b> Stale</div>
        <div class="si-sum-item si-neglected"><b>{stats.neglected}</b> Neglected</div>
      </div>

      <div class="si-grid">
        {roots.map(root => {
          const cat = getCat(getDays(root.attestation))
          return (
            <div class={`si-panel si-border-${cat}`} key={root.slug}>
              <div class="si-panel-header">
                <Favicon url={root.url} />
                <span class="si-panel-title">{root.name}</span>
                <PingDot slug={root.slug} pingUrl={root.pingUrl} />
              </div>
              <div class="si-panel-meta">
                <Attestation date={root.attestation} />
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
    </div>
  )
}

// Client-side Rollup Logic: If a child dot becomes .si-down, propagate to parent
const rollupScript = `
document.addEventListener("DOMContentLoaded", () => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(m => {
      if (m.type === "attributes" && m.attributeName === "class") {
        const dot = m.target;
        if (dot.classList.contains("si-down")) {
          let parent = dot.closest(".si-tree")?.parentElement?.closest(".si-tree, .si-panel");
          while (parent) {
            const parentDot = parent.querySelector(":scope > summary .si-pdot, :scope > .si-panel-header .si-pdot");
            if (parentDot) parentDot.classList.add("si-down");
            parent = parent.parentElement?.closest(".si-tree, .si-panel");
          }
        }
      }
    });
  });
  document.querySelectorAll(".si-pdot").forEach(d => observer.observe(d, { attributes: true }));
});
`

SystemsManifest.afterDOMLoaded = rollupScript

SystemsManifest.css = `
.si-manifest { font-family: var(--bodyFont); margin-top: 2rem; }
.si-summary { display: flex; gap: 1rem; margin-bottom: 2rem; }
.si-sum-item { padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.9rem; flex: 1; text-align: center; background: var(--lightgray); }
.si-fresh { border-bottom: 3px solid #22c55e; }
.si-stale { border-bottom: 3px solid #eab308; }
.si-neglected { border-bottom: 3px solid #ef4444; }

.si-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }
.si-panel { background: var(--light); border: 1px solid var(--lightgray); border-radius: 8px; padding: 1rem; display: flex; flex-direction: column; }
.si-border-fresh { border-left: 4px solid #22c55e; }
.si-border-stale { border-left: 4px solid #eab308; }
.si-border-neglected { border-left: 4px solid #ef4444; }

.si-panel-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; }
.si-panel-title { font-weight: 700; font-size: 1rem; color: var(--dark); }
.si-panel-meta { margin-bottom: 1rem; }

.si-tree { margin-top: 0.5rem; }
.si-tree summary { list-style: none; cursor: pointer; }
.si-tree summary::-webkit-details-marker { display: none; }
.si-children { margin-left: 0.75rem; padding-left: 0.75rem; border-left: 1px solid var(--lightgray); }

.si-row { display: flex; align-items: center; justify-content: space-between; padding: 0.2rem 0; font-size: 0.85rem; }
.si-row-left, .si-row-right { display: flex; align-items: center; gap: 0.5rem; }
.si-name { color: var(--darkgray); }

.si-fav { border-radius: 2px; }
.si-fav-null { width: 14px; height: 14px; background: var(--lightgray); border-radius: 50%; }

.si-attest { font-size: 0.75rem; font-weight: 500; }
.si-attest-fresh { color: #16a34a; }
.si-attest-stale { color: #ca8a04; }
.si-attest-neglected { color: #dc2626; }

.si-ping-box { width: 12px; height: 12px; display: flex; align-items: center; }
.si-pdot { width: 6px; height: 6px; border-radius: 50%; background: var(--lightgray); transition: all 0.3s; }
.si-pdot.si-live { background: #22c55e; }
.si-pdot.si-down { background: #ef4444; box-shadow: 0 0 4px #ef4444; }
.si-pdot.si-checking { background: #eab308; opacity: 0.6; }

.si-chevron { width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 6px solid var(--gray); transition: transform 0.2s; }
details[open] > summary .si-chevron { transform: rotate(-90deg); }
`

export default (() => SystemsManifest) satisfies QuartzComponentConstructor