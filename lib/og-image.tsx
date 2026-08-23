import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function renderOgImage() {
  const logoData = await readFile(
    join(process.cwd(), "app/app-logo-dark.png")
  );
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #080810 0%, #37003c 100%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={560} height={148} alt="" />
        <div
          style={{
            marginTop: 40,
            fontSize: 28,
            color: "#00d68f",
            fontWeight: 600,
            letterSpacing: 1,
          }}
        >
          Live FPL Points · League Standings · Team Stats
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
