import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 40,
          background:
            "linear-gradient(145deg, #2563eb, #1e40af)",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 118,
            height: 140,
            display: "flex",
            flexDirection: "column",
            gap: 18,
            borderRadius: 18,
            background: "white",
            padding: "44px 24px 20px",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -10,
              left: 27,
              width: 64,
              height: 36,
              borderRadius: 12,
              border: "10px solid white",
              background: "#0f172a",
            }}
          />
          {[0, 1, 2].map((regel) => (
            <div
              key={regel}
              style={{
                width:
                  regel === 2 ? 48 : 70,
                height: 10,
                borderRadius: 5,
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
