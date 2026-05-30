// @ts-ignore
import feedbackScript from "./scripts/feedback.inline"
import styles from "./styles/feedback.scss"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const Feedback: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
  return (
    <div class="feedback-modal">
      <div class="feedback-content">
        <h3>Send Feedback</h3>

        <select id="feedback-type">
          <option value="type: bug">Bug Report</option>
          <option value="type: feedback">Feedback</option>
          <option value="type: feature">Feature Request</option>
        </select>

        <select id="feedback-area">
          <option value="area: ai-chat">AI Chat</option>
          <option value="area: hosting">Hosting</option>
          <option value="area: research">Research</option>
          <option value="area: site-ux">Site UX</option>
          <option value="area: synergetics-content">Synergetics Content</option>
          <option value="area: version-organization">Version Organization</option>
        </select>

        <textarea id="feedback-message" placeholder="What's on your mind?" required></textarea>

        <input id="feedback-name" type="text" placeholder="Your name (optional)" />
        <input id="feedback-github" type="text" placeholder="GitHub username (optional)" />

        {/* Honeypot — hidden from humans, bots fill it */}
        <input
          id="feedback-trap"
          type="text"
          name="website"
          tabIndex={-1}
          autocomplete="off"
          aria-hidden="true"
          style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0;"
        />

        <p class="feedback-privacy">
          Submissions are posted as public GitHub issues.
        </p>

        <div id="feedback-status"></div>

        <div class="feedback-actions">
          <button class="cancel-btn">Cancel</button>
          <button class="submit-btn">Submit</button>
        </div>
      </div>
    </div>
  )
}

Feedback.beforeDOMLoaded = feedbackScript
Feedback.css = styles

export default (() => Feedback) satisfies QuartzComponentConstructor