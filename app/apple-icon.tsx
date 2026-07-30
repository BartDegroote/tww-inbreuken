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
            width: 92,
            height: 108,
            display: "flex",
            flexDirection: "column",
            gap: 15,
            borderRadius: 14,
            background: "white",
            padding: "34px 19px 16px",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -9,
              left: 22,
              width: 48,
              height: 27,
              borderRadius: 10,
              border: "8px solid white",
              background: "#0f172a",
            }}
          />
          {[0, 1, 2].map((regel) => (
            <div
              key={regel}
              style={{
                width:
                  regel === 2 ? 38 : 54,
                height: 8,
                borderRadius: 4,
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
