/**
 * paraCopy.inline.ts
 * Adds a "copy section" button next to the anchor icon on headings.
 * Copies section body and an attribution line linking back to the section.
 * Writes BOTH text/plain and text/html.
 * Plain text: no URLs anywhere (links become plain text, images become alt text).
 * HTML: full formatting and absolute links preserved; heading text links to the section URL
 *       (the § symbol stays outside the link).
 * Styled and timed for UX parity with anchor.inline.ts.
 */

const COPY_ICON_INNER = `<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>`
const CHECK_ICON_INNER = `<polyline points="20 6 9 17 4 12"></polyline>`

function headingLevel(el: Element): number {
  const match = el.tagName.match(/^H([1-6])$/i)
  return match ? parseInt(match[1], 10) : 7
}

function absolutize(href: string): string {
  if (!href) return href
  if (href.startsWith("#")) return href
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return href
  try {
    return new URL(href, window.location.href).href
  } catch {
    return href
  }
}

function collectSectionNodes(heading: HTMLElement): Element[] {
  const nodes: Element[] = []
  const level = headingLevel(heading)
  let node: Element | null = heading.nextElementSibling
  while (node) {
    const tag = node.tagName
    if (/^H[1-6]$/i.test(tag) && headingLevel(node) <= level) break
    nodes.push(node)
    node = node.nextElementSibling
  }
  return nodes
}

// Cleans element clone by stripping anchor links and copy button artifacts
function cleanClone(el: Element): Element {
  const clone = el.cloneNode(true) as Element
  clone.querySelectorAll('a[role="anchor"], button.para-copy-button').forEach((node) => node.remove())
  return clone
}

// Recursively converts a DOM node to markdown, preserving common formatting.
// URLs are stripped: links keep only their text, images keep only their alt text.
function nodeToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent || ""
  if (node.nodeType !== Node.ELEMENT_NODE) return ""
  const el = node as Element
  const tag = el.tagName.toLowerCase()
  const inner = Array.from(el.childNodes).map(nodeToMarkdown).join("")
  switch (tag) {
    case "strong": case "b": return `**${inner}**`
    case "em": case "i": return `*${inner}*`
    case "code": return `\`${inner}\``
    case "pre": return `\n\`\`\`\n${inner}\n\`\`\`\n`
    case "a": {
      // Strip the href entirely — keep only the visible text.
      return inner
    }
    case "img": {
      // Strip the src entirely — keep only the alt text.
      const alt = el.getAttribute("alt") || ""
      return alt
    }
    case "br": return "\n"
    case "p": return `${inner}\n\n`
    case "h1": return `# ${inner}\n\n`
    case "h2": return `## ${inner}\n\n`
    case "h3": return `### ${inner}\n\n`
    case "h4": return `#### ${inner}\n\n`
    case "h5": return `##### ${inner}\n\n`
    case "h6": return `###### ${inner}\n\n`
    case "li": return `- ${inner}\n`
    case "ul": case "ol": return `${inner}\n`
    case "blockquote": return inner.split("\n").map(l => `> ${l}`).join("\n") + "\n\n"
    default: return inner
  }
}

function elementToMarkdown(el: Element): string {
  return nodeToMarkdown(cleanClone(el)).trim()
}

function elementToHtml(el: Element): string {
  const clone = cleanClone(el)
  clone.querySelectorAll("a[href]").forEach((a) => {
    a.setAttribute("href", absolutize(a.getAttribute("href") || ""))
  })
  clone.querySelectorAll("img").forEach((img) => {
    img.setAttribute("src", absolutize(img.getAttribute("src") || ""))
  })
  return clone.outerHTML
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function getHeadingText(heading: HTMLElement): string {
  const clone = cleanClone(heading)
  return (clone.textContent || "").trim()
}

async function writeToClipboard(plainPayload: string, htmlPayload: string): Promise<boolean> {
  if (navigator.clipboard && typeof navigator.clipboard.write === "function") {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/plain": new Blob([plainPayload], { type: "text/plain" }),
          "text/html": new Blob([htmlPayload], { type: "text/html" }),
        }),
      ])
      return true
    } catch {
      // Fallback to writeText below
    }
  }

  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(plainPayload)
      return true
    } catch {
      return false
    }
  }

  return false
}

