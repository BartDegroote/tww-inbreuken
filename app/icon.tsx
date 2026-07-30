import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
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
          borderRadius: 15,
          background:
            "linear-gradient(145deg, #2563eb, #1e40af)",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 34,
            height: 40,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            borderRadius: 5,
            background: "white",
            padding: "13px 7px 6px",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -4,
              left: 8,
              width: 18,
              height: 10,
              borderRadius: 4,
              border: "3px solid white",
              background: "#0f172a",
            }}
          />
          {[0, 1, 2].map((regel) => (
            <div
              key={regel}
              style={{
                width:
                  regel === 2 ? 14 : 20,
                height: 3,
                borderRadius: 2,
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
