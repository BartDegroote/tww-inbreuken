import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WebApp TWW",
    short_name: "WebApp TWW",
    description:
      "Inspecties, standaardinbreuken en professionele Word-verslaggeving.",
    start_url: "/",
    display: "standalone",
    background_color: "#f1f5f9",
    theme_color: "#1d4ed8",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
