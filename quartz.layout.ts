import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

const explorerConfig = {
  filterFn: (node: any) => {
    const hidden = new Set(["dummy-item"]); //add files to hide them from sidebar
    const slug = node.data?.slug ?? "";
    const name = (node.path || node.displayName || "").toLowerCase();
    const hasHideTag = node.data?.tags?.includes("hide-from-nav");
    return !hidden.has(slug) && !hidden.has(name) && !hasHideTag;
  },

  mapFn: (node: any) => {
    if (node.displayName === "Introduction - The Wellspring of Reality") {
      node.displayName = "Wellspring";
    }
    return node;
  },

  // Change names as per the above rename function if implemented
  sortFn: (a: any, b: any) => {
    const order: Record<string, number> = {
      "Foreword": 1,
      "Wellspring": 2,
      "Humans In Universe": 3,
      "Scenarios": 4,
      "100.00 Synergy": 5,
      "200.00 Synergetics": 6,
      "300.00 Universe": 7,
      "400.00 System": 8,
      "500.00 Conceptuality": 9,
      "600.00 Structure": 10,
      "700.00 Tensegrity": 11,
      "800.00 Operational Mathematics": 12,
      "900.00 Modelability": 13,
      "1000.00 Omnitopology": 14,
      "1100.00 Constant Zenith Projection": 15,
      "1200.00 Numerology": 16,
      "Afterpiece": 17,
      "Evolution of Synergetics": 18,
      "32 Color Plates": 19,
      "Book Index": 20,
      "Illustrations": 99
    };

    const aOrder = order[a.displayName] ?? 98;  // FIXED: was a.name
    const bOrder = order[b.displayName] ?? 98;  // FIXED: was b.name

    if (aOrder !== bOrder) return aOrder - bOrder;
    if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
    return 0;
  },
};

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [
    Component.ImageZoom(),
  ],
  afterBody: [
    Component.Feedback(),
    Component.ConditionalRender({
      component: Component.SynergeticsAI(),
      condition: (page) => page.fileData.slug === "synergetics-ai",
    }),
  ],
  footer: Component.Footer({
    links: {
      GitHub: "",
      "Discord Community": "",
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
    Component.ConditionalRender({
      component: Component.SystemsDashboard(),
      condition: (page) => page.fileData.slug === "systems-stack",
    }),
    Component.ConditionalRender({
      component: Component.TrendsManifest(),
      condition: (page) => page.fileData.slug === "trends-manifest",
    }),
    Component.ConditionalRender({
      component: Component.ContentAudit(),
      condition: (page) => page.fileData.slug === "content-audit",
    }),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
        { Component: Component.ReaderMode() },
        { Component: Component.AIButton() },
      ],
    }),
    Component.Explorer(explorerConfig),
  ],
  right: [
    Component.Graph(),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
        { Component: Component.ReaderMode() },
        { Component: Component.AIButton() },
      ],
    }),
    Component.Explorer(explorerConfig),
  ],
  right: [],
}
