// @ts-ignore
import feedbackScript from "./scripts/feedback.inline"
import styles from "./styles/feedback.scss"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const Feedback: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
  return (
    <div class="feedback-modal" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
      <div class="feedback-content">
        <button class="feedback-close" aria-label="Close dialog">×</button>
        
        <h3 id="feedback-title">Share your thoughts</h3>

        <div class="feedback-field">
          <label for="feedback-type">What kind of feedback is this?</label>
          <div class="select-wrapper">
            <select id="feedback-type">
              <option value="type: bug">Something is broken (Bug)</option>
              <option value="type: feedback">Just a general thought or idea</option>
              <option value="type: feature">A feature request</option>
            </select>
          </div>
        </div>

        <div class="feedback-field">
          <label for="feedback-area">Where did you notice this?</label>
          <div class="select-wrapper">
            <select id="feedback-area">
              <option value="area: ai-chat">AI Chat</option>
              <option value="area: hosting">Hosting</option>
              <option value="area: research">Research</option>
              <option value="area: site-ux">Site UX / Experience</option>
              <option value="area: synergetics-content">Synergetics Content</option>
              <option value="area: version-organization">Version Organization</option>
            </select>
          </div>
        </div>

        <div class="feedback-field">
          <label for="feedback-message">What's on your mind?</label>
          <textarea id="feedback-message" placeholder="Tell us a bit more about it..." rows={4} required></textarea>
        </div>

        <div class="feedback-row">
          <div class="feedback-field">
            <label for="feedback-name">Your name <span class="optional">(optional)</span></label>
            <input id="feedback-name" type="text" placeholder="e.g., Alex" />
          </div>
          <div class="feedback-field">
            <label for="feedback-github">GitHub handle <span class="optional">(optional)</span></label>
            <input id="feedback-github" type="text" placeholder="username" />
          </div>
        </div>

        <input
          id="feedback-trap"
          type="text"
          name="website"
          tabIndex={-1}
          autocomplete="off"
          aria-hidden="true"
          style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }}
        />

        <div id="feedback-status"></div>

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