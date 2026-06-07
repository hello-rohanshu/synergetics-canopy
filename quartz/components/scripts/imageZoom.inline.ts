import mediumZoom from "medium-zoom"

const SELECTOR = ".center img, .transclude img, figure img, .transclude .transclude img"

let zoomInstance: ReturnType<typeof mediumZoom> | null = null
let extraScale = 1
let panX = 0
let panY = 0
let isPanning = false
let panStartX = 0
let panStartY = 0
let hasPanned = false
let baseTransform = ""
let indicator: HTMLElement | null = null
let closeBtn: HTMLElement | null = null
let indicatorTimeout: ReturnType<typeof setTimeout> | null = null
let openedCleanups: (() => void)[] = []

let lastPinchDist = 0
let isTouchPanning = false
let touchPanStartX = 0
let touchPanStartY = 0

let keyHandler: ((e: KeyboardEvent) => void) | null = null
let closeBtnClickHandler: (() => void) | null = null

const MIN_EXTRA = 0.5
const MAX_EXTRA = 5
const SCALE_STEP_SCROLL = 0.003
const SCALE_STEP_PINCH  = 0.01
const SCALE_STEP_KEY    = 0.25

function getZoomed(): HTMLImageElement | null {
  return document.querySelector<HTMLImageElement>(".medium-zoom-image--opened")
}

