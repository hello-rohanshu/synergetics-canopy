import { i18n } from "../../i18n"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"

const NotFound: QuartzComponent = ({ cfg }: QuartzComponentProps) => {
  const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`)
  const baseDir = url.pathname

  return (
    <article class="popover-hint">
      <h1>404</h1>
      <p>{i18n(cfg.locale).pages.error.notFound}</p>
      <p class="not-found-hint">The page may have moved. Try searching below:</p>
      <div id="not-found-search">
        <input
          id="not-found-input"
          type="text"
          placeholder="Search Synergetics…"
          autocomplete="off"
          spellcheck={false}
        />
        <ul id="not-found-results" />
      </div>
      <a href={baseDir}>{i18n(cfg.locale).pages.error.home}</a>
      <script
        dangerouslySetInnerHTML={{
          __html: `
(function () {
  // ── 1. Extract a search query from the current URL path ──────────────────
  function slugToQuery(pathname) {
    // Strip leading slash and trailing slash
    var clean = pathname.replace(/^\\//, "").replace(/\\/$/, "")
    // Drop anchor (shouldn't be in pathname but just in case)
    clean = clean.split("#")[0]
    // Take the last path segment (most specific)
    var segments = clean.split("/")
    var last = segments[segments.length - 1] || segments[segments.length - 2] || ""
    // Collapse runs of hyphens (handles "Definition---Tensegrity") into spaces
    last = last.replace(/-+/g, " ")
    // URL-decode percent-encoded characters
    try { last = decodeURIComponent(last) } catch (e) {}
    return last.trim()
  }

  // ── 2. Minimal Flexsearch-free search against contentIndex.json ──────────
  // Quartz's contentIndex.json shape:
  //   { "slug": { title, content, tags, date, description }, … }
  // We do a simple scored keyword match — no extra deps needed on the 404 page.
  function scoreEntry(query, slug, entry) {
    var terms = query.toLowerCase().split(/\\s+/).filter(Boolean)
    var titleLower = (entry.title || "").toLowerCase()
    var contentLower = (entry.content || "").toLowerCase()
    var slugLower = slug.toLowerCase()
    var score = 0
    for (var i = 0; i < terms.length; i++) {
      var t = terms[i]
      if (titleLower.includes(t))   score += 10
      if (slugLower.includes(t))    score += 8
      if (contentLower.includes(t)) score += 2
    }
    return score
  }

  function search(index, query) {
    if (!query) return []
    var results = []
    var slugs = Object.keys(index)
    for (var i = 0; i < slugs.length; i++) {
      var slug = slugs[i]
      var entry = index[slug]
      var score = scoreEntry(query, slug, entry)
      if (score > 0) results.push({ slug: slug, entry: entry, score: score })
    }
    results.sort(function (a, b) { return b.score - a.score })
    return results.slice(0, 8)
  }

  // ── 3. Render results into the list ──────────────────────────────────────
  function render(results, baseDir) {
    var list = document.getElementById("not-found-results")
    if (!list) return
    list.innerHTML = ""
    if (results.length === 0) {
      list.innerHTML = "<li class=\\"nf-empty\\">No results found.</li>"
      return
    }
    for (var i = 0; i < results.length; i++) {
      var r = results[i]
      var href = (baseDir || "/").replace(/\\/$/, "") + "/" + r.slug
      var li = document.createElement("li")
      li.className = "nf-result"
      var desc = r.entry.description || (r.entry.content || "").slice(0, 100)
      li.innerHTML =
        '<a href="' + href + '">' +
          '<span class="nf-title">' + (r.entry.title || r.slug) + '</span>' +
          (desc ? '<span class="nf-desc">' + desc + '</span>' : "") +
        '</a>'
      list.appendChild(li)
    }
  }

  // ── 4. Boot ──────────────────────────────────────────────────────────────
  var contentIndex = null
  var baseDir = ${JSON.stringify(baseDir)}

  // Debounce helper
  function debounce(fn, ms) {
    var t
    return function () {
      clearTimeout(t)
      var args = arguments
      t = setTimeout(function () { fn.apply(null, args) }, ms)
    }
  }

  function runSearch(query) {
    if (!contentIndex) return
    render(search(contentIndex, query), baseDir)
  }

  // Fetch the content index once
  fetch(baseDir.replace(/\\/$/, "") + "/static/contentIndex.json")
    .then(function (r) { return r.json() })
    .then(function (data) {
      contentIndex = data
      // Run initial search with the URL-derived query
      var input = document.getElementById("not-found-input")
      if (input && input.value) runSearch(input.value)
    })
    .catch(function (e) { console.warn("Canopy 404: could not load contentIndex", e) })

  // Wire up the input
  document.addEventListener("DOMContentLoaded", function () {
    var input = document.getElementById("not-found-input")
    if (!input) return

    // Pre-fill from URL
    var query = slugToQuery(window.location.pathname)
    input.value = query

    // If index already loaded (cached), search immediately
    if (contentIndex && query) runSearch(query)

    input.addEventListener("input", debounce(function () {
      runSearch(input.value)
    }, 120))
  })
})()
          `,
        }}
      />
      <style dangerouslySetInnerHTML={{
        __html: `
#not-found-search {
  margin: 1.5rem 0 1.25rem;
  max-width: 560px;
}
#not-found-input {
  width: 100%;
  padding: 0.55rem 0.85rem;
  font-size: 1rem;
  font-family: inherit;
  border: 1px solid var(--lightgray);
  border-radius: 4px;
  background: var(--light);
  color: var(--dark);
  outline: none;
  box-sizing: border-box;
}
#not-found-input:focus {
  border-color: var(--secondary);
}
#not-found-results {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0;
}
#not-found-results .nf-result {
  border-bottom: 1px solid var(--lightgray);
}
#not-found-results .nf-result:last-child {
  border-bottom: none;
}
#not-found-results .nf-result a {
  display: block;
  padding: 0.55rem 0.25rem;
  text-decoration: none;
  color: inherit;
}
#not-found-results .nf-result a:hover {
  background: var(--highlight);
  border-radius: 3px;
}
#not-found-results .nf-title {
  display: block;
  font-weight: 600;
  color: var(--secondary);
}
#not-found-results .nf-desc {
  display: block;
  font-size: 0.85rem;
  color: var(--gray);
  margin-top: 0.15rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
#not-found-results .nf-empty {
  padding: 0.5rem 0.25rem;
  color: var(--gray);
  font-size: 0.9rem;
}
.not-found-hint {
  color: var(--gray);
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
}
        `
      }} />
    </article>
  )
}

export default (() => NotFound) satisfies QuartzComponentConstructor