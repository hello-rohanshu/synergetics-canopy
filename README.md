<h1 align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="quartz/static/night-icon.png">
    <img src="quartz/static/day-icon.png" alt="Synergetics Canopy Logo" width="64" height="64" />
  </picture>
  <br>
  Synergetics Canopy
</h1>

<p align="center">
  Buckminster Fuller's magnum opus <em>Synergetics</em>, rebuilt for the modern web.
</p>

---

## Background

Buckminster Fuller published his magnum opus *Synergetics* in the 1970s. In 1997, Robert Gray, working alongside E.J. Applewhite, scanned the entire text and made it freely available on the web. It has been the primary digital reference since.

Synergetics Canopy carries that lineage forward — rebuilt with today's web-tech. It brings the complete text over page by page from the [original digitization](https://rwgrayprojects.com/synergetics/synergetics.html), with supplementary editorial help from [Buckyverse.org](https://buckyverse.org). The site is built on [Quartz](https://github.com/jackyzha0/quartz/releases/tag/v4.0.8), chosen for its fervour for bidirectional linking, among many other things. See the [Systems Manifest](https://synergetics.pages.dev/systems-manifest) for the full tool stack.

The live site is at **[synergetics.pages.dev](https://synergetics.pages.dev)**.

## Features

- Buckminster Fuller's *Synergetics* in markdown
- AI chat grounded on the full text
- Paragraph-level anchors
- Anonymous feedback
- Instant search, bidirectional linking, and more from Quartz.

See the [Changelog](https://github.com/hello-rohanshu/synergetics-canopy/blob/main/CHANGELOG.md) for the full list.

## Install

Built on [Quartz v4](https://github.com/jackyzha0/quartz/tree/v4) — see the v4 branch for framework-level details (build config, plugins, deployment).

​```bash
git clone https://github.com/hello-rohanshu/synergetics-canopy.git
cd synergetics-canopy
npm install
npm run serve
​```

The site opens at `http://localhost:8080`.

To edit the content, open the `content/` folder in [Obsidian](https://obsidian.md). The markdown files are plain text and can be edited in any editor, but Obsidian is recommended — it respects the wikilinks and graph structure.

## Contributing

Report issues or suggest improvements via the feedback button on the site, or [open an issue on GitHub](https://github.com/hello-rohanshu/synergetics-canopy/issues). Pull requests are welcome.

## License

- **Quartz**: MIT — see [LICENSE](LICENSE)
- **Synergetics**: © 1975, 1979 R. Buckminster Fuller. All rights reserved. Administered by the Estate of R. Buckminster Fuller. This digital edition is derived from R. W. Gray's 1997 digitization and is published for non-commercial educational purposes only. No portion may be reproduced or used commercially without permission from the Estate.

## Acknowledgments

- [Robert W. Gray](https://rwgrayprojects.com/synergetics/synergetics.html) and team for the original 1997 digitization
- [Buckyverse.org](https://buckyverse.org) for editorial and image assistance
- [Quartz](https://quartz.jzhao.xyz/) static site builder
