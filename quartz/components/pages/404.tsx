import { i18n } from "../../i18n"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"

const NotFound: QuartzComponent = ({ cfg }: QuartzComponentProps) => {
  const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`)
  const baseDir = url.pathname

  return (
    <article class="popover-hint nf-article">
      <div class="nf-header">
        <p class="nf-label">Your link was imprecise</p>
        <code id="nf-attempted-url" class="nf-url"></code>
      </div>

      <div class="nf-search-row">
        <input
          id="not-found-input"
          type="text"
          placeholder="Search Synergetics…"
          autocomplete="off"
          spellcheck={false}
        />
      </div>

      <div class="nf-columns">
        <ul id="nf-list" class="nf-result-list" />
        <div id="nf-preview" class="nf-preview-pane">
          <p class="nf-preview-hint">← Select a result</p>
        </div>
      </div>

      <a class="nf-home" href={baseDir}>{i18n(cfg.locale).pages.error.home}</a>

      <script dangerouslySetInnerHTML={{ __html: `
(function () {
  var BASE = ${JSON.stringify(baseDir)}.replace(/\\/$/, "");

  // ── Query extraction ─────────────────────────────────────────────────────
  function extractQuery(href) {
    // href is window.location.href — includes hash
    var hashIndex = href.indexOf("#");
    var hash      = hashIndex > -1 ? href.slice(hashIndex + 1) : "";
    var pathname  = hashIndex > -1 ? href.slice(0, hashIndex) : href;

    // Remove origin
    var path = pathname.replace(/^https?:\\/\\/[^\\/]+/, "").replace(/\\/$/, "");

    // Last non-empty path segment
    var segments = path.split("/").filter(Boolean);
    var lastSeg  = segments[segments.length - 1] || "";

    try { lastSeg = decodeURIComponent(lastSeg); } catch(e) {}

    if (hash) {
      // Extract only leading digits from hash (ignore trailing slug text)
      var hashDigits = hash.match(/^(\\d+)/);
      if (!hashDigits) return slugText(lastSeg); // no digits, fall back to slug

      var digits = hashDigits[1];

      // Determine dot position from the leading number in lastSeg
      var segNum = lastSeg.match(/^(\\d+)\\./);
      var dotPos = segNum ? segNum[1].length : 3; // default 3 if we can't tell

      // Insert dot
      var coord = digits.slice(0, dotPos) + "." + digits.slice(dotPos);
      return coord;
    }

    // No hash — use slug text
    return slugText(lastSeg);
  }

  function slugText(seg) {
    // Collapse any run of hyphens to space, keep dots (section numbers)
    return seg.replace(/-+/g, " ").trim();
  }

  // ── Scoring ──────────────────────────────────────────────────────────────
  function score(query, slug, entry) {
    var terms = query.toLowerCase().split(/\\s+/).filter(Boolean);
    var t = (entry.title   || "").toLowerCase();
    var c = (entry.content || "").toLowerCase();
    var s = slug.toLowerCase();
    var n = 0;
    for (var i = 0; i < terms.length; i++) {
      var q = terms[i];
      if (t.includes(q)) n += 10;
      if (s.includes(q)) n += 8;
      if (c.includes(q)) n += 2;
    }
    return n;
  }

  function runSearch(index, query) {
    if (!query || !index) return [];
    var out = [];
    var keys = Object.keys(index);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      var sc = score(query, k, index[k]);
      if (sc > 0) out.push({ slug: k, entry: index[k], score: sc });
    }
    out.sort(function(a,b){ return b.score - a.score; });
    return out.slice(0, 10);
  }

  // ── Render ───────────────────────────────────────────────────────────────
  function renderList(results, activeSlug) {
    var list = document.getElementById("nf-list");
    if (!list) return;
    list.innerHTML = "";
    if (!results.length) {
      list.innerHTML = '<li class="nf-empty">No results — try editing the query above</li>';
      return;
    }
    for (var i = 0; i < results.length; i++) {
      (function(r) {
        var li   = document.createElement("li");
        li.className = "nf-item" + (r.slug === activeSlug ? " nf-active" : "");
        li.dataset.slug = r.slug;
        li.innerHTML =
          '<span class="nf-item-title">' + (r.entry.title || r.slug) + '</span>';
        li.addEventListener("click", function() {
          showPreview(r);
          document.querySelectorAll(".nf-item").forEach(function(el){ el.classList.remove("nf-active"); });
          li.classList.add("nf-active");
        });
        list.appendChild(li);
      })(results[i]);
    }
    // Auto-select first
    if (results.length) showPreview(results[0]);
  }

  function showPreview(r) {
    var pane = document.getElementById("nf-preview");
    if (!pane) return;
    var href = BASE + "/" + r.slug;
    var desc = r.entry.description || (r.entry.content || "").slice(0, 300);
    pane.innerHTML =
      '<a class="nf-preview-title" href="' + href + '">' + (r.entry.title || r.slug) + '</a>' +
      (desc ? '<p class="nf-preview-desc">' + desc + '</p>' : '') +
      '<a class="nf-preview-link" href="' + href + '">Go to page →</a>';
  }

  // ── Boot ─────────────────────────────────────────────────────────────────
  var contentIndex = null;
  var currentQuery = "";

  function debounce(fn, ms) {
    var t;
    return function() { clearTimeout(t); var a = arguments; t = setTimeout(function(){ fn.apply(null,a); }, ms); };
  }

  function go(query) {
    currentQuery = query;
    var results = runSearch(contentIndex, query);
    renderList(results, null);
  }

  // Show attempted URL
  document.addEventListener("DOMContentLoaded", function() {
    var urlEl = document.getElementById("nf-attempted-url");
    if (urlEl) urlEl.textContent = window.location.href;

    var query = extractQuery(window.location.href);
    var input = document.getElementById("not-found-input");
    if (input) {
      input.value = query;
      input.addEventListener("input", debounce(function(){ go(input.value); }, 150));
    }
    currentQuery = query;
    if (contentIndex) go(query);
  });

  fetch(BASE + "/static/contentIndex.json")
    .then(function(r){ return r.json(); })
    .then(function(data){
      contentIndex = data;
      if (currentQuery) go(currentQuery);
    })
    .catch(function(e){ console.warn("Canopy 404: contentIndex load failed", e); });

})();
      ` }} />

      <style dangerouslySetInnerHTML={{ __html: `
