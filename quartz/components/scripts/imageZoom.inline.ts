import mediumZoom from "medium-zoom"

const SELECTOR = ".center img, .transclude img, figure img, .transclude .transclude img"

let scale = 1
let panX = 0
let panY = 0
let isPanning = false
let panStartX = 0
let panStartY = 0
let activeImg: HTMLImageElement | null = null
let indicator: HTMLElement | null = null
let closeBtn: HTMLElement | null = null
let indicatorTimeout: ReturnType<typeof setTimeout> | null = null
let openedImgCleanups: (() => void)[] = []

const MIN_SCALE = 1
const MAX_SCALE = 5
const SCALE_STEP_SCROLL = 0.003
const SCALE_STEP_PINCH = 0.01
const SCALE_STEP_KEY = 0.25

function createUI() {
  indicator = document.createElement("div")
  indicator.id = "zoom-indicator"
  indicator.style.cssText = `
    position: fixed;
    bottom: 32px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.55);
    color: #fff;
    font: 500 13px/1 ui-monospace, monospace;
    letter-spacing: 0.04em;
    padding: 5px 10px;
    border-radius: 6px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease;
    z-index: 1100;
  `
  document.body.appendChild(indicator)

  closeBtn = document.createElement("button")
  closeBtn.id = "zoom-close"
  closeBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 2L16 16M16 2L2 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`
  closeBtn.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.12);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.18);
    border-radius: 50%;
    color: #fff;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s ease, background 0.15s ease;
    z-index: 1100;
    pointer-events: none;
  `
  closeBtn.addEventListener("mouseenter", () => {
    if (closeBtn) closeBtn.style.background = "rgba(255,255,255,0.22)"
  })
  closeBtn.addEventListener("mouseleave", () => {
    if (closeBtn) closeBtn.style.background = "rgba(255,255,255,0.12)"
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
  if (percent === 100) {
    indicator.style.opacity = "0"
    return
  }
  indicator.textContent = `${percent}%`
  indicator.style.opacity = "1"
  if (indicatorTimeout) clearTimeout(indicatorTimeout)
  indicatorTimeout = setTimeout(() => {
    if (indicator) indicator.style.opacity = "0"
  }, 1200)
}

function applyTransform() {
  if (!activeImg) return
  if (scale <= 1) {
    activeImg.style.transform = ""
    activeImg.style.cursor = "zoom-out"
  } else {
    activeImg.style.transform = `scale(${scale}) translate(${panX / scale}px, ${panY / scale}px) translateZ(0)`
    activeImg.style.cursor = isPanning ? "grabbing" : "grab"
  }
  showIndicator(Math.round(scale * 100))
}

function resetTransform() {
  scale = 1
  panX = 0
  panY = 0
  if (activeImg) {
    activeImg.style.transform = ""
    activeImg.style.cursor = ""
  }
}

function cleanupOpenedListeners() {
  openedImgCleanups.forEach(fn => fn())
  openedImgCleanups = []
}

function setupImageZoom() {
  createUI()

  const zoom = mediumZoom(SELECTOR, {
    margin: 24,
    background: "rgba(22, 22, 24, 0.93)",
    scrollOffset: 999999, // effectively disable medium-zoom's own scroll-to-close
  })

  document.querySelectorAll<HTMLImageElement>(SELECTOR).forEach((img) => {
    img.addEventListener("mouseenter", () => {
      if (img.loading === "lazy") img.loading = "eager"
    }, { once: true })
  })

  zoom.on("open", (e: any) => {
    activeImg = e.target as HTMLImageElement
    scale = 1
    panX = 0
    panY = 0

    if (closeBtn) {
      closeBtn.style.opacity = "1"
      closeBtn.style.pointerEvents = "auto"
    }

    const img = activeImg

    // --- wheel: attached to overlay container, stopPropagation beats medium-zoom ---
    const overlay = document.querySelector(".medium-zoom-overlay") as HTMLElement
    const container = document.querySelector(".medium-zoom-image--opened")?.parentElement || overlay

    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const isPinch = e.ctrlKey
      const step = isPinch ? SCALE_STEP_PINCH : SCALE_STEP_SCROLL
      const delta = e.deltaY

      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale - delta * step))
      scale = newScale
      if (scale <= 1) { panX = 0; panY = 0 }
      applyTransform()
    }

    // --- pan ---
    const mousedownHandler = (e: MouseEvent) => {
      if (scale <= 1) return
      // don't interfere with close button
      if ((e.target as HTMLElement).closest("#zoom-close")) return
      isPanning = true
      panStartX = e.clientX - panX
      panStartY = e.clientY - panY
      img.style.cursor = "grabbing"
      e.preventDefault()
      e.stopPropagation()
    }

    const mousemoveHandler = (e: MouseEvent) => {
      if (!isPanning) return
      panX = e.clientX - panStartX
      panY = e.clientY - panStartY
      applyTransform()
    }

    const mouseupHandler = () => {
      if (!isPanning) return
      isPanning = false
      if (scale > 1) img.style.cursor = "grab"
    }

    // attach to document so mousemove/up work even outside image bounds while dragging
    window.addEventListener("wheel", wheelHandler, { passive: false, capture: true })
    document.addEventListener("mousedown", mousedownHandler)
    document.addEventListener("mousemove", mousemoveHandler)
    document.addEventListener("mouseup", mouseupHandler)

    openedImgCleanups.push(() => {
      window.removeEventListener("wheel", wheelHandler, { capture: true } as any)
      document.removeEventListener("mousedown", mousedownHandler)
      document.removeEventListener("mousemove", mousemoveHandler)
      document.removeEventListener("mouseup", mouseupHandler)
    })
  })

  zoom.on("close", () => {
    cleanupOpenedListeners()
    resetTransform()
    activeImg = null
    isPanning = false

    if (closeBtn) {
      closeBtn.style.opacity = "0"
      closeBtn.style.pointerEvents = "none"
    }
    if (indicator) indicator.style.opacity = "0"
  })

  // arrow keys — window level is fine, no conflict here
  const keyHandler = (e: KeyboardEvent) => {
    if (!activeImg) return
    if (e.key === "ArrowUp" || e.key === "=") {
      e.preventDefault()
      scale = Math.min(MAX_SCALE, scale + SCALE_STEP_KEY)
      applyTransform()
    } else if (e.key === "ArrowDown" || e.key === "-") {
      e.preventDefault()
      scale = Math.max(MIN_SCALE, scale - SCALE_STEP_KEY)
      if (scale <= 1) { panX = 0; panY = 0 }
      applyTransform()
    }
  }

  const closeBtnHandler = () => zoom.close()
  closeBtn?.addEventListener("click", closeBtnHandler)

  window.addEventListener("keydown", keyHandler)

  window.addCleanup(() => {
    cleanupOpenedListeners()
    zoom.detach()
    destroyUI()
    window.removeEventListener("keydown", keyHandler)
    closeBtn?.removeEventListener("click", closeBtnHandler)
  })
}

document.addEventListener("nav", setupImageZoom)