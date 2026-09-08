import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Encore",
    short_name: "Encore",
    description: "Discover events, buy tickets in seconds, and sell your own with real-time sales and check-in.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