.nf-article { max-width: 100%; }

.nf-header { margin-bottom: 1.25rem; }
.nf-label {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--gray);
  margin: 0 0 0.35rem;
}
.nf-url {
  display: block;
  font-size: 0.82rem;
  color: var(--secondary);
  word-break: break-all;
  background: var(--highlight);
  padding: 0.3rem 0.5rem;
  border-radius: 3px;
  font-family: var(--codeFont, monospace);
}

.nf-search-row { margin-bottom: 1rem; }
#not-found-input {
  width: 100%;
  max-width: 480px;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  font-family: inherit;
  border: 1px solid var(--lightgray);
  border-radius: 4px;
  background: var(--light);
  color: var(--dark);
  outline: none;
  box-sizing: border-box;
}
#not-found-input:focus { border-color: var(--secondary); }

/* Two-column layout */
.nf-columns {
  display: flex;
  gap: 0;
  border: 1px solid var(--lightgray);
  border-radius: 4px;
  min-height: 280px;
  overflow: hidden;
  margin-bottom: 1.25rem;
}

/* Left — result list */
.nf-result-list {
  list-style: none;
  padding: 0;
  margin: 0;
  width: 38%;
  min-width: 180px;
  border-right: 1px solid var(--lightgray);
  overflow-y: auto;
  flex-shrink: 0;
}
.nf-item {
  padding: 0.6rem 0.75rem;
  cursor: pointer;
  border-bottom: 1px solid var(--lightgray);
  transition: background 0.1s;
}
.nf-item:last-child { border-bottom: none; }
.nf-item:hover, .nf-item.nf-active {
  background: var(--highlight);
}
.nf-item.nf-active .nf-item-title { color: var(--secondary); }
.nf-item-title {
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--dark);
  line-height: 1.35;
}
.nf-empty {
  padding: 0.75rem;
  font-size: 0.85rem;
  color: var(--gray);
}

/* Right — preview */
.nf-preview-pane {
  flex: 1;
  padding: 1rem 1.1rem;
  overflow-y: auto;
}
.nf-preview-hint { color: var(--gray); font-size: 0.85rem; margin: 0; }
.nf-preview-title {
  display: block;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--secondary);
  text-decoration: none;
  margin-bottom: 0.6rem;
  line-height: 1.3;
}
.nf-preview-title:hover { text-decoration: underline; }
.nf-preview-desc {
  font-size: 0.875rem;
  color: var(--dark);
  line-height: 1.6;
  margin: 0 0 1rem;
}
.nf-preview-link {
  font-size: 0.85rem;
  color: var(--secondary);
  text-decoration: none;
  font-weight: 500;
}
.nf-preview-link:hover { text-decoration: underline; }

.nf-home {
  display: inline-block;
  font-size: 0.875rem;
  color: var(--gray);
}

/* Mobile: stack columns */
@media (max-width: 600px) {
  .nf-columns { flex-direction: column; min-height: unset; }
  .nf-result-list { width: 100%; border-right: none; border-bottom: 1px solid var(--lightgray); max-height: 220px; }
}
      ` }} />
    </article>
  )
}

export default (() => NotFound) satisfies QuartzComponentConstructor