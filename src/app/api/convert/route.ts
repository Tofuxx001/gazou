import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";

export const runtime = "nodejs"; // ← 追加！

export async function POST(req: NextRequest) {
  const { html, width, height } = await req.json();

  if (!html || !width || !height) {
    return new NextResponse("Missing parameters", { status: 400 });
  }

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height });

    await page.setContent(`
      <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              background: transparent;
            }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `);

    const element = await page.$("#myCanvas");
    if (!element) throw new Error("myCanvas not found");

    const screenshotBuffer = await element.screenshot({ type: "png" });

    return new NextResponse(screenshotBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": 'attachment; filename="card.png"',
      },
    });
  } catch (err) {
    console.error("❌ Puppeteerエラー:", err);
    return new NextResponse(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500 }
    );
  } finally {
    await browser.close();
  }
}
