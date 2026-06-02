import { promises as fs } from "fs"
import { FontWeight, SatoriOptions } from "satori/wasm"
import { GlobalConfiguration } from "../cfg"
import { QuartzPluginData } from "../plugins/vfile"
import { JSXInternal } from "preact/src/jsx"
import { FontSpecification, getFontSpecificationName, ThemeKey } from "./theme"
import path from "path"
import { QUARTZ } from "./path"
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
  iconBase64,
}) => {
  const themeColors = cfg.theme.colors.darkMode
  
  const COLORS = {
    baseBg: themeColors.light ?? "#161618",
    title: themeColors.dark ?? "#ebebec",       
    accent: themeColors.secondary ?? "#7b97aa",  
    muted: themeColors.gray ?? "#646464",        
  }

  const headerFont = getFontSpecificationName(cfg.theme.typography.header)
  const bodyFont = getFontSpecificationName(cfg.theme.typography.body)

  // Dynamic typography steps
  const fontSize = 
    title.length > 80 ? 44 :
    title.length > 50 ? 54 : 
    title.length > 30 ? 76 : 
    title.length > 12 ? 92 : 110

  const lineHeight = fontSize > 70 ? 1.05 : 1.15

  const renderSvgIcon = (size: number) => (
    <svg 
      style={{ width: `${size}px`, height: `${size}px`, flexShrink: 0 }} 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 1024 1024"
    >
      <rect fill="none" x="0" y="0" width="1024" height="1024" rx="512" ry="512"/>
      <g>
        <path fill={COLORS.accent} d="M813.87,810.38c-96.25,55.57-219.33,22.59-274.9-73.66-3.11-5.38-5.94-10.85-8.49-16.38,102.5-9.32,182.8-95.5,182.8-200.43,0-30.08-6.6-58.63-18.43-84.26,75.74-6.9,152.16,29.64,192.68,99.83,55.57,96.25,22.59,219.32-73.66,274.9Z"/>
        <path fill={COLORS.accent} d="M686.29,388.16c-3.1,5.38-6.42,10.56-9.93,15.53-36.46-51.46-96.48-85.06-164.35-85.06s-127.92,33.6-164.38,85.08c-43.86-62.14-50.43-146.6-9.9-216.79,55.57-96.26,178.64-129.23,274.9-73.66,96.25,55.57,129.23,178.64,73.66,274.9Z"/>
        <path fill={COLORS.accent} d="M493.53,720.34c-2.55,5.53-5.38,11-8.49,16.38-55.57,96.25-178.65,129.23-274.9,73.66s-129.23-178.65-73.66-274.9c40.52-70.19,116.94-106.73,192.68-99.82-11.83,25.63-18.43,54.17-18.43,84.25,0,104.93,80.29,191.1,182.8,200.43Z"/>
      </g>
    </svg>
  )

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "630px",
        width: "1200px",
        backgroundColor: COLORS.baseBg,
        fontFamily: bodyFont,
        boxSizing: "border-box",
      }}
    >
      {/* ── Top zone: 61.8% (389.34px) — Title anchored to baseline ── */}
      <div
        style={{
          height: "389.34px",
          display: "flex",
          alignItems: "flex-end",
          paddingLeft: "67.2px",   // 5.6% of 1200px
          paddingRight: "67.2px",
          paddingBottom: "21.4px", // 3.4% of 630px
          boxSizing: "border-box",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontFamily: headerFont,
            fontWeight: 700,
            color: COLORS.title,
            fontSize: `${fontSize}px`,
            lineHeight: lineHeight,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h1>
      </div>

      {/* ── Bottom zone: 38.2% (240.66px) — Brand ── */}
      <div
        style={{
          height: "240.66px",
          display: "flex",
          alignItems: "flex-end",
          paddingLeft: "67.2px",
          paddingRight: "67.2px",
          paddingBottom: "35.3px", // 5.6% of 630px
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "13px" }}>
          {iconBase64 ? (
            <img
              src={iconBase64}
              width={24}
              height={24}
              style={{ borderRadius: "50%", flexShrink: 0 }}
            />
          ) : (
            renderSvgIcon(24)
          )}
          <span
            style={{
              fontSize: "16px",
              color: COLORS.muted,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            {cfg.baseUrl?.replace(/^https?:\/\//, "")?.replace(/\/$/, "") ?? ""}
          </span>
        </div>
      </div>
    </div>
  )
}