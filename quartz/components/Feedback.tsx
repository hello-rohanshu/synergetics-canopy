// @ts-ignore
import feedbackScript from "./scripts/feedback.inline"
import styles from "./styles/feedback.scss"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const Feedback: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
  return (
    <div class="feedback-modal" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
      <div class="feedback-content">
        <button class="feedback-close" aria-label="Close dialog">×</button>
        
        <div class="feedback-header">
          <p id="feedback-title" class="feedback-title">Share your thoughts</p>
        </div>

        {/* Feedback Type Custom Select */}
        <div class="feedback-field">
          <label id="label-feedback-type" for="feedback-type">What kind of feedback is this?</label>
          <div class="custom-select" data-id="feedback-type">
            <select id="feedback-type" style={{ display: 'none' }}>
              <option value="type: bug">Something is broken (Bug)</option>
              <option value="type: feedback">Just a general thought or idea</option>
              <option value="type: feature">A feature request</option>
            </select>
            <button type="button" class="custom-select__trigger" role="combobox" aria-expanded="false" aria-haspopup="listbox" aria-labelledby="label-feedback-type" aria-activedescendant="">
              <span class="custom-select__value">Something is broken (Bug)</span>
              <span class="custom-select__chevron" aria-hidden="true">›</span>
            </button>
            <ul class="custom-select__list" role="listbox" hidden>
              <li role="option" id="type-opt-0" data-value="type: bug" aria-selected="true" class="highlighted selected">Something is broken (Bug)</li>
              <li role="option" id="type-opt-1" data-value="type: feedback" aria-selected="false">Just a general thought or idea</li>
              <li role="option" id="type-opt-2" data-value="type: feature" aria-selected="false">A feature request</li>
            </ul>
          </div>
        </div>

        {/* Feedback Area Custom Select */}
        <div class="feedback-field">
          <label id="label-feedback-area" for="feedback-area">Where did you notice this?</label>
          <div class="custom-select" data-id="feedback-area">
            <select id="feedback-area" style={{ display: 'none' }}>
              <option value="area: ai-chat">AI Chat</option>
              <option value="area: hosting">Hosting</option>
              <option value="area: research">Research</option>
              <option value="area: site-ux">Site UX / Experience</option>
              <option value="area: synergetics-content">Synergetics Content</option>
              <option value="area: version-organization">Version Organization</option>
            </select>
            <button type="button" class="custom-select__trigger" role="combobox" aria-expanded="false" aria-haspopup="listbox" aria-labelledby="label-feedback-area" aria-activedescendant="">
              <span class="custom-select__value">AI Chat</span>
              <span class="custom-select__chevron" aria-hidden="true">›</span>
            </button>
            <ul class="custom-select__list" role="listbox" hidden>
              <li role="option" id="area-opt-0" data-value="area: ai-chat" aria-selected="true" class="highlighted selected">AI Chat</li>
              <li role="option" id="area-opt-1" data-value="area: hosting" aria-selected="false">Hosting</li>
              <li role="option" id="area-opt-2" data-value="area: research" aria-selected="false">Research</li>
              <li role="option" id="area-opt-3" data-value="area: site-ux" aria-selected="false">Site UX / Experience</li>
              <li role="option" id="area-opt-4" data-value="area: synergetics-content" aria-selected="false">Synergetics Content</li>
              <li role="option" id="area-opt-5" data-value="area: version-organization" aria-selected="false">Version Organization</li>
            </ul>
          </div>
        </div>

        <div class="feedback-field">
          <label for="feedback-message">What's on your mind?</label>
          <textarea id="feedback-message" placeholder="Tell us a bit more about it..." rows={4} required></textarea>
        </div>

        <div class="feedback-row">
          <div class="feedback-field">
            <label for="feedback-name">Your name <span class="optional">optional</span></label>
            <input id="feedback-name" type="text" placeholder="e.g., Alex" />
          </div>
          <div class="feedback-field">
            <label for="feedback-github">GitHub handle <span class="optional">optional</span></label>
            <input id="feedback-github" type="text" placeholder="username" />
          </div>
        </div>

        <input
          id="feedback-trap"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }}
        />

        {/* Static Footprint Status Slot */}
        <div id="feedback-status" class="feedback-status feedback-status--notice">
          All info will be public on GitHub.
        </div>

        <div class="feedback-actions">
          <button class="cancel-btn">Cancel</button>
          <button class="submit-btn">Submit feedback</button>
        </div>
      </div>
    </div>
  )
}

Feedback.beforeDOMLoaded = feedbackScript
Feedback.css = styles

export default (() => Feedback) satisfies QuartzComponentConstructor