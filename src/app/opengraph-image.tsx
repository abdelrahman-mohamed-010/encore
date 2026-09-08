import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const iconData = await readFile(join(process.cwd(), "src/assets/brand/ticket-icon.png"));
  const iconSrc = `data:image/png;base64,${iconData.toString("base64")}`;

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
          gap: 28,
          background: "linear-gradient(135deg, #fafafa 0%, #ececf3 100%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={iconSrc} width={140} height={140} alt="" />
        <div
          style={{
            fontSize: 84,
            fontWeight: 700,
            letterSpacing: -3,
            color: "#18181b",
          }}
        >
          Encore
        </div>
        <div style={{ fontSize: 30, color: "#52525b" }}>
          Discover events. Sell tickets.
        </div>
      </div>
    ),
    { ...size },
  );
}
