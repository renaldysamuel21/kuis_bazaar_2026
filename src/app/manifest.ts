import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kuis Bazaar Sekolah Minggu 2026",
    short_name: "Kuis Bazaar",
    description: "Tebak Tokoh Alkitab dan permainan Benar atau Salah.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#fce5ed",
    theme_color: "#f8b8ce",
    lang: "id-ID",
    categories: ["education", "games", "kids"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
