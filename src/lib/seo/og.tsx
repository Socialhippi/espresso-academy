/**
 * Shared Open Graph card. One layout for every route type: white ground, red rule, Bebas title,
 * the lockup bottom-left. No photography, because none has been supplied and an AI-generated
 * image is forbidden (CLAUDE.md non-negotiable 8).
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const FONT_DIR = join(process.cwd(), "src", "lib", "seo", "fonts");

async function loadFonts() {
  const [bebas, montserrat500, montserrat400] = await Promise.all([
    readFile(join(FONT_DIR, "bebas-neue-400.woff")),
    readFile(join(FONT_DIR, "montserrat-500.woff")),
    readFile(join(FONT_DIR, "montserrat-400.woff")),
  ]);
  return [
    { name: "Bebas Neue", data: bebas, weight: 400 as const, style: "normal" as const },
    { name: "Montserrat", data: montserrat500, weight: 500 as const, style: "normal" as const },
    { name: "Montserrat", data: montserrat400, weight: 400 as const, style: "normal" as const },
  ];
}

async function loadMark(): Promise<string> {
  const file = await readFile(join(process.cwd(), "public", "logo", "mark.png"));
  return `data:image/png;base64,${file.toString("base64")}`;
}

interface OgCardInput {
  /** Small red uppercase label above the title, e.g. "Course" or "Trainer". */
  eyebrow: string;
  /** The Bebas headline. Long titles wrap; keep it under about 60 characters. */
  title: string;
  /** One supporting line under the rule. */
  subtitle?: string;
}

export async function ogCard({ eyebrow, title, subtitle }: OgCardInput): Promise<ImageResponse> {
  const [fonts, mark] = await Promise.all([loadFonts(), loadMark()]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#FEFCFF",
          padding: "72px 80px",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Montserrat",
              fontWeight: 500,
              fontSize: 24,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#B20003",
            }}
          >
            {eyebrow}
          </div>
          <div style={{ display: "flex", width: 96, height: 4, backgroundColor: "#B20003", marginTop: 20 }} />
          <div
            style={{
              display: "flex",
              fontFamily: "Bebas Neue",
              fontSize: title.length > 42 ? 84 : 104,
              lineHeight: 1,
              letterSpacing: "0.01em",
              textTransform: "uppercase",
              color: "#171717",
              marginTop: 36,
              maxWidth: 900,
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                display: "flex",
                fontFamily: "Montserrat",
                fontWeight: 400,
                fontSize: 28,
                lineHeight: 1.5,
                color: "#6B6B6B",
                marginTop: 28,
                maxWidth: 820,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mark} width={54} height={79} alt="" />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginLeft: 20,
                fontFamily: "Montserrat",
              }}
            >
              <div style={{ display: "flex", fontWeight: 500, fontSize: 26, color: "#171717" }}>
                Espresso Academy India
              </div>
              <div style={{ display: "flex", fontWeight: 400, fontSize: 20, color: "#6B6B6B" }}>
                Official Partner of Espresso Academy, Florence
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "Montserrat",
              fontWeight: 500,
              fontSize: 20,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#6B6B6B",
            }}
          >
            Bengaluru
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  );
}
