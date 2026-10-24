// quartz/components/IllustrationGallery.tsx
import galleryData from "../static/data/illustrations.json"
import { QuartzComponent, QuartzComponentConstructor } from "./types"

interface GalleryItem {
  title: string
  href: string
  thumb: string
  tags?: string[]
}

interface GalleryData {
  generated: string
  figures: GalleryItem[]
  misc: GalleryItem[]
}

const data = galleryData as GalleryData

// Chapter tags ("400.00") sort first, numerically. Then type tags alphabetically.
function tagOrder(a: string, b: string) {
  const aChapter = /^\d+\.00$/.test(a)
  const bChapter = /^\d+\.00$/.test(b)
  if (aChapter && bChapter) return parseInt(a, 10) - parseInt(b, 10)
  if (aChapter) return -1
  if (bChapter) return 1
  return a.localeCompare(b)
}

function uniqueTags(items: GalleryItem[]) {
  const s = new Set<string>()
  items.forEach((i) => (i.tags || []).forEach((t) => s.add(t)))
  return [...s].sort(tagOrder)
}

const Card = ({ item }: { item: GalleryItem }) => (
  <a
    className="ig-card"
    href={item.href}
    data-title={item.title.toLowerCase()}
    data-tags={(item.tags || []).join(",")}
  >
    {item.thumb ? (
      <img className="ig-thumb" src={item.thumb} alt="" loading="lazy" />
    ) : (
      <div className="ig-thumb ig-placeholder">no image</div>
    )}
    <span className="ig-title">{item.title}</span>
  </a>
)

const Gallery = ({ heading, items }: { heading: string; items: GalleryItem[] }) => {
  const tags = uniqueTags(items)
  return (
    <div className="ig-gallery">
      <div className="ig-heading">{heading}</div>

      <div className="ig-controls">
        <div className="ig-pills">
          <button className="ig-pill ig-pill-active" data-filter-tag="">
            All
          </button>
          {tags.map((t) => (
            <button className="ig-pill" data-filter-tag={t} key={t}>
              {t}
            </button>
          ))}
        </div>
        <input className="ig-search" type="text" placeholder="Filter by title…" />
      </div>

      <div className="ig-grid">
        {items.map((item) => (
          <Card item={item} key={item.href} />
        ))}
      </div>
    </div>
  )
}

// Runs on first load and on every SPA navigation ("nav" event).
const SCRIPT = `
(function () {
  function setupGallery(g) {
    if (g.dataset.igReady) return;
    g.dataset.igReady = "1";

    var cards = Array.prototype.slice.call(g.querySelectorAll(".ig-card"));
    var pills = Array.prototype.slice.call(g.querySelectorAll(".ig-pill"));
    var search = g.querySelector(".ig-search");
    var activeTag = "";
    var query = "";

    function apply() {
      for (var i = 0; i < cards.length; i++) {
        var c = cards[i];
        var tags = (c.dataset.tags || "").split(",").filter(Boolean);
        var titleMatch = !query || (c.dataset.title || "").indexOf(query) !== -1;
        var tagMatch = !activeTag || tags.indexOf(activeTag) !== -1;
        c.style.display = (titleMatch && tagMatch) ? "" : "none";
      }
    }

    pills.forEach(function (p) {
      p.addEventListener("click", function () {
        pills.forEach(function (x) { x.classList.remove("ig-pill-active"); });
        p.classList.add("ig-pill-active");
        activeTag = p.dataset.filterTag || "";
        apply();
      });
    });

    if (search) {
      search.addEventListener("input", function () {
        query = search.value.toLowerCase().trim();
        apply();
      });
    }
  }

  function setupAll() {
    var galleries = document.querySelectorAll(".ig-gallery");
    for (var i = 0; i < galleries.length; i++) setupGallery(galleries[i]);
  }

  document.addEventListener("nav", setupAll);
  if (document.readyState !== "loading") setupAll();
  else document.addEventListener("DOMContentLoaded", setupAll);
})();
`

const IllustrationGallery: QuartzComponent = () => (
  <>
    <style>{`
      .ig-container { margin: 2rem 0; font-family: var(--bodyFont); color: var(--dark); }
      .ig-heading { font-size: 1.15rem; font-weight: 700; color: var(--secondary); margin: 1.5rem 0 0.75rem; }

      .ig-controls { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; margin-bottom: 1rem; }
      .ig-pills { display: flex; flex-wrap: wrap; gap: 0.4rem; }
      .ig-pill { font-family: var(--bodyFont); font-size: 0.8rem; padding: 0.25rem 0.7rem; border-radius: 999px; border: 1px solid var(--lightgray); background: var(--light); color: var(--darkgray); cursor: pointer; transition: all 0.15s; }
      .ig-pill:hover { border-color: var(--secondary); color: var(--secondary); }
      .ig-pill-active { background: var(--secondary); border-color: var(--secondary); color: var(--light); }
      .ig-search { font-family: var(--bodyFont); font-size: 0.85rem; padding: 0.35rem 0.65rem; border-radius: 6px; border: 1px solid var(--lightgray); background: var(--light); color: var(--dark); min-width: 180px; }
      .ig-search:focus { outline: none; border-color: var(--secondary); }

      .ig-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; }

      .ig-card { display: flex; flex-direction: column; border: 1px solid var(--lightgray); border-radius: 8px; overflow: hidden; text-decoration: none; color: inherit; background: var(--light); transition: border-color 0.15s; }
      .ig-card:hover { border-color: var(--secondary); }

      .ig-thumb { width: 100%; aspect-ratio: 1 / 1; object-fit: cover; display: block; background: var(--highlight); }
      .ig-placeholder { display: flex; align-items: center; justify-content: center; font-size: 0.8rem; color: var(--gray); font-style: italic; }

      .ig-title { font-size: 0.82rem; line-height: 1.35; padding: 0.5rem 0.6rem; color: var(--darkgray); }

      .ig-empty { font-size: 0.9rem; color: var(--gray); font-style: italic; }
    `}</style>

    <div className="ig-container">
      <Gallery heading="Figures" items={data.figures || []} />
      <Gallery heading="Misc" items={data.misc || []} />
    </div>

    <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />
  </>
)

export default (() => IllustrationGallery) satisfies QuartzComponentConstructor