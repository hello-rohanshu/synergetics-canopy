export const defaultImage: SocialImageOptions["imageStructure"] = ({
  cfg,
  title,
  fileData,
  iconBase64,
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
        flexDirection: "column",
        height: "100%",
        width: "100%",
        backgroundColor: COLORS.bg,
        fontFamily: bodyFont,
      }}
    >
      {/* Top Accent Line */}
      <div
        style={{
          width: "100%",
          height: "8px",
          backgroundColor: COLORS.accent,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          paddingTop: "72px",
          flex: 1,
        }}
      >
        {/* Branding Row with Custom SVG Icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "40px",
          }}
        >
          {iconBase64 ? (
            <img
              src={iconBase64}
              width={32}
              height={32}
              style={{ borderRadius: "50%" }}
            />
          ) : (
            <svg
              id="Layer_2"
              data-name="Layer 2"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 1024 1024"
              width={32}
              height={32}
            >
              <g id="Guides">
                <g>
                  <rect fill="none" strokeWidth={0} x="0" y="0" width="1024" height="1024" rx="512" ry="512"/>
                  <g>
                    <path fill={COLORS.accent} strokeWidth={0} d="M813.87,810.38c-96.25,55.57-219.33,22.59-274.9-73.66-3.11-5.38-5.94-10.85-8.49-16.38,102.5-9.32,182.8-95.5,182.8-200.43,0-30.08-6.6-58.63-18.43-84.26,75.74-6.9,152.16,29.64,192.68,99.83,55.57,96.25,22.59,219.32-73.66,274.9Z"/>
                    <path fill={COLORS.accent} strokeWidth={0} d="M686.29,388.16c-3.1,5.38-6.42,10.56-9.93,15.53-36.46-51.46-96.48-85.06-164.35-85.06s-127.92,33.6-164.38,85.08c-43.86-62.14-50.43-146.6-9.9-216.79,55.57-96.26,178.64-129.23,274.9-73.66,96.25,55.57,129.23,178.64,73.66,274.9Z"/>
                    <path fill={COLORS.accent} strokeWidth={0} d="M493.53,720.34c-2.55,5.53-5.38,11-8.49,16.38-55.57,96.25-178.65,129.23-274.9,73.66s-129.23-178.65-73.66-274.9c40.52-70.19,116.94-106.73,192.68-99.82-11.83,25.63-18.43,54.17-18.43,84.25,0,104.93,80.29,191.1,182.8,200.43Z"/>
                  </g>
                </g>
              </g>
            </svg>
          )}
          <div
            style={{
              display: "flex",
              fontSize: 28,
              color: COLORS.muted,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            {cfg.baseUrl?.replace("https://", "").replace(/\/$/, "")}
          </div>
        </div>

        {/* Title Block */}
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

        {/* Metadata Block */}
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