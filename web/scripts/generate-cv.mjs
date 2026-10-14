/**
 * Generates the CV PDFs from the running site, so the PDF always matches the
 * design of `/cv`.
 *
 *   1. npm run dev          (in another terminal)
 *   2. npm run cv:pdf
 *
 * The script uses the Playwright Chromium (npx playwright install chromium).
 * If the host is missing browser system libraries, run it inside the
 * Playwright Docker image instead — the same approach used for E2E tests in
 * planning-poker.
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { chromium } from '@playwright/test';

const baseUrl = process.env.CV_BASE_URL ?? 'http://localhost:3000';
const outputDir = process.env.CV_OUTPUT_DIR ?? 'public/cv';

const targets = [
  { path: '/cv', file: 'bruno-oliveira-cv.pdf' },
  { path: '/pt/cv', file: 'bruno-oliveira-cv-pt.pdf' },
];

async function main() {
  await mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const target of targets) {
    await page.goto(`${baseUrl}${target.path}`, { waitUntil: 'networkidle' });
    await page.emulateMedia({ media: 'print' });

    const file = path.join(outputDir, target.file);

    await page.pdf({
      path: file,
      format: 'A4',
      printBackground: true,
      margin: { top: '12mm', bottom: '12mm', left: '10mm', right: '10mm' },
    });

    console.log(`wrote ${file}`);
  }

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
