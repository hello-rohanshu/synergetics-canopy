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
  items: GalleryItem[]
}

const data = galleryData as GalleryData

// Chapter tags ("400.00") first, numerically; then type tags alphabetically.
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

const FilterIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="6" y1="12" x2="18" y2="12" />
    <line x1="9" y1="18" x2="15" y2="18" />
  </svg>
)

const ClearIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

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
      <div className="ig-thumb ig-placeholder">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      </div>
    )}
    <span className="ig-title">{item.title}</span>
  </a>
)

const SCRIPT = `
(function () {
  function setup(g) {
    if (g.dataset.igReady) return;
    g.dataset.igReady = "1";

    var cards = Array.prototype.slice.call(g.querySelectorAll(".ig-card"));
    var pills = Array.prototype.slice.call(g.querySelectorAll(".ig-pill"));
    var search = g.querySelector(".ig-search");
    var clearBtn = g.querySelector(".ig-search-clear");
    var activeTags = {};   // { "400.00": true, "Tables": true }
    var query = "";

    var CHAPTER_RE = /^\\d+\\.00$/;
    var isChapter = function (t) { return CHAPTER_RE.test(t); };

    function renderPills() {
      pills.forEach(function (x) {
        var t = x.dataset.filterTag || "";
        x.classList.toggle("ig-pill-active", !!activeTags[t]);
      });
    }

    function passes(cardTags) {
      var selChapters = [];
      var selFormats = [];
      for (var t in activeTags) {
        if (!activeTags[t]) continue;
        if (isChapter(t)) selChapters.push(t);
        else selFormats.push(t);
      }

      // 0 selections on either axis = that axis matches everything.
      var chapterMatch = selChapters.length === 0
        || selChapters.some(function (c) { return cardTags.indexOf(c) !== -1; });

      var formatMatch = selFormats.length === 0
        || selFormats.some(function (f) { return cardTags.indexOf(f) !== -1; });

      return chapterMatch && formatMatch;
    }

    function apply() {
      for (var i = 0; i < cards.length; i++) {
        var c = cards[i];
        var tags = (c.dataset.tags || "").split(",").filter(Boolean);
        var titleMatch = !query || (c.dataset.title || "").indexOf(query) !== -1;
        c.style.display = (titleMatch && passes(tags)) ? "" : "none";
      }
    }

    pills.forEach(function (p) {
      p.addEventListener("click", function () {
        var t = p.dataset.filterTag || "";
        if (!t) return;          // ignore stray pills without a tag
        activeTags[t] = !activeTags[t];
        if (!activeTags[t]) delete activeTags[t];
        renderPills();
        apply();
      });
    });

    if (search) {
      search.addEventListener("input", function () {
        query = search.value.toLowerCase().trim();
        if (clearBtn) {
          clearBtn.style.display = search.value.length > 0 ? "flex" : "none";
        }
        apply();
      });

      if (clearBtn) {
        clearBtn.addEventListener("click", function () {
          search.value = "";
          query = "";
          clearBtn.style.display = "none";
          search.focus();
          apply();
        });
      }
    }
  }

  function setupAll() {
    var containers = document.querySelectorAll(".ig-container");
    for (var i = 0; i < containers.length; i++) setup(containers[i]);
  }

  document.addEventListener("nav", setupAll);
  if (document.readyState !== "loading") setupAll();
  else document.addEventListener("DOMContentLoaded", setupAll);
})();
`

const IllustrationGallery: QuartzComponent = () => {
  const items = data.items || []
  const tags = uniqueTags(items)

  return (
    <>
      <style>{`
        .ig-container { margin: 2rem 0; font-family: var(--bodyFont); color: var(--dark); }

        .ig-search-wrap { display: flex; align-items: center; gap: 0.5rem; border: 1px solid var(--lightgray); border-radius: 8px; background: var(--light); padding: 0.4rem 0.7rem; margin-bottom: 0.75rem; transition: border-color 0.15s; }
        .ig-search-wrap:focus-within { border-color: var(--secondary); }
        .ig-search-icon { display: flex; align-items: center; color: var(--gray); flex-shrink: 0; }
        .ig-search { flex: 1; border: none; background: transparent; outline: none; font-family: var(--bodyFont); font-size: 0.9rem; color: var(--dark); padding: 0; }
        .ig-search::placeholder { color: var(--gray); }
        .ig-search-clear { display: none; align-items: center; justify-content: center; border: none; background: none; cursor: pointer; color: var(--gray); padding: 0.2rem; border-radius: 4px; }
        .ig-search-clear:hover { color: var(--dark); }

        .ig-pills { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 1rem; }
        .ig-pill { font-family: var(--bodyFont); font-size: 0.8rem; padding: 0.25rem 0.7rem; border-radius: 999px; border: 1px solid var(--lightgray); background: var(--light); color: var(--darkgray); cursor: pointer; }
        .ig-pill-active { background: var(--secondary); border-color: var(--secondary); color: var(--light); }

        .ig-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; }

        .ig-card { display: flex; flex-direction: column; border: 1px solid var(--lightgray); border-radius: 8px; overflow: hidden; text-decoration: none; color: inherit; background: var(--light); transition: border-color 0.15s; }
        .ig-card:hover { border-color: var(--secondary); }

        .ig-card { cursor: pointer; }
        .ig-thumb { width: 100%; aspect-ratio: 1 / 1; object-fit: cover; display: block; background: var(--highlight); pointer-events: none; }
        .ig-placeholder { display: flex; align-items: center; justify-content: center; font-size: 0.8rem; color: var(--gray); font-style: italic; }

        .ig-title { font-size: 0.82rem; line-height: 1.35; padding: 0.5rem 0.6rem; color: var(--darkgray); }
      `}</style>

      <div className="ig-container">
        <div className="ig-search-wrap">
          <span className="ig-search-icon"><FilterIcon /></span>
          <input className="ig-search" type="text" placeholder="Search" />
          <button className="ig-search-clear" type="button" aria-label="Clear search">
            <ClearIcon />
          </button>
        </div>

        <div className="ig-pills">
          {tags.map((t) => (
            <button className="ig-pill" data-filter-tag={t} key={t}>
              {t}
            </button>
          ))}
        </div>

        <div className="ig-grid">
          {items.map((item) => (
            <Card item={item} key={item.href} />
          ))}
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />
    </>
  )
}

export default (() => IllustrationGallery) satisfies QuartzComponentConstructor