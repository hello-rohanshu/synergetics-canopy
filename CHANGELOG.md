# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- ## [Unreleased] -->

## [1.1.0] — 2026-08-24

### Added

- Gemini Notebook integration — a pre-loaded Synergetics notebook for long-form conversation with the full corpus, accessible from the AI page
- Interactive Jitterbug — new interactive diagram (fig. 460.08) embedded inline in its chapter
- Smart 404 — broken URLs now resolve into a fuzzy search bar rather than a dead end
- Dedicated interactive figures page

### Changed

- Systems Manifest updated for v1.1.0
- Homepage about section, feedback button, and GitHub link improved
- Minor UI polish on AI page
- GitHub Readme updated

### Fixed

- AI reliability significantly improved with a backend overhaul, multi-provider fallback chain, reduced downtime, and exposed health endpoints for monitoring
- Broken hyperlinks resolved across chapters 200, 500, 600, 800, 900, 1000, and 1100; formatting coverage 77% → 80% as per v3 pass
- AI page no longer auto-selects the input field after an answer is generated
- Interactive fig. 100.103 reworked to better resemble Fuller's original figure


## [1.0.0] — 2026-07-11

### Added

- Complete text from R. W. Gray's Synergetics Online, with supplementary images from Buckyverse.org
- AI assistant grounded on the full text
- Paragraph-level anchors with one-click copy
- Anonymous feedback via GitHub Issues
- Zoomable images (Glightbox)
- Content Audit — live formatting and completeness dashboard
- Systems Manifest — tool-stack transparency and project freshness
- Changelog — version history, kept current
- Interactive diagram
- Quartz 4 foundation (graph, backlinks, search, reader mode, dark mode, KaTeX, Prism.js, CLI)
- Custom branding (domain, logo, typography, social preview card)

<!-- ### Changed

### Deprecated

### Removed

### Fixed

### Security -->