import type { WebDeck } from "@/types/deck";
import { exportStaticHtml } from "@/lib/export/exportStaticHtml";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export type PdfExportOptions = {
  format?: "A4" | "16:9";
};

/**
 * Render a WebDeck to a PDF Buffer using Puppeteer.
 *
 * The flow is:
 *  1. Generate a self-contained static HTML string (same as HTML export).
 *  2. Launch Puppeteer, load the HTML via data URL.
 *  3. Wait for rendering to complete, then call page.pdf().
 *
 * Options:
 *  - format: "A4" (default, portrait) or "16:9" (landscape widescreen).
 */
export async function exportPdf(
  deck: WebDeck,
  options: PdfExportOptions = {},
): Promise<Buffer> {
  const { format = "A4" } = options;

  // Dynamically import Puppeteer — keeps it out of client bundles and avoids
  // issues when running in environments that don't have Chromium available.
  const puppeteer = await import("puppeteer");

  const html = exportStaticHtml(deck, {
    description: deck.subtitle,
  });

  // Convert to a data URL so Puppeteer can load it without a running server
  const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;

  const browser = await puppeteer.default.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    // Set viewport to match target format
    if (format === "16:9") {
      await page.setViewport({ width: 1920, height: 1080 });
    } else {
      await page.setViewport({ width: 1200, height: 1600 });
    }

    await page.goto(dataUrl, { waitUntil: "networkidle0", timeout: 30000 });

    // Wait a bit for fonts and animations
    await page.evaluate(() => new Promise((r) => setTimeout(r, 500)));

    const pdfOptions: Record<string, unknown> = {
      printBackground: true,
      preferCSSPageSize: false,
    };

    if (format === "16:9") {
      pdfOptions.landscape = true;
      pdfOptions.width = "1920px";
      pdfOptions.height = "1080px";
    } else {
      pdfOptions.format = "A4";
    }

    const pdfBuffer = await page.pdf(pdfOptions);
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
