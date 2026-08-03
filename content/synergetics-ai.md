---
title: Synergetics AI
e-issues: "Last Indexed: 12th of March 2026"
tags:
  - hide-from-nav
---

<style>
  .synergetics-card {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    background: color-mix(in srgb, var(--secondary) 12%, transparent);
    border-radius: 8px;
    padding: 12px 16px;
    color: var(--darkgray);
    font-family: inherit;
    margin: 1rem 0;
    box-sizing: border-box;
  }
  .synergetics-card .card-content {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1 1 auto; 
  }
  .synergetics-card .notebook-icon {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    display: block;
  }
  .synergetics-card .headline {
    font-family: var(--bodyFont);
    font-weight: 400;
    font-size: var(--text-base);
    color: var(--dark);
    line-height: 1.3;
  }

  /* Desktop: Make text link unclickable plain text */
  .synergetics-card .notebook-link {
    color: inherit;
    text-decoration: none !important;
    font-weight: normal;
    cursor: default;
    pointer-events: none;
    background-image: none !important; /* Clears CSS background icons */
    padding-right: 0 !important;       /* Clears icon padding */
  }

  /* Hide all potential SSG icon variants on Desktop */
  .synergetics-card .notebook-link::after,
  .synergetics-card .notebook-link::before,
  .synergetics-card .notebook-link svg,
  .synergetics-card .notebook-link img,
  .synergetics-card .notebook-link span,
  .synergetics-card .notebook-link + svg,
  .synergetics-card .notebook-link + span,
  .synergetics-card .notebook-link + i {
    display: none !important;
    content: none !important;
  }

  .synergetics-card .visit-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 6px;
    background: color-mix(in srgb, var(--secondary) 21%, transparent);
    color: var(--dark);
    font-family: var(--bodyFont);
    font-size: 0.9em;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.2s ease;
    flex-shrink: 0; 
    box-sizing: border-box;
  }
  .synergetics-card .visit-btn:hover {
    background: var(--highlight);
    border-color: color-mix(in srgb, var(--tertiary) 50%, transparent);
  }

  /* Mobile: Hide Visit button, activate text link, show underline & arrow */
  @media (max-width: 480px) {
    .synergetics-card .visit-btn {
      display: none !important;
    }
    .synergetics-card .notebook-link {
      text-decoration: underline !important;
      cursor: pointer;
      pointer-events: auto;
    }
    .synergetics-card .notebook-link::after,
    .synergetics-card .notebook-link::before,
    .synergetics-card .notebook-link svg,
    .synergetics-card .notebook-link img,
    .synergetics-card .notebook-link span,
    .synergetics-card .notebook-link + svg,
    .synergetics-card .notebook-link + span,
    .synergetics-card .notebook-link + i {
      display: inline-block !important;
      content: normal !important;
    }
  }
</style>

<div class="synergetics-card">
  <div class="card-content">
    <svg class="notebook-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" fill="none">
      <path stroke="#3186FF" stroke-miterlimit="10" stroke-width="20.8" d="M15.33 125.57c0-2.459 0-1.205-.024-3.208m88.91 2.723.008.485m-88.884 0-.034-4.406m124.893 0-.007 4.406m-124.843.001-.043-5.635c0-44.447 36.033-80.48 80.48-80.48s80.48 36.033 80.48 80.48v5.635"/>
      <path stroke="#4FA0FF" stroke-miterlimit="10" stroke-width="20.8" d="M15.33 125.57c0-2.459 0-1.205-.024-3.208m.034 3.208-.034-4.406c0-34.754 28.708-61.964 62.929-61.964s61.964 27.743 61.964 61.964l-.007 4.406m-124.843.001-.043-5.635"/>
      <path fill="#4FA0FF" d="M150.592 154a6 6 0 0 1-6 6h-8.8a6 6 0 0 1-6-6v-28.431h20.8z"/>
      <path fill="#3186FF" d="M186.64 154a6 6 0 0 1-6 6h-8.8a6 6 0 0 1-6-6v-28.431h20.8z"/>
      <path fill="#76BBFF" d="M58.401 68.869c30.674 0 55.609 24.568 56.203 55.099h.02V154a6 6 0 0 1-6 6h-8.8a6 6 0 0 1-6-6v-28.383l-.006-.363v-.168c0-19.56-15.858-35.416-35.417-35.416-10.162 0-18.291 3.534-23.814 9.03-5.257 5.231-8.679 12.759-8.872 22.183l.035 4.61h-.02l.001.076h.03V154a6 6 0 0 1-6 6h-8.8a6 6 0 0 1-6-6v-28.351l-.01.001v-.002l-.01.001-.002-.078h-.007c0-.808-.002-1.189-.002-1.399l-.004-.468-.003-.165c-.004-.222-.009-.537-.015-1.051a62 62 0 0 1 .005-1.755l-.006-.718.022-.001c.397-14.232 5.728-26.846 14.986-36.058 9.774-9.726 23.345-15.087 38.486-15.087"/>
      <path fill="url(#a)" d="M58.401 68.869c30.674 0 55.609 24.568 56.203 55.099h.02V154a6 6 0 0 1-6 6h-8.8a6 6 0 0 1-6-6v-28.383l-.006-.363v-.168c0-19.56-15.858-35.416-35.417-35.416-10.162 0-18.291 3.534-23.814 9.03-5.257 5.231-8.679 12.759-8.872 22.183l.035 4.61h-.02l.001.076h.03V154a6 6 0 0 1-6 6h-8.8a6 6 0 0 1-6-6v-28.351l-.01.001v-.002l-.01.001-.002-.078h-.007c0-.808-.002-1.189-.002-1.399l-.004-.468-.003-.165c-.004-.222-.009-.537-.015-1.051a62 62 0 0 1 .005-1.755l-.006-.718.022-.001c.397-14.232 5.728-26.846 14.986-36.058 9.774-9.726 23.345-15.087 38.486-15.087"/>
      <defs>
        <radialGradient id="a" cx="0" cy="0" r="1" gradientTransform="matrix(-66.3999 3.99998 -5.65882 -93.9349 96 133.6)" gradientUnits="userSpaceOnUse">
          <stop offset=".567" stop-color="#76BBFF"/>
          <stop offset="1" stop-color="#A9A8FF"/>
        </radialGradient>
      </defs>
    </svg>
    <span class="headline">Go deeper with <a href="https://notebooklm.google.com/notebook/fde697c8-ace7-4855-a636-e7fa2ae304b5?utm_source=nlmm_share" class="notebook-link" target="_blank" rel="noopener">Gemini Notebook</a></span>
  </div>
  <a href="https://notebooklm.google.com/notebook/fde697c8-ace7-4855-a636-e7fa2ae304b5?utm_source=nlmm_share" class="visit-btn" target="_blank" rel="noopener">
    Visit
  </a>
</div>