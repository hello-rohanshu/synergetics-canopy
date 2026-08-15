import { i18n } from "../../i18n"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"

const NotFound: QuartzComponent = ({ cfg }: QuartzComponentProps) => {
  const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`)
  const baseDir = url.pathname

  return (
    <article class="popover-hint nf-article">
      <div class="nf-header">
        <h1 class="nf-404">404</h1>
        <a class="nf-home" href={baseDir}>{i18n(cfg.locale).pages.error.home}</a>
      </div>

      <p class="nf-label">Page not found</p>
      <code id="nf-attempted-url" class="nf-url"></code>

      <div class="nf-search-row">
        <input
          id="not-found-input"
          type="text"
          placeholder="Search Synergetics…"
          autocomplete="off"
          spellcheck={false}
        />
      </div>

      <ul id="nf-list" class="nf-result-list" />

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
  function renderList(results) {
    var list = document.getElementById("nf-list");
    if (!list) return;
    list.innerHTML = "";

    if (!results.length) {
      list.innerHTML = '<li class="nf-empty">No results — try a different search</li>';
      return;
    }

    for (var i = 0; i < results.length; i++) {
      (function(r) {
        var li = document.createElement("li");
        li.className = "nf-item";

        var desc = r.description || (r.content || "").slice(0, 120);
        if (desc.length === 120) desc += "…";

        li.innerHTML =
          '<a class="nf-item-link" href="' + BASE + "/" + r.slug + '">' +
            '<span class="nf-item-title">' + (r.title || r.slug) + '</span>' +
            (desc ? '<span class="nf-item-desc">' + desc + '</span>' : '') +
          '</a>';

        list.appendChild(li);
      })(results[i]);
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

  function go() {
    var results = [];

    if (state.mode === "content") {
      var pinned = state.fromURL ? findParentDoc(state.pagePrefix) : null;
      var fuseResults = searchWithFuse(contentFuse, state.fuseQuery, pinned ? 9 : 10);

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
      results = searchWithFuse(pageFuse, state.fuseQuery, 10);
    }

    renderList(results);
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
      input.value = parsed.coordQuery
        ? (parsed.coordQuery + (parsed.titleQuery ? " " + parsed.titleQuery : ""))
        : parsed.fuseQuery;

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
/* ── Header row: 404 + home link ─────────────────────────────── */
.nf-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.25rem;
}

.nf-404 {
  font-size: 2.75rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--dark);
  margin: 0;
  line-height: 1;
}

.nf-home {
  font-size: 0.8rem;
  color: var(--gray);
  text-decoration: none;
  white-space: nowrap;
  border-bottom: 1px solid var(--lightgray);
  padding-bottom: 1px;
  transition: color 0.15s, border-color 0.15s;
}
.nf-home:hover {
  color: var(--secondary);
  border-color: var(--secondary);
}

/* ── URL strip ───────────────────────────────────────────────── */
.nf-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: var(--gray);
  margin: 0 0 0.4rem;
}

.nf-url {
  display: block;
  font-size: 0.78rem;
  color: var(--gray);
  word-break: break-all;
  font-family: var(--codeFont, monospace);
  margin-bottom: 1.5rem;
  opacity: 0.75;
}

/* ── Search input ────────────────────────────────────────────── */
.nf-search-row {
  margin-bottom: 1.25rem;
}

#not-found-input {
  width: 100%;
  padding: 0.55rem 0.8rem;
  font-size: 0.95rem;
  font-family: inherit;
  border: 1px solid var(--lightgray);
  border-radius: 5px;
  background: var(--light);
  color: var(--dark);
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
}
#not-found-input:focus {
  border-color: var(--secondary);
}

/* ── Result cards ────────────────────────────────────────────── */
.nf-result-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nf-item {
  border: 1px solid var(--lightgray);
  border-radius: 5px;
  transition: border-color 0.15s, background 0.15s;
}
.nf-item:hover {
  border-color: var(--secondary);
  background: var(--highlight);
}

.nf-item-link {
  display: block;
  padding: 0.7rem 0.9rem;
  text-decoration: none;
  color: inherit;
}

.nf-item-title {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--dark);
  line-height: 1.3;
  margin-bottom: 0.2rem;
}
.nf-item:hover .nf-item-title {
  color: var(--secondary);
}

.nf-item-desc {
  display: block;
  font-size: 0.8rem;
  color: var(--gray);
  line-height: 1.5;
}

.nf-empty {
  font-size: 0.85rem;
  color: var(--gray);
  padding: 0.5rem 0;
}

/* ── Article container ───────────────────────────────────────── */
.nf-article {
  max-width: 100%;
}

/* ── Mobile ──────────────────────────────────────────────────── */
@media (max-width: 600px) {
  .nf-404 {
    font-size: 2rem;
  }
}
      ` }} />
    </article>
  )
}

export default (() => NotFound) satisfies QuartzComponentConstructor