import { promises as fs } from "fs"
import { FontWeight, SatoriOptions } from "satori/wasm"
import { GlobalConfiguration } from "../cfg"
import { QuartzPluginData } from "../plugins/vfile"
import { JSXInternal } from "preact/src/jsx"
import { FontSpecification, getFontSpecificationName, ThemeKey } from "./theme"
import path from "path"
import { QUARTZ } from "./path"
import readingTime from "reading-time"
import { i18n } from "../i18n"
import { styleText } from "util"

const defaultHeaderWeight = [700]
const defaultBodyWeight = [400]

export async function getSatoriFonts(headerFont: FontSpecification, bodyFont: FontSpecification) {
  // Restored: Dynamic weight detection from your Quartz configuration
  const headerWeights: FontWeight[] = (
    typeof headerFont === "string" ? defaultHeaderWeight : (headerFont.weights ?? defaultHeaderWeight)
  ) as FontWeight[]
  const bodyWeights: FontWeight[] = (
    typeof bodyFont === "string" ? defaultBodyWeight : (bodyFont.weights ?? defaultBodyWeight)
  ) as FontWeight[]

  const headerFontName = typeof headerFont === "string" ? headerFont : headerFont.name
  const bodyFontName = typeof bodyFont === "string" ? bodyFont : bodyFont.name

  const headerFontPromises = headerWeights.map(async (weight) => {
    const data = await fetchTtf(headerFontName, weight)
    if (!data) return null
    return { name: headerFontName, data, weight, style: "normal" as const }
  })

  const bodyFontPromises = bodyWeights.map(async (weight) => {
    const data = await fetchTtf(bodyFontName, weight)
    if (!data) return null
    return { name: bodyFontName, data, weight, style: "normal" as const }
  })

  const [headerFonts, bodyFonts] = await Promise.all([
    Promise.all(headerFontPromises),
    Promise.all(bodyFontPromises),
  ])

  return [
    ...headerFonts.filter((f): f is NonNullable<typeof f> => f !== null),
    ...bodyFonts.filter((f): f is NonNullable<typeof f> => f !== null),
  ]
}

export async function fetchTtf(
  rawFontName: string,
  weight: FontWeight,
): Promise<Buffer | undefined> {
  const fontName = rawFontName.replaceAll(" ", "+")
  const cacheKey = `${fontName}-${weight}`
  const cacheDir = path.join(QUARTZ, ".quartz-cache", "fonts")
  const cachePath = path.join(cacheDir, cacheKey)

  try {
    await fs.access(cachePath)
    return fs.readFile(cachePath)
  } catch (error) {}

  const cssResponse = await fetch(`https://fonts.googleapis.com/css2?family=${fontName}:wght@${weight}`)
  const css = await cssResponse.text()
  const urlRegex = /url\((https:\/\/fonts.gstatic.com\/s\/.*?.ttf)\)/g
  const match = urlRegex.exec(css)

  if (!match) {
    console.log(styleText("yellow", `\nWarning: Failed to fetch font ${rawFontName}`))
    return
  }

  const fontResponse = await fetch(match[1])
  const fontData = Buffer.from(await fontResponse.arrayBuffer())
  await fs.mkdir(cacheDir, { recursive: true })
  await fs.writeFile(cachePath, fontData)
  return fontData
}

export type SocialImageOptions = {
  colorScheme: ThemeKey
  height: number
  width: number
  excludeRoot: boolean
  imageStructure: (
    options: ImageOptions & {
      userOpts: UserOpts
      iconBase64?: string
    },
  ) => JSXInternal.Element
}

export type UserOpts = Omit<SocialImageOptions, "imageStructure">

export type ImageOptions = {
  title: string
  description: string
  fonts: SatoriOptions["fonts"]
  cfg: GlobalConfiguration
  fileData: QuartzPluginData
}

export const defaultImage: SocialImageOptions["imageStructure"] = ({
  cfg,
  title,
  fileData,
}) => {
  const COLORS = {
    bg: "#161618",
    title: "#ebebec",
    accent: "#7b97aa", 
    muted: "#646464",
  }

  const headerFont = getFontSpecificationName(cfg.theme.typography.header)
  const bodyFont = getFontSpecificationName(cfg.theme.typography.body)

  const fontSize = title.length > 50 ? 64 : title.length > 25 ? 80 : 96

  const { minutes } = readingTime(fileData.text ?? "")
  const readingTimeText = i18n(cfg.locale).components.contentMeta.readingTime({
    minutes: Math.ceil(minutes),
  })

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        height: "100%",
        width: "100%",
        backgroundColor: COLORS.bg,
        fontFamily: bodyFont,
      }}
    >
      <div
        style={{
          width: "12px",
          height: "100%",
          backgroundColor: COLORS.accent,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          flex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: COLORS.muted,
            marginBottom: "40px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          {/* Fixed: Dynamic trailing slash removal */}
          {cfg.baseUrl?.replace("https://", "").replace(/\/$/, "")}
        </div>

        <div style={{ display: "flex", flex: 1, alignItems: "center" }}>
          <h1
            style={{
              margin: 0,
              fontSize: fontSize,
              fontFamily: headerFont,
              fontWeight: 700,
              color: COLORS.title,
              lineHeight: 1.2,
              paddingBottom: "10px",
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 3,
              overflow: "hidden",
            }}
          >
            {title}
          </h1>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: "40px",
            color: COLORS.muted,
            fontSize: 24,
            alignItems: "center",
            gap: "12px"
          }}
        >
           <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span style={{ letterSpacing: "0.05em" }}>{readingTimeText.toUpperCase()}</span>
        </div>
      </div>
    </div>
  )
}