import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Shared Space",
    short_name: "Shared Space",
    description: "A private space for notes, journals, and reminders.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f1e8",
    theme_color: "#c45c3e",
    orientation: "portrait",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
