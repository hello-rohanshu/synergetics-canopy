import { QuartzComponent, QuartzComponentConstructor } from "./types"

const SynergeticsAI: QuartzComponent = () => {
  return (
    <div id="synergetics-container">
      <div class="construction-card">
        <span class="card-icon">🛠️</span>
        <span class="card-text">Under Construction</span>
      </div>
    </div>
  )
}

SynergeticsAI.css = `
#synergetics-container {
  max-width: 618px;
  margin: 3rem auto;
  padding: 0 1rem;
  box-sizing: border-box;
}

.construction-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 2rem;
  background: var(--highlight);
  border: 2px dashed var(--tertiary);
  border-radius: 8px;
  color: var(--dark);
  font-family: var(--bodyFont);
  font-size: 1.125rem;
  font-weight: 600;
  text-align: center;
  width: 100%;
  box-sizing: border-box;
}

.card-icon {
  font-size: 1.5rem;
  line-height: 1;
}
`

export default (() => SynergeticsAI) satisfies QuartzComponentConstructor