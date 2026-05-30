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
          <option value="Bug Report">Bug Report</option>
          <option value="Content Issue">Content Issue</option>
          <option value="Suggestion">Suggestion</option>
        </select>

        <select id="feedback-area">
          <option value="User Interface">User Interface</option>
          <option value="Text / Content">Text / Content</option>
          <option value="Other">Other</option>
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