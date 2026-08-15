import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"

const NotFound: QuartzComponent = ({ cfg }: QuartzComponentProps) => {
  const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`)
  const baseDir = url.pathname

  return (
    <article class="popover-hint nf-article">

      {/* Top Bar: Minimal Home Button */}
      <div class="nf-header">
        <a class="nf-home-btn" href={baseDir}>
          <svg class="nf-home-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M10 13L5 8L10 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Return Home
        </a>
      </div>

      {/* Hero 404 & Copy Block */}
      <div class="nf-hero">
        <h1 class="nf-badge">404</h1>
        <p class="nf-message">
          The page you were after may have run away.<br />
          See if you can find it below.
        </p>
        <code id="nf-attempted-url" class="nf-url"></code>
      </div>

      {/* Search row */}
      <div class="nf-search-row">
        <div class="nf-search-wrap">
          <svg class="nf-search-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" stroke-width="1.5" />
            <path d="M10 10L13.5 13.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
          <input
            id="not-found-input"
            type="text"
            placeholder="Search Synergetics…"
            autocomplete="off"
            spellcheck={false}
          />
        </div>
      </div>

      {/* Result list */}
      <ul id="nf-list" class="nf-result-list" />

      <script dangerouslySetInnerHTML={{
        __html: `
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

    var pageNumMatch = cleanedSlug.match(/^(\\d+(?:\\.\\d+)?)/);
    var pagePrefix   = pageNumMatch ? pageNumMatch[1] : "";

    var result = {
      slug:       lastSeg,
      hash:       hash,
      hasAnchor:  hash.length > 0,
      fuseQuery:  "",
      coordQuery: "",
      titleQuery: "",
      mode:       "page",
      pagePrefix: pagePrefix
    };

    if (!hash) {
      result.fuseQuery = cleanedSlug;
      result.mode = "page";
      return result;
    }

    var coordMatch = hash.match(/^(\\d+(?:\\.\\d+)?)/);
    var coordStr   = coordMatch ? coordMatch[1] : "";

    var afterCoord     = coordMatch ? hash.slice(coordMatch[0].length).replace(/^-+/, "").trim() : hash;
    var cleanAnchorTxt = afterCoord.replace(/-+/g, " ").trim();

    if (coordStr && coordStr.indexOf(".") === -1) {
      var intLen = pageNumMatch ? pageNumMatch[1].split(".")[0].length : 3;
      coordStr   = coordStr.slice(0, intLen) + "." + coordStr.slice(intLen);
    }

    result.mode       = "content";
    result.coordQuery = coordStr;
    result.titleQuery = cleanAnchorTxt;

    var slugText = cleanedSlug.replace(/^\\d+(\\.\\d+)?\\s*/, "").trim();
    if (cleanAnchorTxt.length > 0) {
      result.fuseQuery = coordStr + " " + cleanAnchorTxt;
    } else if (slugText.length > 0) {
      result.fuseQuery = coordStr + " " + slugText;
    } else {
      result.fuseQuery = coordStr;
    }

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
        title:       meta.title        || "",
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
      threshold:         0.5,
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
      ignoreFieldNorm:   true,
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
  function findParentDoc(prefix) {
    if (!prefix || !allDocs.length) return null;

    var candidates = [];
    var variants = [prefix];
    var dotIdx = prefix.indexOf(".");
    if (dotIdx > -1) variants.push(prefix.slice(0, dotIdx));

    allDocs.forEach(function(doc) {
      var parts   = doc.slug.split("/");
      var lastSeg = parts[parts.length - 1] || "";

      for (var i = 0; i < variants.length; i++) {
        var v  = variants[i];
        var ch = lastSeg[v.length] || "";
        if (
          lastSeg.indexOf(v) === 0 &&
          (ch === "" || ch === "." || ch === "-")
        ) {
          candidates.push({ doc: doc, specificity: v.length });
          break;
        }
      }
    });

    if (!candidates.length) return null;
    candidates.sort(function(a, b) {
      if (b.specificity !== a.specificity) return b.specificity - a.specificity;
      var aLast = a.doc.slug.split("/").pop();
      var bLast = b.doc.slug.split("/").pop();
      return aLast.length - bLast.length;
    });
    return candidates[0].doc;
  }

  // ── Render ───────────────────────────────────────────────────────────────
  function renderList(results, anchorHint) {
    var list = document.getElementById("nf-list");
    if (!list) return;
    list.innerHTML = "";

    if (!results.length) {
      list.innerHTML = '<li class="nf-empty">No results — try a different search</li>';
      return;
    }

    for (var i = 0; i < results.length; i++) {
      (function(r, idx) {
        var li = document.createElement("li");
        li.className = "nf-item";

        var href = BASE + "/" + r.slug;
        if (idx === 0 && anchorHint) {
          href += "#" + anchorHint;
        }

        var subline = "";
        if (idx === 0 && anchorHint) {
          subline = '<span class="nf-item-anchor"><svg class="nf-anchor-icon" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M2 1 L2 7 L9 7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 5 L9 7 L7 9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg> section ' + state.coordQuery + '</span>';
        }

        li.innerHTML =
          '<a class="nf-item-link" href="' + href + '">' +
            '<span class="nf-item-title">' + (r.title || r.slug) + '</span>' +
            subline +
          '</a>';

        list.appendChild(li);
      })(results[i], i);
    }
  }

  // ── Search orchestration ─────────────────────────────────────────────────
  var state = {
    fuseQuery:  "",
    coordQuery: "",
    pagePrefix: "",
    mode:       "page",
    fromURL:    true
  };

  function coordIntPrefix(str) {
    var m = str.match(/^(\\d+)/);
    return m ? m[1] : "";
  }

  function go() {
    var results = [];

    if (state.mode === "content") {
      results = searchWithFuse(contentFuse, state.fuseQuery, 10);

      if (state.fromURL && state.pagePrefix) {
        var pinned = findParentDoc(state.pagePrefix);
        if (pinned) {
          var seen = {};
          seen[pinned.slug] = true;
          var merged = [pinned];
          results.forEach(function(r) {
            if (!seen[r.slug]) {
              merged.push(r);
              seen[r.slug] = true;
            }
          });
          results = merged;
        }
      }

    } else {
      results = searchWithFuse(pageFuse, state.fuseQuery, 10);
    }

    var anchorHint = null;
    if (state.fromURL && state.coordQuery && results.length > 0) {
      var topSlug      = results[0].slug.split("/").pop() || "";
      var topInt       = coordIntPrefix(topSlug);
      var coordInt     = coordIntPrefix(state.coordQuery);
      if (topInt && coordInt && topInt === coordInt) {
        anchorHint = state.coordQuery;
      }
    }

    renderList(results, anchorHint);
  }

  function debounce(fn, ms) {
    var t;
    return function() {
      clearTimeout(t);
      var a = arguments;
      t = setTimeout(function() { fn.apply(null, a); }, ms);
    };
  }

  // ── Init: parse URL and wire up input ────────────────────────────────────
  function init() {
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
      input.value = parsed.coordQuery
        ? (parsed.coordQuery + (parsed.titleQuery ? " " + parsed.titleQuery : ""))
        : parsed.fuseQuery;
    }

    if (pageFuse || contentFuse) go();
  }

  // ── Boot ─────────────────────────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", function() {
    var input = document.getElementById("not-found-input");
    if (input && !input.dataset.wired) {
      input.dataset.wired = "1";
      input.addEventListener("input", debounce(function() {
        var val = input.value.trim();

        state.fromURL    = false;
        state.pagePrefix = "";

        if (/^\\d+(\\.\\d+)?$/.test(val)) {
          state.mode      = "content";
          state.fuseQuery = val;
        } else if (val.length > 0) {
          state.mode      = "page";
          state.fuseQuery = val;
        } else {
          state.fuseQuery = "";
        }

        if (pageFuse || contentFuse) go();
      }, 150));
    }

    init();
  });

  window.addEventListener("popstate", function() {
    init();
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

      <style dangerouslySetInnerHTML={{
        __html: `
/* ── Article Shell ───────────────────────────────────────────── */
.nf-article {
  max-width: 100%;
}

/* ── Top Header Navigation Bar ───────────────────────────────── */
.nf-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1.5rem;
}

.nf-home-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  font-weight: 500;
  text-decoration: none;
  color: var(--darkgray);
  border: 1px solid var(--lightgray);
  border-radius: 5px;
  padding: 0.3rem 0.65rem;
  transition: all 0.15s ease;
  background: transparent;
}

.nf-home-btn:hover {
  color: var(--secondary);
  border-color: color-mix(in srgb, var(--secondary) 40%, transparent);
  background: var(--highlight);
}

.nf-home-icon {
  width: 12px;
  height: 12px;
}

/* ── Hero Section ────────────────────────────────────────────── */
.nf-hero {
  text-align: center;
  margin-bottom: 2rem;
}

.nf-badge {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.03em;
  color: var(--secondary);
  font-family: var(--headerFont, inherit);
  margin: 0 0 0.75rem 0;
}

.nf-message {
  font-size: 1rem;
  color: var(--darkgray);
  margin: 0 0 1.25rem 0;
  line-height: 1.5;
}

/* ── Attempted URL Block ──────────────────────────────────────── */
.nf-url {
  display: inline-block;
  max-width: 100%;
  font-size: 0.75rem;
  color: var(--gray);
  background: var(--lightgray);
  border-radius: 4px;
  padding: 0.3rem 0.6rem;
  word-break: break-all;
  font-family: var(--codeFont, monospace);
}

/* ── Search Input ────────────────────────────────────────────── */
.nf-search-row {
  margin-bottom: 1.25rem;
}

.nf-search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.nf-search-icon {
  position: absolute;
  left: 0.8rem;
  width: 15px;
  height: 15px;
  color: var(--gray);
  pointer-events: none;
  flex-shrink: 0;
}

#not-found-input {
  width: 100%;
  padding: 0.6rem 0.8rem 0.6rem 2.4rem;
  font-size: 0.9rem;
  font-family: inherit;
  border: 1px solid var(--lightgray);
  border-radius: 5px;
  background: var(--light);
  color: var(--dark);
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;
}
#not-found-input:focus {
  border-color: var(--secondary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--secondary) 15%, transparent);
}
#not-found-input::placeholder {
  color: var(--gray);
}

/* ── Result Cards ────────────────────────────────────────────── */
.nf-result-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.nf-item {
  border: 1px solid var(--lightgray);
  border-radius: 5px;
  transition: border-color 0.15s, background 0.15s;
}
.nf-item:hover {
  border-color: color-mix(in srgb, var(--secondary) 50%, transparent);
  background: var(--highlight);
}

.nf-item-link {
  display: block;
  padding: 0.65rem 0.9rem;
  text-decoration: none;
  color: inherit;
}

.nf-item-title {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--secondary);
  line-height: 1.3;
}

.nf-item-anchor {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  color: var(--gray);
  line-height: 1.4;
  margin-top: 0.22rem;
  font-family: var(--codeFont, monospace);
  letter-spacing: 0.01em;
  opacity: 0.9;
}

.nf-anchor-icon {
  width: 10px;
  height: 10px;
  flex-shrink: 0;
}

.nf-empty {
  font-size: 0.85rem;
  color: var(--gray);
  padding: 0.4rem 0;
  text-align: center;
}

/* ── Mobile ──────────────────────────────────────────────────── */
@media (max-width: 600px) {
  .nf-badge {
    font-size: 2.75rem;
  }
  .nf-message {
    font-size: 0.925rem;
  }
}
      ` }} />
    </article>
  )
}

export default (() => NotFound) satisfies QuartzComponentConstructor