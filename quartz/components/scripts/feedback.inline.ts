document.addEventListener("nav", () => {
  const modal = document.querySelector(".feedback-modal") as HTMLDivElement | null
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

  const closeModal = () => {
    modal.classList.remove("open")
    if (statusDiv) statusDiv.style.display = "none"
    if (msgInput) msgInput.value = ""
    if (nameInput) nameInput.value = ""
    if (githubInput) githubInput.value = ""
    if (trapInput) trapInput.value = ""
  }

  cancelBtn?.addEventListener("click", closeModal)

  const outsideClick = (e: MouseEvent) => {
    if (e.target === modal) closeModal()
  }
  window.addEventListener("click", outsideClick)

  const submitFeedback = async () => {
    if (!typeSelect || !areaSelect || !msgInput || !statusDiv || !submitBtn) return

    if (!msgInput.value.trim()) {
      statusDiv.style.display = "block"
      statusDiv.innerText = "Message cannot be empty."
      return
    }

    const payload = {
      type: typeSelect.value,
      area: areaSelect.value,
      message: msgInput.value,
      name: nameInput?.value?.trim() || undefined,
      github_username: githubInput?.value?.trim() || undefined,
      url: window.location.href,
      _trap: trapInput?.value || ""
    }

    submitBtn.disabled = true
    statusDiv.style.display = "block"
    statusDiv.innerText = "Submitting..."

    try {
      const res = await fetch("https://synergetics-github-api-helper.rohanshu.workers.dev/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const data = (await res.json()) as { ok: boolean; issue_url?: string }

      if (data.ok && data.issue_url) {
        statusDiv.innerHTML = `✅ <a href="${data.issue_url}" target="_blank" rel="noopener">Issue created — thank you!</a>`
        msgInput.value = ""
        if (nameInput) nameInput.value = ""
        if (githubInput) githubInput.value = ""
      } else {
        statusDiv.innerText = "❌ Failed to submit. Try again."
      }
    } catch (err) {
      statusDiv.innerText = "❌ Network error."
    } finally {
      submitBtn.disabled = false
    }
  }

  submitBtn?.addEventListener("click", submitFeedback)

  window.addCleanup(() => {
    cancelBtn?.removeEventListener("click", closeModal)
    window.removeEventListener("click", outsideClick)
    submitBtn?.removeEventListener("click", submitFeedback)
  })
})

// Listen for the custom event from the inline button
window.addEventListener("open-feedback", () => {
  const modal = document.querySelector(".feedback-modal")
  if (modal) {
    modal.classList.add("open")
  }
})