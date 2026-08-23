import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Himal XI — Fantasy Premier League Dashboard",
    short_name: "Himal XI",
    description:
      "Track live FPL points, mini-league standings, and team stats in real time.",
    start_url: "/",
    display: "standalone",
    background_color: "#080810",
    theme_color: "#080810",
    icons: [
      {
        src: "/icon.png",
        sizes: "302x347",
        type: "image/png",
      },
    ],
  };
}
