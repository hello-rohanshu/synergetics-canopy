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

  // ── URL parsing & query selection (spec v1.1) ────────────────────────────
  function parseURL(href) {
    var hashIndex = href.indexOf("#");
    var hash      = hashIndex > -1 ? href.slice(hashIndex + 1) : "";
    var pathname  = hashIndex > -1 ? href.slice(0, hashIndex) : href;

    var path = pathname.replace(/^https?:\\/\\/[^\\/]+/, "").replace(/\\/$/, "");
    var segments = path.split("/").filter(Boolean);
    var lastSeg  = segments[segments.length - 1] || "";

    try { lastSeg = decodeURIComponent(lastSeg); } catch(e) {}

    var cleanedSlug = lastSeg.replace(/-+/g, " ").trim();

    // v1.1: extract pagePrefix for parent-page boost
    var pageNumMatch = cleanedSlug.match(/^(\\d+(?:\\.\\d+)?)/);
    var pagePrefix = pageNumMatch ? pageNumMatch[1] : "";

    var result = {
      slug: lastSeg,
      hash: hash,
      hasAnchor: hash.length > 0,
      query: "",
      mode: "page",   // "page" or "content"
      pagePrefix: pagePrefix
    };

    if (!hash) {
      // Case 1: No anchor → page-level search
      result.query = cleanedSlug;
      result.mode = "page";
      return result;
    }

    // Anchor exists. Determine anchor type.
    var digits = hash.match(/^(\\d+)/);
    var afterDigits = hash.slice(digits ? digits[0].length : 0).replace(/^-+/, "").trim();
    var cleanedAnchorText = afterDigits.replace(/-+/g, " ").trim();

    // Helper to compute decimal position from slug's integer part length
    function getDotPos() {
      if (pageNumMatch) {
        var integerPart = pageNumMatch[1].split(".")[0];
        return integerPart.length;
      }
      return 3; // default
    }

    if (digits && cleanedAnchorText.length > 0) {
      // Case 3: coordinate + anchor title
      var digitsStr = digits[0];
      var dotPos = getDotPos();
      var coord = digitsStr.slice(0, dotPos) + "." + digitsStr.slice(dotPos);
      result.query = coord + " " + cleanedAnchorText;
      result.mode = "content";
    } else if (digits && cleanedAnchorText.length === 0) {
      // Case 2: coordinate only
      var digitsStr2 = digits[0];
      var dotPos2 = getDotPos();
      var coord2 = digitsStr2.slice(0, dotPos2) + "." + digitsStr2.slice(dotPos2);
      result.query = coord2;
      result.mode = "content";
    } else if (!digits && hash.length > 0) {
      // Case 4: anchor title only
      result.query = cleanedAnchorText;
      result.mode = "content";
    }

    return result;
  }

  // ── Fuse.js instances ────────────────────────────────────────────────────
  var pageFuse = null;
  var contentFuse = null;

  function createDocObjects(data) {
    return Object.entries(data).map(function(entry) {
      var slug = entry[0];
      var meta = entry[1] || {};
      return {
        slug: slug,
        title: meta.title || "",
        tags: (meta.tags || []).join(" "),
        description: meta.description || "",
        content: meta.content || ""
      };
    });
  }

  function buildPageFuse(docs) {
    return new window.Fuse(docs, {
      keys: [
        { name: "title", weight: 0.6 },
        { name: "slug", weight: 0.3 },
        { name: "tags", weight: 0.1 }
      ],
      threshold: 0.5,               // slightly more permissive for more results
      distance: 200,
      includeScore: true,
      ignoreFieldNorm: false,
      minMatchCharLength: 2
    });
  }

  function buildContentFuse(docs) {
    return new window.Fuse(docs, {
      keys: [
        { name: "content", weight: 0.7 },
        { name: "title", weight: 0.3 }
      ],
      threshold: 0.6,               // more permissive to return multiple candidates
      distance: 200,
      includeScore: true,
      ignoreFieldNorm: true,        // v1.1: don't penalise long pages
      minMatchCharLength: 2
    });
  }

  function searchWithFuse(fuse, query, limit) {
    if (!fuse) return [];
    var raw = fuse.search(query, { limit: limit || 10 });
    return raw.map(function(r) {
      return {
        slug: r.item.slug,
        title: r.item.title,
        description: r.item.description,
        content: r.item.content,
        score: r.score
      };
    });
  }

  // ── Parent-page boost (v1.1) ─────────────────────────────────────────────
  var currentPagePrefix = "";

  function applyParentBoost(results) {
    if (!currentPagePrefix) return results;

    // Give a very low score (high priority) to results whose slug starts with pagePrefix
    var boosted = results.map(function(r) {
      if (r.slug.indexOf(currentPagePrefix) === 0) {
        r.score = -Infinity;
      }
      return r;
    });

    boosted.sort(function(a, b) { return a.score - b.score; });
    return boosted;
  }

  // ── Render ───────────────────────────────────────────────────────────────
  var fetchCounter = 0;

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
          '<span class="nf-item-title">' + (r.title || r.slug) + '</span>';
        li.addEventListener("click", function() {
          showPreview(r);
          document.querySelectorAll(".nf-item").forEach(function(el){ el.classList.remove("nf-active"); });
          li.classList.add("nf-active");
        });
        list.appendChild(li);
      })(results[i]);
    }
    if (results.length) showPreview(results[0]);
  }

  function showPreview(r) {
    var pane = document.getElementById("nf-preview");
    if (!pane) return;

    var href = BASE + "/" + r.slug;
    var fetchId = ++fetchCounter;

    pane.innerHTML = '<p class="nf-preview-hint">Loading…</p>';

    fetch(href)
      .then(function(res) {
        if (!res.ok) throw new Error('Page not found');
        return res.text();
      })
      .then(function(html) {
        if (fetchId !== fetchCounter) return;

        var doc = new DOMParser().parseFromString(html, 'text/html');
        var article = doc.querySelector('article') || doc.querySelector('main') || doc.body;
        var contentHTML = article ? article.innerHTML : '';
        var temp = document.createElement('div');
        temp.innerHTML = contentHTML;
        temp.querySelectorAll('script, style, link[rel="stylesheet"]').forEach(function(el) { el.remove(); });
        temp.querySelectorAll('a').forEach(function(a) { a.style.pointerEvents = 'none'; });

        pane.innerHTML =
          '<a class="nf-preview-title" href="' + href + '">' + (r.title || r.slug) + '</a>' +
          '<div class="nf-preview-body">' + temp.innerHTML + '</div>' +
          '<a class="nf-preview-link" href="' + href + '">Go to page →</a>';
      })
      .catch(function(e) {
        if (fetchId !== fetchCounter) return;

        var desc = r.description || (r.content || "").slice(0, 300);
        pane.innerHTML =
          '<a class="nf-preview-title" href="' + href + '">' + (r.title || r.slug) + '</a>' +
          (desc ? '<p class="nf-preview-desc">' + desc + '</p>' : '') +
          '<a class="nf-preview-link" href="' + href + '">Go to page →</a>';
      });
  }

  // ── Boot ─────────────────────────────────────────────────────────────────
  var currentQuery = "";
  var currentMode = "page"; // default

  function debounce(fn, ms) {
    var t;
    return function() { clearTimeout(t); var a = arguments; t = setTimeout(function(){ fn.apply(null,a); }, ms); };
  }

  function go(query, mode) {
    currentQuery = query || "";
    if (mode) currentMode = mode;
    var fuse = (currentMode === "content") ? contentFuse : pageFuse;
    var results = searchWithFuse(fuse, currentQuery, 10);

    // Apply parent-page boost only for automatic URL parsing
    if (currentPagePrefix) {
      results = applyParentBoost(results);
    }

    renderList(results, null);
  }

  document.addEventListener("DOMContentLoaded", function() {
    var urlEl = document.getElementById("nf-attempted-url");
    if (urlEl) urlEl.textContent = window.location.href;

    var parsed = parseURL(window.location.href);
    currentPagePrefix = parsed.pagePrefix;  // set once, cleared on manual edit

    var input = document.getElementById("not-found-input");
    if (input) {
      input.value = parsed.query;
      input.addEventListener("input", debounce(function(){
        // User typed: clear parent-page boost
        currentPagePrefix = "";
        var val = input.value.trim();
        if (/^\\d+(\\.\\d+)?$/.test(val)) {
          currentMode = "content";
        }
        go(val, currentMode);
      }, 150));
    }

    currentQuery = parsed.query;
    currentMode = parsed.mode;
    if (pageFuse || contentFuse) {
      go(currentQuery, currentMode);
    }
  });

  function buildFuseIndex(data) {
    var docs = createDocObjects(data);
    if (window.Fuse) {
      pageFuse = buildPageFuse(docs);
      contentFuse = buildContentFuse(docs);

      // now that indexes are ready, run initial search
      if (currentQuery) go(currentQuery, currentMode);
    } else {
      console.warn("Fuse CDN failed to load");
    }
  }

  // Load Fuse and content index
  fetch(BASE + "/static/contentIndex.json")
    .then(function(r){ return r.json(); })
    .then(function(data){
      if (window.Fuse) {
        buildFuseIndex(data);
      } else {
        var script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/fuse.js@7/dist/fuse.min.js';
        script.onload = function() {
          buildFuseIndex(data);
        };
        script.onerror = function() {
          console.warn("Fuse CDN failed to load");
        };
        document.head.appendChild(script);
      }
    })
    .catch(function(e){ console.warn("Canopy 404: contentIndex fetch failed", e); });

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

