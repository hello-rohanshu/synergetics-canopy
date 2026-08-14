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

  // ── URL parsing (spec v1.1) ──────────────────────────────────────────────
  function parseURL(href) {
    var hashIndex = href.indexOf("#");
    var hash      = hashIndex > -1 ? href.slice(hashIndex + 1) : "";
    var pathname  = hashIndex > -1 ? href.slice(0, hashIndex) : href;

    var path = pathname.replace(/^https?:\\/\\/[^\\/]+/, "").replace(/\\/$/, "");
    var segments = path.split("/").filter(Boolean);
    var lastSeg  = segments[segments.length - 1] || "";

    try { lastSeg = decodeURIComponent(lastSeg); } catch(e) {}

    var cleanedSlug = lastSeg.replace(/-+/g, " ").trim();

    // Extract leading numeric prefix from slug for parent-page lookup.
    // We store it as the raw match (e.g. "810.00" or "810") so we can
    // do exact-boundary matching later.
    var pageNumMatch = cleanedSlug.match(/^(\\d+(?:\\.\\d+)?)/);
    var pagePrefix   = pageNumMatch ? pageNumMatch[1] : "";

    var result = {
      slug:       lastSeg,
      hash:       hash,
      hasAnchor:  hash.length > 0,
      fuseQuery:  "",   // what goes into Fuse
      coordQuery: "",   // coordinate portion only (may be empty)
      titleQuery: "",   // anchor-title portion only (may be empty)
      mode:       "page",   // "page" | "content"
      pagePrefix: pagePrefix
    };

    if (!hash) {
      // Case 1: no anchor — user wanted a page
      result.fuseQuery = cleanedSlug;
      result.mode = "page";
      return result;
    }

    // ── Anchor parsing ──────────────────────────────────────────────────────
    var coordMatch = hash.match(/^(\\d+(?:\\.\\d+)?)/);
    var coordStr   = coordMatch ? coordMatch[1] : "";

    // Text after the coordinate (strip leading hyphens)
    var afterCoord     = coordMatch ? hash.slice(coordMatch[0].length).replace(/^-+/, "").trim() : hash;
    var cleanAnchorTxt = afterCoord.replace(/-+/g, " ").trim();

    // Insert decimal into raw coordinate if missing, using slug's integer width
    if (coordStr && coordStr.indexOf(".") === -1) {
      var intLen = pageNumMatch ? pageNumMatch[1].split(".")[0].length : 3;
      coordStr   = coordStr.slice(0, intLen) + "." + coordStr.slice(intLen);
    }

    result.mode       = "content";
    result.coordQuery = coordStr;
    result.titleQuery = cleanAnchorTxt;

    // fuseQuery: for content Fuse we use only the anchor title (the coordinate
    // is handled by deterministic parent lookup — see go()).  If there is no
    // anchor title, fall back to the coordinate so Fuse has something.
    result.fuseQuery = cleanAnchorTxt.length > 0 ? cleanAnchorTxt : coordStr;

    return result;
  }

  // ── Fuse.js instances ────────────────────────────────────────────────────
  var pageFuse    = null;
  var contentFuse = null;
  var allDocs     = [];

  function createDocObjects(data) {
    return Object.entries(data).map(function(entry) {
      var slug = entry[0];
      var meta = entry[1] || {};
      return {
        slug:        slug,
        title:       meta.title       || "",
        tags:        (meta.tags || []).join(" "),
        description: meta.description || "",
        content:     meta.content     || ""
      };
    });
  }

  function buildPageFuse(docs) {
    return new window.Fuse(docs, {
      keys: [
        { name: "title", weight: 0.6 },
        { name: "slug",  weight: 0.3 },
        { name: "tags",  weight: 0.1 }
      ],
      threshold:         0.45,
      distance:          200,
      includeScore:      true,
      ignoreFieldNorm:   false,
      minMatchCharLength: 2
    });
  }

  function buildContentFuse(docs) {
    return new window.Fuse(docs, {
      keys: [
        { name: "content", weight: 0.7 },
        { name: "title",   weight: 0.3 }
      ],
      threshold:         0.5,
      distance:          200,
      includeScore:      true,
      ignoreFieldNorm:   true,   // don't penalise long parent pages
      minMatchCharLength: 2
    });
  }

  function searchWithFuse(fuse, query, limit) {
    if (!fuse || !query) return [];
    var raw = fuse.search(query, { limit: limit || 10 });
    return raw.map(function(r) {
      return {
        slug:        r.item.slug,
        title:       r.item.title,
        description: r.item.description,
        content:     r.item.content,
        score:       r.score
      };
    });
  }

  // ── Parent-page direct lookup ────────────────────────────────────────────
  // Given a pagePrefix like "810.00" or "810", find the one doc whose slug
  // most precisely starts with that prefix at a word boundary (followed by
  // ".", "-", or end-of-string).  Returns the doc object or null.
  function findParentDoc(prefix) {
    if (!prefix || !allDocs.length) return null;

    // Build a pattern that matches the prefix at a boundary so "810" doesn't
    // accidentally match "8100-..."
    // We try the full prefix first (e.g. "810.00"), then the integer part only.
    var candidates = [];
    var variants = [prefix];
    var dotIdx = prefix.indexOf(".");
    if (dotIdx > -1) variants.push(prefix.slice(0, dotIdx));  // e.g. "810"

    allDocs.forEach(function(doc) {
      for (var i = 0; i < variants.length; i++) {
        var v  = variants[i];
        var ch = doc.slug[v.length] || "";   // char right after the prefix in slug
        if (
          doc.slug.indexOf(v) === 0 &&
          (ch === "" || ch === "." || ch === "-")
        ) {
          // Prefer longer (more specific) variant match
          candidates.push({ doc: doc, specificity: v.length });
          break;
        }
      }
    });

    if (!candidates.length) return null;
    // If multiple hits (shouldn't be), pick the one whose slug is shortest
    // (most likely the section-level page rather than a sub-sub-page)
    candidates.sort(function(a, b) {
      if (b.specificity !== a.specificity) return b.specificity - a.specificity;
      return a.doc.slug.length - b.doc.slug.length;
    });
    return candidates[0].doc;
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
        var li = document.createElement("li");
        li.className  = "nf-item" + (r.slug === activeSlug ? " nf-active" : "");
        li.dataset.slug = r.slug;
        li.innerHTML =
          '<span class="nf-item-title">' + (r.title || r.slug) + '</span>';
        li.addEventListener("click", function() {
          showPreview(r);
          document.querySelectorAll(".nf-item").forEach(function(el) { el.classList.remove("nf-active"); });
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

    var href    = BASE + "/" + r.slug;
    var fetchId = ++fetchCounter;

    pane.innerHTML = '<p class="nf-preview-hint">Loading…</p>';

    fetch(href)
      .then(function(res) {
        if (!res.ok) throw new Error("not found");
        return res.text();
      })
      .then(function(html) {
        if (fetchId !== fetchCounter) return;
        var doc     = new DOMParser().parseFromString(html, "text/html");
        var article = doc.querySelector("article") || doc.querySelector("main") || doc.body;
        var temp    = document.createElement("div");
        temp.innerHTML = article ? article.innerHTML : "";
        temp.querySelectorAll("script, style, link[rel=stylesheet]").forEach(function(el) { el.remove(); });
        temp.querySelectorAll("a").forEach(function(a) { a.style.pointerEvents = "none"; });
        pane.innerHTML =
          '<a class="nf-preview-title" href="' + href + '">' + (r.title || r.slug) + '</a>' +
          '<div class="nf-preview-body">' + temp.innerHTML + '</div>' +
          '<a class="nf-preview-link" href="' + href + '">Go to page →</a>';
      })
      .catch(function() {
        if (fetchId !== fetchCounter) return;
        var desc = r.description || (r.content || "").slice(0, 300);
        pane.innerHTML =
          '<a class="nf-preview-title" href="' + href + '">' + (r.title || r.slug) + '</a>' +
          (desc ? '<p class="nf-preview-desc">' + desc + '</p>' : "") +
          '<a class="nf-preview-link" href="' + href + '">Go to page →</a>';
      });
  }

  // ── Search orchestration ─────────────────────────────────────────────────
  var state = {
    fuseQuery:  "",
    coordQuery: "",
    pagePrefix: "",
    mode:       "page",
    fromURL:    true   // true = came from URL parse; false = user typed
  };

  function go() {
    var results = [];

    if (state.mode === "content") {
      // Step 1: pin parent page deterministically (only when query came from URL)
      var pinned = state.fromURL ? findParentDoc(state.pagePrefix) : null;

      // Step 2: Fuse on anchor title (or coord as fallback) for remaining slots
      var fuseResults = searchWithFuse(contentFuse, state.fuseQuery, pinned ? 9 : 10);

      // Step 3: merge — pinned first, then Fuse results (deduped)
      var seen = {};
      if (pinned) {
        results.push(pinned);
        seen[pinned.slug] = true;
      }
      fuseResults.forEach(function(r) {
        if (!seen[r.slug]) {
          results.push(r);
          seen[r.slug] = true;
        }
      });

    } else {
      // Page mode: straight Fuse on title/slug/tags
      results = searchWithFuse(pageFuse, state.fuseQuery, 10);
    }

    renderList(results, null);
  }

  function debounce(fn, ms) {
    var t;
    return function() {
      clearTimeout(t);
      var a = arguments;
      t = setTimeout(function() { fn.apply(null, a); }, ms);
    };
  }

  // ── Boot ─────────────────────────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", function() {
    var urlEl = document.getElementById("nf-attempted-url");
    if (urlEl) urlEl.textContent = window.location.href;

    var parsed = parseURL(window.location.href);
    state.fuseQuery  = parsed.fuseQuery;
    state.coordQuery = parsed.coordQuery;
    state.pagePrefix = parsed.pagePrefix;
    state.mode       = parsed.mode;
    state.fromURL    = true;

    var input = document.getElementById("not-found-input");
    if (input) {
      // Show the full human-readable query in the input box
      input.value = parsed.coordQuery
        ? (parsed.coordQuery + (parsed.titleQuery ? " " + parsed.titleQuery : ""))
        : parsed.fuseQuery;

      input.addEventListener("input", debounce(function() {
        var val = input.value.trim();

        // User is now driving — disable URL-based parent boost
        state.fromURL    = false;
        state.pagePrefix = "";

        // Detect if user typed a bare coordinate → content mode
        if (/^\\d+(\\.\\d+)?$/.test(val)) {
          state.mode      = "content";
          state.fuseQuery = val;
        } else if (val.length > 0) {
          // Non-coordinate text: switch to page mode so title search dominates
          state.mode      = "page";
          state.fuseQuery = val;
        } else {
          state.fuseQuery = "";
        }

        if (pageFuse || contentFuse) go();
      }, 150));
    }

    // Indexes not ready yet — go() will be called from buildFuseIndex
    if (pageFuse || contentFuse) go();
  });

  function buildFuseIndex(data) {
    allDocs = createDocObjects(data);
    if (window.Fuse) {
      pageFuse    = buildPageFuse(allDocs);
      contentFuse = buildContentFuse(allDocs);
      if (state.fuseQuery) go();
    } else {
      console.warn("Fuse CDN failed to load");
    }
  }

  // ── Load Fuse + index ────────────────────────────────────────────────────
  fetch(BASE + "/static/contentIndex.json")
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (window.Fuse) {
        buildFuseIndex(data);
      } else {
        var script    = document.createElement("script");
        script.src    = "https://cdn.jsdelivr.net/npm/fuse.js@7/dist/fuse.min.js";
        script.onload = function() { buildFuseIndex(data); };
        script.onerror = function() { console.warn("Fuse CDN failed to load"); };
        document.head.appendChild(script);
      }
    })
    .catch(function(e) { console.warn("Canopy 404: contentIndex fetch failed", e); });

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
  height: 60vh;
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
.nf-item:hover, .nf-item.nf-active { background: var(--highlight); }
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

/* Right — preview pane */
.nf-preview-pane {
  flex: 1;
  padding: 1rem 1.1rem;
  overflow-y: auto;
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