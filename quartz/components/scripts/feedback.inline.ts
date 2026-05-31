document.addEventListener("nav", () => {
  const modal = document.querySelector(".feedback-modal") as HTMLDivElement | null
  const closeBtn = document.querySelector(".feedback-close") as HTMLButtonElement | null
  const cancelBtn = document.querySelector(".cancel-btn") as HTMLButtonElement | null
  const submitBtn = document.querySelector(".submit-btn") as HTMLButtonElement | null

  const typeSelect = document.getElementById("feedback-type") as HTMLSelectElement | null
  const areaSelect = document.getElementById("feedback-area") as HTMLSelectElement | null
  const msgInput = document.getElementById("feedback-message") as HTMLTextAreaElement | null
  const nameInput = document.getElementById("feedback-name") as HTMLInputElement | null
  const githubInput = document.getElementById("feedback-github") as HTMLInputElement | null
  const trapInput = document.getElementById("feedback-trap") as HTMLInputElement | null
  const statusDiv = document.getElementById("feedback-status") as HTMLDivElement | null

  if (!modal) return

  const resetStatus = () => {
    if (!statusDiv) return
    statusDiv.style.display = "none"
    statusDiv.className = ""
    statusDiv.innerHTML = ""
  }

  const closeModal = () => {
    modal.classList.remove("open")
    resetStatus()
    if (msgInput) msgInput.value = ""
    if (nameInput) nameInput.value = ""
    if (githubInput) githubInput.value = ""
    if (trapInput) trapInput.value = ""
    if (typeSelect) typeSelect.selectedIndex = 0 
    if (areaSelect) areaSelect.selectedIndex = 0 
    if (submitBtn) {
      submitBtn.disabled = false
      submitBtn.textContent = "Submit feedback"
    }
  }

  closeBtn?.addEventListener("click", closeModal)
  cancelBtn?.addEventListener("click", closeModal)

  const outsideClick = (e: MouseEvent) => {
    if (e.target === modal) closeModal()
  }
  window.addEventListener("click", outsideClick)

  // Escape key handler
  const escapeClick = (e: KeyboardEvent) => {
    if (e.key === "Escape" && modal.classList.contains("open")) {
      closeModal()
    }
  }
  window.addEventListener("keydown", escapeClick)

  const showStatus = (message: string, type: "success" | "error" | "warning" | "loading", linkUrl?: string) => {
    if (!statusDiv) return
    statusDiv.style.display = "block"
    statusDiv.className = `feedback-status feedback-status--${type}`

    if (type === "loading") {
      statusDiv.innerHTML = `
        <span class="feedback-spinner"></span>
        <span>Sending your thoughts over...</span>
      `
    } else if (type === "success" && linkUrl) {
      statusDiv.innerHTML = `
        <div>
          <p>🎉 <strong>Awesome, your feedback is live!</strong></p>
          <p class="status-link-text"><a href="${linkUrl}" target="_blank" rel="noopener noreferrer">View GitHub Issue →</a></p>
        </div>
      `
    } else {
      statusDiv.textContent = message
    }
  }

  const submitFeedback = async () => {
    if (!typeSelect || !areaSelect || !msgInput || !statusDiv || !submitBtn) return

    if (!msgInput.value.trim()) {
      showStatus("⚠️ Please enter a message before submitting!", "warning")
      return
    }

    const payload = {
      type: typeSelect.value,
      area: areaSelect.value,
      message: msgInput.value,
      name: nameInput?.value?.trim() || undefined,
      github_username: githubInput?.value?.trim() || undefined,
      url: window.location.href,
      labels: ["source: widget"],
      _trap: trapInput?.value || ""
    }

    submitBtn.disabled = true
    submitBtn.textContent = "Submitting..."
    showStatus("", "loading")

    try {
      const res = await fetch("https://synergetics-github-api-helper.rohanshu.workers.dev/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const data = (await res.json()) as { ok: boolean; issue_url?: string }

      if (data.ok && data.issue_url) {
        showStatus("", "success", data.issue_url)
        msgInput.value = ""
        if (nameInput) nameInput.value = ""
        if (githubInput) githubInput.value = ""
      } else {
        showStatus("💥 Ouch, something went wrong on our end. Could you try sending it again?", "error")
      }
    } catch (err) {
      showStatus("📡 Connection issue. Please check your network and give it another shot.", "error")
    } finally {
      submitBtn.disabled = false
      submitBtn.textContent = "Submit feedback"
    }
  }

  submitBtn?.addEventListener("click", submitFeedback)

  window.addCleanup(() => {
    closeBtn?.removeEventListener("click", closeModal)
    cancelBtn?.removeEventListener("click", closeModal)
    window.removeEventListener("click", outsideClick)
    window.removeEventListener("keydown", escapeClick)
    submitBtn?.removeEventListener("click", submitFeedback)
  })
})

window.addEventListener("open-feedback", () => {
  const modal = document.querySelector(".feedback-modal")
  if (modal) {
    modal.classList.add("open")
  }
})