export function attachParaCopyButtons(container: HTMLElement | Document, pageSlug?: string) {
  const headings = container.querySelectorAll<HTMLHeadingElement>("h5, h6")

  headings.forEach((heading) => {
    const anchor = heading.querySelector<HTMLAnchorElement>('a[role="anchor"]')
    if (!anchor) return
    if (heading.querySelector("button.para-copy-button")) return

    const button = document.createElement("button")
    button.className = "para-copy-button"
    button.type = "button"
    button.setAttribute("aria-label", "Copy text")

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg")
    svg.setAttribute("width", "18")
    svg.setAttribute("height", "18")
    svg.setAttribute("viewBox", "0 0 24 24")
    svg.setAttribute("fill", "none")
    svg.setAttribute("stroke", "currentColor")
    svg.setAttribute("stroke-width", "2")
    svg.setAttribute("stroke-linecap", "round")
    svg.setAttribute("stroke-linejoin", "round")
    svg.innerHTML = COPY_ICON_INNER

    button.appendChild(svg)

    const originalStroke = svg.getAttribute("stroke") || "currentColor"
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let fadeTimeoutId: ReturnType<typeof setTimeout> | null = null

    const clearTimers = () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (fadeTimeoutId) clearTimeout(fadeTimeoutId)
      timeoutId = null
      fadeTimeoutId = null
    }

    const resetStyles = () => {
      svg.innerHTML = COPY_ICON_INNER
      button.style.removeProperty("opacity")
      button.style.removeProperty("visibility")
      button.style.removeProperty("pointer-events")
      button.style.removeProperty("transition")
      svg.style.removeProperty("stroke")
      svg.setAttribute("stroke", originalStroke)
    }

    const onClick = async (e: Event) => {
      e.preventDefault()
      e.stopPropagation()

      const id = heading.id
      const path = pageSlug ? "/" + pageSlug : window.location.pathname
      const url = window.location.origin + path + (id ? "#" + id : "")
      const headingText = getHeadingText(heading)
      const nodes = collectSectionNodes(heading)

      // Heading line — § prefix, all bold.
      // Plain text: no URL. HTML: heading text wraps in a link to the section URL,
      // the § symbol stays outside the link.
      const headingLine = `**§ ${headingText}**`
      const headingLineHtml = `<p><strong>§ <a href="${escapeHtml(url)}">${escapeHtml(headingText)}</a></strong></p>`

      const bodyPlain = nodes
        .map((n) => elementToMarkdown(n))
        .filter(Boolean)
        .join("\n\n")

      const bodyHtml = nodes.map((n) => elementToHtml(n)).join("")

      // Attribution — all bold, no link
      const attribution = `**— RBF • Synergetics**`
      const attributionHtml = `<p><strong>— RBF • Synergetics</strong></p>`

      // Plain text: no URLs. HTML: heading link carries the section URL.
      const plainPayload = [headingLine, bodyPlain, attribution].filter(Boolean).join("\n\n\n")
      const htmlPayload = headingLineHtml + "<p>&nbsp;</p>" + bodyHtml + "<p>&nbsp;</p>" + attributionHtml

      const success = await writeToClipboard(plainPayload, htmlPayload)
      if (!success) return

      clearTimers()

      // Lock interaction & apply active checkmark styles matching anchor button
      svg.innerHTML = CHECK_ICON_INNER
      button.style.setProperty("opacity", "1", "important")
      button.style.setProperty("visibility", "visible", "important")
      button.style.setProperty("pointer-events", "none", "important")
      svg.style.setProperty("stroke", "var(--secondary)", "important")

      // Match anchor.inline.ts timeout curve
      timeoutId = setTimeout(() => {
        button.style.setProperty("opacity", "0", "important")
        button.style.setProperty("transition", "opacity 0.3s ease", "important")

        fadeTimeoutId = setTimeout(() => {
          resetStyles()
          clearTimers()
        }, 382)
      }, 618)
    }

    button.addEventListener("click", onClick)
    anchor.insertAdjacentElement("afterend", button)

    // @ts-ignore
    if (typeof window.addCleanup === "function") {
      // @ts-ignore
      window.addCleanup(() => {
        clearTimers()
        button.removeEventListener("click", onClick)
      })
    }
  })
}

document.addEventListener("nav", () => attachParaCopyButtons(document))

if (document.readyState !== "loading") {
  attachParaCopyButtons(document)
} else {
  document.addEventListener("DOMContentLoaded", () => attachParaCopyButtons(document))
}