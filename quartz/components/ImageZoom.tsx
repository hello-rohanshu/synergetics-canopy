import { QuartzComponent, QuartzComponentConstructor } from "./types"
// @ts-ignore
import script from "./scripts/imageZoom.inline"

const ImageZoom: QuartzComponent = () => <></>
ImageZoom.afterDOMLoaded = script
ImageZoom.css = `
  .center img,
  .transclude img,
  figure img {
    cursor: zoom-in;
  }

  .medium-zoom-overlay,
  .medium-zoom-image--opened {
    z-index: 1000;
  }

  .medium-zoom-image--opened {
    touch-action: none;
    transition: transform 0.12s ease !important;
  }
`

export default (() => ImageZoom) satisfies QuartzComponentConstructor