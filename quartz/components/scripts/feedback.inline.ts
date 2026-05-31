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

  const customSelectContainers = document.querySelectorAll(".custom-select")
  const dropdownCleanupFns: (() => void)[] = []

  const initCustomDropdowns = () => {
    customSelectContainers.forEach((container) => {
      const select = container.querySelector("select")
      const trigger = container.querySelector(".custom-select__trigger") as HTMLButtonElement
      const list = container.querySelector(".custom-select__list") as HTMLUListElement
      const options = Array.from(list.querySelectorAll('li[role="option"]')) as HTMLLIElement[]

      let highlightedIndex = 0

      const openDropdown = () => {
        closeAllDropdowns()
        trigger.setAttribute("aria-expanded", "true")
        list.removeAttribute("hidden")

        const currentSelection = options.findIndex(opt => opt.getAttribute("aria-selected") === "true")
        highlightedIndex = currentSelection >= 0 ? currentSelection : 0
        updateHighlight(highlightedIndex)
      }

      const closeDropdown = () => {
        trigger.setAttribute("aria-expanded", "false")
        list.setAttribute("hidden", "")
        trigger.removeAttribute("aria-activedescendant")
      }

      const updateHighlight = (index: number) => {
        options.forEach((opt, i) => {
          if (i === index) {
            opt.classList.add("highlighted")
            trigger.setAttribute("aria-activedescendant", opt.id)
            opt.scrollIntoView({ block: "nearest" })
          } else {
            opt.classList.remove("highlighted")
          }
        })
      }

      const selectOption = (index: number) => {
        const targetOption = options[index]
        const val = targetOption.getAttribute("data-value") || ""
        const text = targetOption.textContent || ""

        if (select) {
          select.value = val
          select.dispatchEvent(new Event("change"))
        }

        const valSpan = trigger.querySelector(".custom-select__value")
        if (valSpan) valSpan.textContent = text

        options.forEach((opt, i) => {
          const isSelected = i === index
          opt.setAttribute("aria-selected", isSelected ? "true" : "false")
          opt.classList.toggle("selected", isSelected)
        })

        closeDropdown()
        trigger.focus()
      }

      const handleTriggerClick = (e: MouseEvent) => {
        e.stopPropagation()
        const isOpen = trigger.getAttribute("aria-expanded") === "true"
        isOpen ? closeDropdown() : openDropdown()
      }

      const handleKeyDown = (e: KeyboardEvent) => {
        const isOpen = trigger.getAttribute("aria-expanded") === "true"

        if (!isOpen) {
          if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === " " || e.key === "Enter") {
            e.preventDefault()
            openDropdown()
          }
          return
        }

        switch (e.key) {
          case "ArrowDown":
            e.preventDefault()
            highlightedIndex = (highlightedIndex + 1) % options.length
            updateHighlight(highlightedIndex)
            break
          case "ArrowUp":
            e.preventDefault()
            highlightedIndex = (highlightedIndex - 1 + options.length) % options.length
            updateHighlight(highlightedIndex)
            break
          case "Home":
            e.preventDefault()
            highlightedIndex = 0
            updateHighlight(highlightedIndex)
            break
          case "End":
            e.preventDefault()
            highlightedIndex = options.length - 1
            updateHighlight(highlightedIndex)
            break
          case "Enter":
          case " ":
            e.preventDefault()
            selectOption(highlightedIndex)
            break
          case "Escape":
            e.preventDefault()
            closeDropdown()
            trigger.focus()
            break
          case "Tab":
            closeDropdown()
            break
        }
      }

      trigger.addEventListener("click", handleTriggerClick)
      trigger.addEventListener("keydown", handleKeyDown)

      options.forEach((opt, index) => {
        const handleOptClick = (e: MouseEvent) => {
          e.stopPropagation()
          selectOption(index)
        }
        opt.addEventListener("click", handleOptClick)
      })

      dropdownCleanupFns.push(() => {
        trigger.removeEventListener("click", handleTriggerClick)
        trigger.removeEventListener("keydown", handleKeyDown)
      })
    })
  }

  const closeAllDropdowns = () => {
    customSelectContainers.forEach((container) => {
      const trigger = container.querySelector(".custom-select__trigger")
      const list = container.querySelector(".custom-select__list")
      trigger?.setAttribute("aria-expanded", "false")
      list?.setAttribute("hidden", "")
    })
  }

  const resetCustomDropdownsUI = () => {
    customSelectContainers.forEach((container) => {
      const select = container.querySelector("select")
      if (select) select.selectedIndex = 0

      const firstOpt = container.querySelector('li[role="option"]')
      const options = container.querySelectorAll('li[role="option"]')
      const valSpan = container.querySelector(".custom-select__value")

      if (firstOpt && valSpan) {
        valSpan.textContent = firstOpt.textContent
      }

      options.forEach((opt, i) => {
        opt.setAttribute("aria-selected", i === 0 ? "true" : "false")
        opt.classList.toggle("selected", i === 0)
        opt.classList.toggle("highlighted", i === 0)
      })
    })
  }

  initCustomDropdowns()

  const resetStatus = () => {
    if (!statusDiv) return
    statusDiv.className = "feedback-status feedback-status--notice"
    statusDiv.innerHTML = "All info will be public on GitHub."
  }

  const closeModal = () => {
    modal.classList.remove("open")
    resetStatus()
    closeAllDropdowns()
    resetCustomDropdownsUI()
    if (msgInput) msgInput.value = ""
    if (nameInput) nameInput.value = ""
    if (githubInput) githubInput.value = ""
    if (trapInput) trapInput.value = ""
    if (submitBtn) {
      submitBtn.disabled = false
      submitBtn.textContent = "Submit feedback"
    }
  }

  closeBtn?.addEventListener("click", closeModal)
  cancelBtn?.addEventListener("click", closeModal)

  const outsideClick = (e: MouseEvent) => {
    if (e.target === modal) closeModal()
    if (!(e.target as HTMLElement).closest(".custom-select")) {
      closeAllDropdowns()
    }
  }
  window.addEventListener("click", outsideClick)

  const escapeClick = (e: KeyboardEvent) => {
    if (e.key === "Escape" && modal.classList.contains("open")) {
      const parsingDropdowns = Array.from(customSelectContainers).some(
        c => c.querySelector(".custom-select__trigger")?.getAttribute("aria-expanded") === "true"
      )
      if (!parsingDropdowns) closeModal()
    }
  }
  window.addEventListener("keydown", escapeClick)

  const showStatus = (message: string, type: "success" | "error" | "warning" | "loading", linkUrl?: string) => {
    if (!statusDiv) return
    statusDiv.className = `feedback-status feedback-status--${type}`

    if (type === "loading") {
      statusDiv.innerHTML = `
        <span class="feedback-spinner"></span>
        <span class="feedback-status-text">Sending your thoughts over...</span>
      `
    } else if (type === "success" && linkUrl) {
      statusDiv.innerHTML = `
        <div class="feedback-success-wrapper">
          <p>Aweseome, feedback live! <a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="status-link">Check →</a></p>
        </div>
      `
    } else {
      statusDiv.innerHTML = `<span class="feedback-status-text">${message}</span>`
    }
  }

  const submitFeedback = async () => {
    if (!typeSelect || !areaSelect || !msgInput || !statusDiv || !submitBtn) return

    if (!msgInput.value.trim()) {
      showStatus("Please enter a message before submitting!", "warning")
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
        resetCustomDropdownsUI()
      } else {
        showStatus("Something went wrong on our end. Could you try sending it again?", "error")
      }
    } catch (err) {
      showStatus("Connection issue. Please check your network and give it another shot.", "error")
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
    dropdownCleanupFns.forEach(cleanup => cleanup())
  })
})

window.addEventListener("open-feedback", () => {
  const modal = document.querySelector(".feedback-modal")
  if (modal) {
    modal.classList.add("open")
  }
})