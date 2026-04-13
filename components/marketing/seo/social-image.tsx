export const socialImageSize = {
  width: 1200,
  height: 630,
} as const

export const twitterImageSize = {
  width: 1200,
  height: 600,
} as const

export function CalendarCnSocialImage({
  compact = false,
}: {
  compact?: boolean
}) {
  const headingSize = compact ? 60 : 66
  const bodySize = compact ? 27 : 30

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        width: "100%",
        background:
          "linear-gradient(135deg, #f8fafc 0%, #eef6ff 44%, #f6f3ff 100%)",
        color: "#0f172a",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 16% 18%, rgba(59,130,246,0.18), transparent 24%), radial-gradient(circle at 84% 14%, rgba(99,102,241,0.14), transparent 22%), radial-gradient(circle at 52% 100%, rgba(15,23,42,0.08), transparent 40%)",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: 28,
          height: "100%",
          width: "100%",
          padding: compact ? "48px 56px" : "56px 64px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                display: "flex",
                height: 58,
                width: 58,
                borderRadius: 18,
                background:
                  "linear-gradient(160deg, #0f172a 0%, #1d4ed8 72%, #60a5fa 100%)",
                boxShadow: "0 18px 44px rgba(15, 23, 42, 0.18)",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: "#475569",
                }}
              >
                CalendarCN
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 600,
                  color: "#0f172a",
                }}
              >
                Open-source scheduling primitives
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              border: "1px solid rgba(148, 163, 184, 0.45)",
              borderRadius: 999,
              background: "rgba(255, 255, 255, 0.72)",
              padding: "10px 18px",
              fontSize: 19,
              fontWeight: 600,
              color: "#334155",
            }}
          >
            shadcn/ui + Next.js
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 22,
            maxWidth: 920,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              alignSelf: "flex-start",
              borderRadius: 999,
              background: "rgba(15, 23, 42, 0.92)",
              color: "#f8fafc",
              fontSize: 20,
              fontWeight: 600,
              padding: "10px 18px",
            }}
          >
            Installable source, not a black-box widget
          </div>

          <div
            style={{
              display: "flex",
              fontSize: headingSize,
              fontWeight: 700,
              letterSpacing: "-0.05em",
              lineHeight: 1.02,
              maxWidth: 950,
            }}
          >
            Scheduling primitives for shadcn apps that need real interaction.
          </div>

          <div
            style={{
              display: "flex",
              fontSize: bodySize,
              lineHeight: 1.35,
              color: "#334155",
              maxWidth: 860,
            }}
          >
            Month, week, day, agenda, drag and drop, resize, recurrence,
            resources, and typed callbacks for product teams embedding
            scheduling into React and Next.js apps.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 20,
          }}
        >
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {[
              "Month / week / day / agenda",
              "Drag + resize",
              "Recurring events",
              "Resource lanes",
            ].map((item) => (
              <div
                key={item}
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid rgba(148, 163, 184, 0.45)",
                  borderRadius: 999,
                  background: "rgba(255, 255, 255, 0.72)",
                  color: "#334155",
                  fontSize: 18,
                  fontWeight: 600,
                  padding: "10px 16px",
                }}
              >
                {item}
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 20,
              fontWeight: 600,
              color: "#475569",
            }}
          >
            calendarcn.phantomtechind.com
          </div>
        </div>
      </div>
    </div>
  )
}
