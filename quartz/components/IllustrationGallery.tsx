// quartz/components/IllustrationGallery.tsx
import galleryData from "../static/data/illustrations.json"
import { QuartzComponent, QuartzComponentConstructor } from "./types"

interface GalleryItem {
  title: string
  href: string
  thumb: string
}

interface GalleryData {
  generated: string
  figures: GalleryItem[]
  misc: GalleryItem[]
}

const data = galleryData as GalleryData

const Card = ({ item }: { item: GalleryItem }) => (
  <a className="ig-card" href={item.href} target={item.thumb ? undefined : "_blank"}>
    {item.thumb ? (
      <img className="ig-thumb" src={item.thumb} alt="" loading="lazy" />
    ) : (
      <div className="ig-thumb ig-placeholder">no image</div>
    )}
    <span className="ig-title">{item.title}</span>
  </a>
)

const IllustrationGallery: QuartzComponent = () => (
  <>
    <style>{`
      .ig-container { margin: 2rem 0; font-family: var(--bodyFont); color: var(--dark); }
      .ig-heading { font-size: 1.15rem; font-weight: 700; color: var(--secondary); margin: 1.5rem 0 0.75rem; }
      .ig-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; }

      .ig-card { display: flex; flex-direction: column; border: 1px solid var(--lightgray); border-radius: 8px; overflow: hidden; text-decoration: none; color: inherit; background: var(--light); transition: border-color 0.15s; }
      .ig-card:hover { border-color: var(--secondary); }

      .ig-thumb { width: 100%; aspect-ratio: 1 / 1; object-fit: cover; display: block; background: var(--highlight); }
      .ig-placeholder { display: flex; align-items: center; justify-content: center; font-size: 0.8rem; color: var(--gray); font-style: italic; }

      .ig-title { font-size: 0.82rem; line-height: 1.35; padding: 0.5rem 0.6rem; color: var(--darkgray); }

      .ig-empty { font-size: 0.9rem; color: var(--gray); font-style: italic; }
    `}</style>

    <div className="ig-container">

      <div className="ig-heading">Figures</div>
      {data.figures && data.figures.length > 0 ? (
        <div className="ig-grid">
          {data.figures.map((item) => <Card item={item} key={item.href} />)}
        </div>
      ) : (
        <p className="ig-empty">No figures logged yet.</p>
      )}

      <div className="ig-heading">Misc</div>
      {data.misc && data.misc.length > 0 ? (
        <div className="ig-grid">
          {data.misc.map((item) => <Card item={item} key={item.href} />)}
        </div>
      ) : (
        <p className="ig-empty">No miscellaneous images logged yet.</p>
      )}

    </div>
  </>
)

export default (() => IllustrationGallery) satisfies QuartzComponentConstructor