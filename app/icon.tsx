import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 112,
          background:
            "linear-gradient(145deg, #2563eb, #1e40af)",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 272,
            height: 320,
            display: "flex",
            flexDirection: "column",
            gap: 48,
            borderRadius: 40,
            background: "white",
            padding: "104px 56px 48px",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -32,
              left: 64,
              width: 144,
              height: 80,
              borderRadius: 32,
              border: "24px solid white",
              background: "#0f172a",
            }}
          />
          {[0, 1, 2].map((regel) => (
            <div
              key={regel}
              style={{
                width:
                  regel === 2 ? 112 : 160,
                height: 24,
                borderRadius: 12,
                background: "#2563eb",
              }}
            />
          ))}
        </div>
      </div>
    ),
    size,
  );
}
