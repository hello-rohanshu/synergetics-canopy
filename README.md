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

Buckminster Fuller published *Synergetics* in the 1970s. In 1997, R. W. Gray scanned the text and made it freely available online. His site, Synergetics Online, has been the primary digital reference since.

Synergetics Canopy carries that lineage forward into 2026. The complete text was brought over page by page from Gray's digitization, with additional editorial help from [Buckyverse.org](https://buckyverse.org). The site is built on [Quartz](https://github.com/jackyzha0/quartz/releases/tag/v4.0.8), chosen for its fervour for bidirectional linking, among many other things. See the [Systems Manifest](/systems-manifest) for the full tool stack.

The live site is at **[synergetics.pages.dev](https://synergetics.pages.dev)**.

## Features

- The text of Bucky's *Synergetics* in markdown
- AI trained on the text
- Paragraph-level anchors
- Anonymous feedback
- Quartz 4: instant search, bidirectional linking, and more.

See the [Changelog](/changelog) for a full list.

## Install

```bash
git clone https://github.com/hello-rohanshu/synergetics-canopy.git
cd synergetics-canopy
npm install
npm run serve
```

The site opens at `http://localhost:8080`.

To edit the content, open the `content/` folder in [Obsidian](https://obsidian.md). The markdown files are plain text and can be edited in any editor, but Obsidian is recommended — it respects the wikilinks and graph structure.

## Contributing

Report issues or suggest improvements via the feedback button on the site, or [open an issue on GitHub](https://github.com/hello-rohanshu/synergetics-canopy/issues). Pull requests welcome.

## License

- **Quartz**: MIT — see [LICENSE](LICENSE)
- **Synergetics**: © 1975, 1979 R. Buckminster Fuller. All rights reserved. Administered by the Estate of R. Buckminster Fuller. This digital edition is derived from R. W. Gray's 1997 digitization and is published for non-commercial educational purposes only. No portion may be reproduced or used commercially without permission from the Estate.

## Acknowledgments

- [R. W. Gray](https://rwgrayprojects.com/synergetics/synergetics.html) for the original 1997 digitization
- [Buckyverse.org](https://buckyverse.org) for editorial and image assistance
- [Quartz](https://quartz.jzhao.xyz/) static site builder
