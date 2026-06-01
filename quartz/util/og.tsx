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
  iconBase64,
}) => {
  const themeColors = cfg.theme.colors.darkMode
  
  const COLORS = {
    baseBg: themeColors.light,
    bgGradient: "linear-gradient(135deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.45) 100%)",
    title: themeColors.dark,       
    accent: themeColors.secondary,  
    muted: themeColors.gray,        
    pillBg: themeColors.highlight,  
  }

  const headerFont = getFontSpecificationName(cfg.theme.typography.header)
  const bodyFont = getFontSpecificationName(cfg.theme.typography.body)

  const fontSize = 
    title.length > 80 ? 44 :
    title.length > 50 ? 54 : 
    title.length > 30 ? 76 : 
    title.length > 12 ? 92 : 110

  const lineHeight = fontSize > 70 ? 1.1 : 1.2

  const { minutes } = readingTime(fileData.text ?? "")
  const readingTimeText = i18n(cfg.locale).components.contentMeta.readingTime({
    minutes: Math.ceil(minutes),
  })

  const renderSvgIcon = (size: number) => (
    <svg
      id="Layer_2"
      data-name="Layer 2"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1024 1024"
      width={size}
      height={size}
    >
      <g id="Guides">
        <g>
          <rect fill="none" x="0" y="0" width="1024" height="1024" rx="512" ry="512"/>
          <g>
            <path fill={COLORS.accent} d="M813.87,810.38c-96.25,55.57-219.33,22.59-274.9-73.66-3.11-5.38-5.94-10.85-8.49-16.38,102.5-9.32,182.8-95.5,182.8-200.43,0-30.08-6.6-58.63-18.43-84.26,75.74-6.9,152.16,29.64,192.68,99.83,55.57,96.25,22.59,219.32-73.66,274.9Z"/>
            <path fill={COLORS.accent} d="M686.29,388.16c-3.1,5.38-6.42,10.56-9.93,15.53-36.46-51.46-96.48-85.06-164.35-85.06s-127.92,33.6-164.38,85.08c-43.86-62.14-50.43-146.6-9.9-216.79,55.57-96.26,178.64-129.23,274.9-73.66,96.25,55.57,129.23,178.64,73.66,274.9Z"/>
            <path fill={COLORS.accent} d="M493.53,720.34c-2.55,5.53-5.38,11-8.49,16.38-55.57,96.25-178.65,129.23-274.9,73.66s-129.23-178.65-73.66-274.9c40.52-70.19,116.94-106.73,192.68-99.82-11.83,25.63-18.43,54.17-18.43,84.25,0,104.93,80.29,191.1,182.8,200.43Z"/>
          </g>
        </g>
      </g>
    </svg>
  )

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        backgroundColor: COLORS.baseBg,
        backgroundImage: COLORS.bgGradient,
        fontFamily: bodyFont,
        position: "relative",
        overflow: "hidden",
        padding: "100px 90px",
      }}
    >
      {/* Background Watermark */}
      <div
        style={{
          position: "absolute",
          right: "-80px",
          bottom: "-100px",
          opacity: 0.05,
          display: "flex",
        }}
      >
        {renderSvgIcon(640)}
      </div>

      {/* Header Row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          zIndex: 2,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {iconBase64 ? (
            <img
              src={iconBase64}
              width={36}
              height={36}
              style={{ borderRadius: "50%" }}
            />
          ) : (
            renderSvgIcon(36)
          )}
          <div
            style={{
              fontSize: 22,
              color: COLORS.muted,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              fontWeight: 500,
            }}
          >
            {cfg.baseUrl?.replace(/^https?:\/\//, "")?.replace(/\/$/, "") ?? ""}
          </div>
        </div>

        {/* Pill Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: COLORS.pillBg,
            padding: "8px 16px",
            borderRadius: "30px",
          }}
        >
          <span
            style={{
              fontSize: 16,
              color: COLORS.accent,
              letterSpacing: "0.08em",
              fontWeight: 600,
            }}
          >
            {readingTimeText.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Editorial Title Block */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center", 
          width: "100%",
          flex: 1,
          marginTop: "40px",
          zIndex: 2,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: `${fontSize}px`,
            fontFamily: headerFont,
            fontWeight: 700,
            color: COLORS.title,
            lineHeight: lineHeight,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h1>
      </div>
    </div>
  )
}