function createUI() {
  indicator = document.createElement("div")
  indicator.id = "zoom-indicator"
  indicator.style.cssText = `
    position:fixed;bottom:32px;left:50%;transform:translateX(-50%);
    background:rgba(30,30,32,0.72);
    backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
    color:#fff;
    font:500 12px/1 var(--bodyFont, ui-sans-serif, system-ui, sans-serif);
    letter-spacing:0.06em;
    padding:5px 11px;border-radius:20px;
    box-shadow:0 2px 12px rgba(0,0,0,0.4);
    pointer-events:none;opacity:0;transition:opacity 0.2s ease;z-index:1100;
  `
  document.body.appendChild(indicator)

  closeBtn = document.createElement("button")
  closeBtn.id = "zoom-close"
  closeBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="1" y1="1" x2="15" y2="15" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/><line x1="15" y1="1" x2="1" y2="15" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>`
  closeBtn.style.cssText = `
    position:fixed;
    top:20px;
    right:20px;
    width:40px;height:40px;
    display:flex;align-items:center;justify-content:center;
    background:rgba(30,30,32,0.72);
    backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
    border:1px solid rgba(255,255,255,0.18);
    box-shadow:0 2px 16px rgba(0,0,0,0.5);
    border-radius:50%;
    color:#fff;cursor:pointer;opacity:0;font-size:0;line-height:0;
    transition:opacity 0.2s ease,background 0.15s ease;
    z-index:2000;pointer-events:none;
  `
  closeBtn.addEventListener("mouseenter", () => {
    if (closeBtn) closeBtn.style.background = "rgba(50,50,54,0.85)"
  })
  closeBtn.addEventListener("mouseleave", () => {
    if (closeBtn) closeBtn.style.background = "rgba(30,30,32,0.72)"
  })
  document.body.appendChild(closeBtn)
}

function destroyUI() {
  indicator?.remove()
  closeBtn?.remove()
  indicator = null
  closeBtn = null
}

function showIndicator(percent: number) {
  if (!indicator) return
  indicator.textContent = `${percent}%`
  indicator.style.opacity = "1"
  if (indicatorTimeout) clearTimeout(indicatorTimeout)
  indicatorTimeout = setTimeout(() => {
    if (indicator) indicator.style.opacity = "0"
  }, 1200)
}

function applyTransform(disableTransition = false) {
  const img = getZoomed()
  if (!img) return
  img.style.transition = disableTransition ? "none" : ""
  const hasOffset = panX !== 0 || panY !== 0 || extraScale !== 1
  if (!hasOffset) {
    img.style.transform = baseTransform
    img.style.cursor = "grab"
    return
  }
  img.style.transform = `translate(${panX}px, ${panY}px) scale(${extraScale}) ${baseTransform}`
  img.style.cursor = isPanning ? "grabbing" : "grab"
  if (extraScale !== 1) showIndicator(Math.round(extraScale * 100))
}

function resetVars() {
  extraScale = 1; panX = 0; panY = 0
  isPanning = false; hasPanned = false; baseTransform = ""
  isTouchPanning = false; lastPinchDist = 0
}

function pinchDistance(touches: TouchList): number {
  const dx = touches[0].clientX - touches[1].clientX
  const dy = touches[0].clientY - touches[1].clientY
  return Math.sqrt(dx * dx + dy * dy)
}

function setupImageZoom() {
  const targets = document.querySelectorAll<HTMLImageElement>(SELECTOR)
  if (targets.length === 0) return

  createUI()

  zoomInstance = mediumZoom(targets, {
    margin: 24,
    background: "rgba(22, 22, 24, 0.93)",
    scrollOffset: 999999,
  })

  targets.forEach((img) => {
    img.addEventListener("mouseenter", () => {
      if (img.loading === "lazy") img.loading = "eager"
    }, { once: true })
  })

  keyHandler = (e: KeyboardEvent) => {
    if (!zoomInstance?.getZoomedImage()) return
    if (e.key === "ArrowUp" || e.key === "=") {
      e.preventDefault()
      extraScale = Math.min(MAX_EXTRA, extraScale + SCALE_STEP_KEY)
      applyTransform()
    } else if (e.key === "ArrowDown" || e.key === "-") {
      e.preventDefault()
      extraScale = Math.max(MIN_EXTRA, extraScale - SCALE_STEP_KEY)
      applyTransform()
    }
  }
  window.addEventListener("keydown", keyHandler)

  closeBtnClickHandler = () => zoomInstance?.close()
  closeBtn?.addEventListener("click", closeBtnClickHandler)

  zoomInstance.on("opened", () => {
    const img = getZoomed()
    if (!img) return

    baseTransform = img.style.transform
    img.style.willChange = "transform"
    img.style.cursor = "grab"
    extraScale = 1; panX = 0; panY = 0; hasPanned = false

    if (closeBtn) {
      closeBtn.style.opacity = "1"
      closeBtn.style.pointerEvents = "auto"
    }

    const overlay = document.querySelector<HTMLElement>(".medium-zoom-overlay")
    const overlayTapHandler = (e: TouchEvent) => {
      if (!hasPanned) {
        extraScale = 1; panX = 0; panY = 0
        applyTransform()
        zoomInstance?.close()
      }
    }
    overlay?.addEventListener("touchend", overlayTapHandler)
    openedCleanups.push(() => overlay?.removeEventListener("touchend", overlayTapHandler))

    const wheelHandler = (e: WheelEvent) => {
      if (!zoomInstance?.getZoomedImage()) return
      e.preventDefault()
      e.stopImmediatePropagation()
      const step = e.ctrlKey ? SCALE_STEP_PINCH : SCALE_STEP_SCROLL
      extraScale = Math.min(MAX_EXTRA, Math.max(MIN_EXTRA, extraScale - e.deltaY * step))
      if (extraScale < MIN_EXTRA) extraScale = MIN_EXTRA
      applyTransform()
    }

    const mousedownHandler = (e: MouseEvent) => {
      if ((e.target as HTMLElement).id === "zoom-close") return
      const img = getZoomed()
      if (!img) return
      if (e.target !== img) return
      isPanning = true
      hasPanned = false
      panStartX = e.clientX - panX
      panStartY = e.clientY - panY
      img.style.cursor = "grabbing"
      img.style.transition = "none"
      e.preventDefault()
    }

    const mousemoveHandler = (e: MouseEvent) => {
      if (!isPanning) return
      hasPanned = true
      panX = e.clientX - panStartX
      panY = e.clientY - panStartY
      applyTransform(true)
    }

    const mouseupHandler = () => {
      if (!isPanning) return
      isPanning = false
      const img = getZoomed()
      if (img) {
        img.style.cursor = "grab"
        img.style.transition = ""
      }
    }

    const clickHandler = (e: MouseEvent) => {
      const img = getZoomed()
      if (!img || e.target !== img) return

      if (hasPanned) {
        e.stopImmediatePropagation()
        hasPanned = false
        return
      }
      if (extraScale !== 1) {
        e.stopImmediatePropagation()
        extraScale = 1; panX = 0; panY = 0
        if (img) img.style.cursor = "grab"
        applyTransform()
        return
      }
    }

    const touchstartHandler = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        lastPinchDist = pinchDistance(e.touches)
        isTouchPanning = false
        e.preventDefault()
      } else if (e.touches.length === 1) {
        isTouchPanning = true
        hasPanned = false
        touchPanStartX = e.touches[0].clientX - panX
        touchPanStartY = e.touches[0].clientY - panY
      }
    }

    const touchmoveHandler = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault()
        const dist = pinchDistance(e.touches)
        const delta = dist - lastPinchDist
        lastPinchDist = dist
        extraScale = Math.min(MAX_EXTRA, Math.max(MIN_EXTRA, extraScale + delta * SCALE_STEP_PINCH))
        if (extraScale < MIN_EXTRA) extraScale = MIN_EXTRA
        applyTransform(true)
      } else if (e.touches.length === 1 && isTouchPanning) {
        e.preventDefault()
        hasPanned = true
        panX = e.touches[0].clientX - touchPanStartX
        panY = e.touches[0].clientY - touchPanStartY
        applyTransform(true)
      }
    }

    const touchendHandler = (e: TouchEvent) => {
      if (e.touches.length < 2) lastPinchDist = 0
      if (e.touches.length === 0) isTouchPanning = false
    }

    window.addEventListener("wheel", wheelHandler, { passive: false, capture: true })
    document.addEventListener("mousedown", mousedownHandler)
    document.addEventListener("mousemove", mousemoveHandler)
    document.addEventListener("mouseup", mouseupHandler)
    document.addEventListener("click", clickHandler, { capture: true })
    document.addEventListener("touchstart", touchstartHandler, { passive: false })
    document.addEventListener("touchmove", touchmoveHandler, { passive: false })
    document.addEventListener("touchend", touchendHandler)

    openedCleanups.push(
      () => window.removeEventListener("wheel", wheelHandler, { capture: true } as EventListenerOptions),
      () => document.removeEventListener("mousedown", mousedownHandler),
      () => document.removeEventListener("mousemove", mousemoveHandler),
      () => document.removeEventListener("mouseup", mouseupHandler),
      () => document.removeEventListener("click", clickHandler, { capture: true } as EventListenerOptions),
      () => document.removeEventListener("touchstart", touchstartHandler),
      () => document.removeEventListener("touchmove", touchmoveHandler),
      () => document.removeEventListener("touchend", touchendHandler),
    )
  })

  zoomInstance.on("close", () => {
    openedCleanups.forEach(fn => fn())
    openedCleanups = []
    resetVars()
    const img = document.querySelector<HTMLImageElement>(".medium-zoom-image")
    if (img) img.style.willChange = ""
    if (closeBtn) { closeBtn.style.opacity = "0"; closeBtn.style.pointerEvents = "none" }
    if (indicator) indicator.style.opacity = "0"
  })
}

// ── Lifecycle: teardown BEFORE DOM swap, setup AFTER ─────────────────────────
function teardown() {
  openedCleanups.forEach(fn => fn())
  openedCleanups = []

  if (zoomInstance) {
    zoomInstance.detach()
    zoomInstance = null
  }

  document.querySelectorAll<HTMLImageElement>("[data-zoom-src]").forEach(img => {
    img.removeAttribute("data-zoom-src")
    img.classList.remove("medium-zoom-image", "medium-zoom-image--opened")
    img.style.transform = ""
    img.style.willChange = ""
  })

  document.querySelector(".medium-zoom-overlay")?.remove()

  if (keyHandler) window.removeEventListener("keydown", keyHandler)
  if (closeBtn && closeBtnClickHandler) closeBtn.removeEventListener("click", closeBtnClickHandler)
  keyHandler = null
  closeBtnClickHandler = null

  destroyUI()
  resetVars()
}

// Prenav fires before Quartz replaces the page → clean slate for medium-zoom
document.addEventListener("prenav", teardown)

// Nav fires after the new DOM is in place → attach fresh zoom
document.addEventListener("nav", () => {
  setupImageZoom()
  window.addCleanup(teardown)
})