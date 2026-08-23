import { renderOgImage } from "@/lib/og-image";

export const alt = "Himal XI — Fantasy Premier League Dashboard";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return renderOgImage();
}
