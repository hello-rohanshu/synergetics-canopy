---
title: Home
description: "Buckminster Fuller's Synergetics — a navigable digital edition of all 1,468 pages with instant search, AI assistant, and paragraph-level links."
---

<img src="bucky-classroom.jpg" 
     alt="Bucky in the classroom" 
     width="300" 
     style="border-radius: 16px; display: block; margin: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.08);" />

<style>
.image-gallery {
  width: 100%;
  max-width: 800px;
  margin: 1.5rem auto;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.gallery-track {
  display: flex;
  gap: 12px;
  padding: 4px 0;
  align-items: center; /* Vertically centers all items in the track */
}
.gallery-item {
  flex: 0 0 auto;
  height: 170px;
  /* Width removed — lets the image determine its own width */
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.gallery-item img {
  height: 100%; /* Fill the container height */
  width: auto; /* Width adjusts proportionally to maintain aspect ratio */
  display: block;
  transition: opacity 0.2s ease;
  object-fit: contain; /* Ensures full image is visible */
  object-position: center center;
}
.gallery-item img:hover {
  opacity: 0.85;
}
.image-gallery::-webkit-scrollbar {
  height: 4px;
}
.image-gallery::-webkit-scrollbar-track {
  background: transparent;
}
.image-gallery::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 10px;
}
</style>

&nbsp;

# About

This is Buckminster Fuller's magnum opus _Synergetics_. Sourced from [R. W. Gray's 1997 digitization](https://rwgrayprojects.com/synergetics/synergetics.html) of the original books and [Buckyverse.org](https://buckyverse.org), hosted on [Quartz 4](https://github.com/jackyzha0/quartz/tree/v4) static site builder.

Use the explorer on left hand side for navigation!


&nbsp;

# Project Status

<div class="status-card" style="margin: 1.5rem 0;">
  <a href="/content-audit" style="display: flex; align-items: center; gap: 1.5rem; padding: 1rem 2rem; background: var(--light); border: 1px solid var(--lightgray); border-radius: 12px; text-decoration: none; transition: background 0.2s, border-color 0.2s;" onmouseover="this.style.background='var(--highlight)'" onmouseout="this.style.background='var(--light)'; this.style.borderColor='var(--lightgray)'">
    <div style="flex: 1;">
      <div style="font-weight: 600; font-size: 1.05rem; color: var(--darkgray); margin-bottom: 0.2rem;">Content Completeness</div>
      <div style="font-size: 0.85rem; color: var(--gray);">Check Detailed Audit -></div>
    </div>
    <span style="font-family: var(--codeFont); font-size: 2rem; font-weight: 700; color: var(--tertiary);">{{buildstat:audit-pct}}</span>
  </a>
</div>

<div class="status-card" style="margin: 1.5rem 0;">
  <a href="/changelog" style="display: flex; align-items: center; gap: 1.5rem; padding: 1rem 2rem; background: var(--light); border: 1px solid var(--lightgray); border-radius: 12px; text-decoration: none; transition: background 0.2s, border-color 0.2s;" onmouseover="this.style.background='var(--highlight)'" onmouseout="this.style.background='var(--light)'; this.style.borderColor='var(--lightgray)'">
    <div style="flex: 1;">
      <div style="font-weight: 600; font-size: 1.05rem; color: var(--darkgray); margin-bottom: 0.2rem;">Current Version</div>
      <div style="font-size: 0.85rem; color: var(--gray);">See Changelog -></div>
    </div>
    <span style="font-family: var(--codeFont); font-size: 2rem; font-weight: 700; color: var(--tertiary);">{{buildstat:changelog-version}}</span>
  </a>
</div>

&nbsp;

# Links

<style>
.link-btn {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 12px 22px;
  border: 1.5px solid var(--lightgray);
  border-radius: 8px;
  text-decoration: none;
  color: var(--dark);
  font-size: 16px;
  font-weight: 500;
  background: transparent;
  cursor: pointer;
  transition: opacity 0.2s ease, border-color 0.2s ease;
  width: fit-content;
  font-family: inherit;
}
.link-btn:hover {
  opacity: 0.8;
}
.link-btn svg {
  flex-shrink: 0;
}
</style>

<a class="link-btn" href="https://discord.gg/xwvydhzXut" target="_blank" rel="noopener noreferrer">
  <svg width="22" height="17" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.44077 45.4204 0.52529C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.52529C25.5141 0.44359 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" fill="#5865F2"/></svg>
  Buckminster Fuller Discord Server
</a>

<a class="link-btn" href="https://github.com/hello-rohanshu/synergetics-canopy" target="_blank" rel="noopener noreferrer">
  <svg width="20" height="20" viewBox="0 0 98 96" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-2.965.324-2.965 4.918.326 7.523 5.074 7.523 5.074 4.392 7.495 11.48 5.34 14.299 4.076.435-3.181 1.696-5.34 3.085-6.566-10.837-1.194-22.224-5.424-22.224-24.128 0-5.34 1.905-9.686 5.002-13.107-.525-1.194-2.155-6.267.498-13.068 0 0 4.085-1.303 13.391 5.006a46.648 46.648 0 0 1 12.177-1.63c4.127 0 8.261.544 12.177 1.63 9.306-6.309 13.39-5.006 13.39-5.006 2.653 6.801 1.023 11.874.498 13.068 3.108 3.421 5.002 7.767 5.002 13.107 0 18.735-11.395 22.934-22.239 24.139 1.728 1.476 3.332 4.479 3.332 9.037 0 6.525-.08 11.79-.08 13.39 0 1.304.889 2.863 3.316 2.363 19.423-6.519 33.404-24.935 33.404-46.691C97.707 22 75.87 0 48.854 0z" fill="currentColor"/>
  </svg>
  GitHub
</a>

<button class="link-btn" onclick="window.dispatchEvent(new CustomEvent('open-feedback'))">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c-2 .2-3.53 1.9-3.53 3.8"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/>
  </svg>
  Send Feedback
</button>