/* Two-column layout with fixed height and internal scrolling */
.nf-columns {
  display: flex;
  gap: 0;
  border: 1px solid var(--lightgray);
  border-radius: 4px;
  height: 60vh;               /* limit overall height */
  max-height: 60vh;
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
  overflow-y: auto;           /* scroll if list is long */
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

/* Right — preview pane, scrollable and height-limited */
.nf-preview-pane {
  flex: 1;
  padding: 1rem 1.1rem;
  overflow-y: auto;           /* make preview internally scrollable */
  overflow-x: hidden;
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

/* Preview body */
.nf-preview-body {
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--dark);
  margin-bottom: 1rem;
}
.nf-preview-body a {
  pointer-events: none;
  color: inherit;
  text-decoration: none;
}

.nf-home {
  display: inline-block;
  font-size: 0.875rem;
  color: var(--gray);
}

/* Mobile: stack columns */
@media (max-width: 600px) {
  .nf-columns {
    flex-direction: column;
    height: auto;
    max-height: none;
  }
  .nf-result-list {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--lightgray);
    max-height: 220px;
    overflow-y: auto;
  }
  .nf-preview-pane {
    max-height: 50vh;
    overflow-y: auto;
  }
}
      ` }} />
    </article>
  )
}

export default (() => NotFound) satisfies QuartzComponentConstructor