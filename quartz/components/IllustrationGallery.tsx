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
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="6" y1="12" x2="18" y2="12" />
    <line x1="9" y1="18" x2="15" y2="18" />
  </svg>
)

const ClearIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const ExpandIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
)

const Card = ({ item }: { item: GalleryItem }) => (
  <div className="ig-card-wrap">
    <a
      className="ig-card"
      href={item.href}
      data-title={item.title.toLowerCase()}
      data-tags={(item.tags || []).join(",")}
    >
      <div className="ig-thumb-wrap">
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
      </div>
      <span className="ig-title">{item.title}</span>
    </a>
    {item.thumb && (
      <button className="ig-zoom" type="button" aria-label="Zoom image" title="Zoom">
        <ExpandIcon />
      </button>
    )}
  </div>
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
    var activeTags = {};
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
        var wrap = c.closest(".ig-card-wrap");
        var el = wrap || c;
        el.style.display = (titleMatch && passes(tags)) ? "" : "none";
      }
    }

    pills.forEach(function (p) {
      p.addEventListener("click", function () {
        var t = p.dataset.filterTag || "";
        if (!t) return;
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

    function openZoom(img) {
      if (!img || !img.src) return;
      document.dispatchEvent(new CustomEvent("quartz:zoom-open", { detail: { target: img } }));
    }

    // Expand button (desktop): open the zoom overlay for this thumbnail.
    var zoomBtns = Array.prototype.slice.call(g.querySelectorAll(".ig-zoom"));
    zoomBtns.forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var wrap = btn.closest(".ig-card-wrap");
        var card = wrap && wrap.querySelector(".ig-card");
        openZoom(card && card.querySelector(".ig-thumb"));
      });
    });

    // Mobile: the expand button is hidden, so tapping the thumbnail itself
    // opens the zoom instead of navigating. Tapping the title still navigates.
    var thumbWraps = Array.prototype.slice.call(g.querySelectorAll(".ig-thumb-wrap"));
    var mobileMq = window.matchMedia("(max-width: 640px)");
    thumbWraps.forEach(function (tw) {
      tw.addEventListener("click", function (e) {
        if (!mobileMq.matches) return;
        var img = tw.querySelector(".ig-thumb");
        if (!img || !img.src) return;
        e.preventDefault();
        e.stopPropagation();
        openZoom(img);
      });
    });
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

        .ig-search-wrap { display: flex; align-items: center; gap: 0.5rem; border: 1px solid var(--lightgray); border-radius: 4px; background: var(--light); padding: 0 0.7rem; height: 2rem; box-sizing: border-box; margin-bottom: 0.75rem; transition: border-color 0.15s; }
        .ig-search-wrap:focus-within { border-color: var(--secondary); }
        .ig-search-icon { display: flex; align-items: center; color: var(--gray); flex-shrink: 0; }
        .ig-search { flex: 1; border: none; background: transparent; outline: none; font-family: var(--bodyFont); font-size: 0.9rem; color: var(--dark); padding: 0; }
        .ig-search::placeholder { color: var(--gray); }
        .ig-search-clear { display: none; align-items: center; justify-content: center; border: none; background: none; cursor: pointer; color: var(--gray); padding: 0.2rem; border-radius: 4px; }
        .ig-search-clear:hover { color: var(--dark); }

        .ig-pills { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 1rem; }
        .ig-pill { font-family: var(--bodyFont); font-size: 0.88rem; padding: 0.32rem 0.85rem; border-radius: 999px; border: 1px solid var(--lightgray); background: var(--light); color: var(--darkgray); cursor: pointer; }
        .ig-pill-active { background: var(--secondary); border-color: var(--secondary); color: var(--light); }

        .ig-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; }

        .ig-card-wrap { position: relative; }
        .ig-card { display: flex; flex-direction: column; height: 100%; border: 1px solid var(--lightgray); border-radius: 4px; text-decoration: none; color: inherit; background: var(--light); transition: border-color 0.15s; cursor: pointer; }
        .ig-card:hover, .ig-card-wrap:hover .ig-card { border-color: var(--secondary); }

        .ig-thumb-wrap { aspect-ratio: 1 / 1; overflow: hidden; background: var(--highlight); border-radius: 3px 3px 0 0; }
        .ig-thumb { width: 100%; height: auto; display: block; pointer-events: none; }
        .ig-thumb.medium-zoom-image--opened { pointer-events: auto; }
        .ig-placeholder { display: flex; align-items: center; justify-content: center; height: 100%; color: var(--gray); }

        .ig-title { font-size: 0.82rem; line-height: 1.35; padding: 0.5rem 0.6rem; color: var(--darkgray); }

        .ig-zoom { position: absolute; top: 6px; right: 6px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border: none; border-radius: 3px; background: rgba(0,0,0,0.55); color: #fff; cursor: pointer; opacity: 0; transition: opacity 0.15s, background 0.15s; }
        .ig-card-wrap:hover .ig-zoom { opacity: 1; }
        .ig-zoom:hover { background: rgba(0,0,0,0.8); }
        @media (pointer: coarse) { .ig-zoom { opacity: 1; } }
      
                @media (max-width: 640px) {
          .ig-container { margin: 1.25rem 0; }

          .ig-pills { flex-wrap: nowrap; overflow-x: auto; gap: 0.35rem; padding-bottom: 0.25rem; margin-bottom: 0.85rem; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
          .ig-pills::-webkit-scrollbar { display: none; }
          .ig-pill { flex-shrink: 0; font-size: 0.82rem; padding: 0.28rem 0.7rem; }

          .ig-grid { grid-template-columns: 1fr; gap: 0.5rem; }

          .ig-card { flex-direction: row; align-items: stretch; }

          .ig-thumb-wrap { width: 72px; height: 72px; flex-shrink: 0; aspect-ratio: auto; align-self: center; border-radius: 3px 0 0 3px; display: flex; align-items: center; justify-content: center; }

          .ig-title { flex: 1; align-self: center; padding: 0.5rem 0.7rem; font-size: 0.82rem; overflow-wrap: break-word; }

          .ig-zoom { display: none; }

          .ig-placeholder svg { width: 20px; height: 20px; }
        }
      
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