import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "synergetics",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
      provider: "plausible",
    },
    locale: "en-US",
    baseUrl: "synergetics.pages.dev",
    ignorePatterns: ["private", "templates", ".obsidian", "_site/**"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "local",
      cdnCaching: false,
      typography: {
        title: "Ubuntu Sans", //need to edit this in Head.tsx and Custom.scss too for it to work for weights other than 400 or whatever is default for the font. Weight fetch is controlled in Head.tsx while applying it is controlled in Custom.scss

        // For items other than title, you can edit weights by first adding them as array like body: {name: "Inter", weight: "900"} which will fetch 900. Then you apply it via targetting html elements in sustom.scss.
        header: "Literata",
        body: { name: "Inter" },
        code: "JetBrains Mono",
      },
      //Vollkorn, Bebas Neue, Bebas Neue

      colors: {
        lightMode: {
          light: "#FFF8E7",       // Cosmic Latte
          lightgray: "#EBE3D5",   // Soft, warm gray for subtle backgrounds/borders
          gray: "#8C847A",        // Natural stone gray for meta text
          darkgray: "#4A443F",    // Deep bark brown for highly readable body text
          dark: "#2C2825",        // Near-black espresso for strong headings
          secondary: "#44633a",   // Synergetic botanical green for links
          tertiary: "#a8a24c",    // Earthy green-yellow hover
          highlight: "rgba(58, 99, 81, 0.12)",
          textHighlight: "#F4D35E88",
        },
        darkMode: {
          light: "#1A1918",       // Deep warm void
          lightgray: "#36312D",
          gray: "#8C847A",
          darkgray: "#D4CFC9",    // Soft ash for readable dark mode text
          dark: "#FFF8E7",        // Cosmic Latte as the heading text!
          secondary: "#768E65",   // Calmed down to a dusty, muted moss green
          tertiary: "#C4BD83",    // Calmed down to a faint, pale linen/straw yellow
          highlight: "rgba(118, 142, 101, 0.12)", // Updated to match the calmer green
          textHighlight: "#D4A37388",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.BuildStats(),
      Plugin.HardLineBreaks(),
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Comment out CustomOgImages to speed up build time
      // Plugin.CustomOgImages(),
    ],
  },
}

export default config
