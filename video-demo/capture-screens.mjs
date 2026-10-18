import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, 'public', 'screenshots');
fs.mkdirSync(outDir, { recursive: true });

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function capture() {
  console.log('Launching Chrome for product capture...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
  });

  const page = await browser.newPage();
  // Set high pixel ratio for crisp 1080p rendering inside Remotion frames
  await page.setViewport({ width: 420, height: 860, deviceScaleFactor: 2.5 });

  // 1. Visit Login Page & authenticate as AWW Hansaben
  console.log('Navigating to login...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
  await sleep(1000);

  // Click direct quick login or demo login
  console.log('Logging in as Frontline Worker (Hansaben Patel)...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('આંગણવાડી કાર્યકર તરીકે સીધા પ્રવેશ કરો') ||
      b.textContent?.includes('Hansaben')
    );
    if (btn) btn.click();
  });
  await sleep(1500);

  // 2. Capture Dashboard
  console.log('Capturing Mobile Dashboard...');
  await page.screenshot({
    path: path.join(outDir, '01-dashboard.png'),
    clip: { x: 0, y: 0, width: 420, height: 860 },
  });

  // 3. Capture Receive Stock Page
  console.log('Navigating to Receive Stock...');
  await page.goto(`${BASE_URL}/receive-stock`, { waitUntil: 'networkidle2' });
  await sleep(1500);
  await page.screenshot({
    path: path.join(outDir, '02-receive-stock-list.png'),
    clip: { x: 0, y: 0, width: 420, height: 860 },
  });

  // Click on the first dispatch or "જથ્થો સ્વીકારો"
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('જથ્થો સ્વીકારો') ||
      b.textContent?.includes('સ્વીકારો') ||
      b.textContent?.includes('ચકાસો')
    );
    if (btn) btn.click();
  });
  await sleep(1000);
  await page.screenshot({
    path: path.join(outDir, '03-receive-stock-dialog.png'),
    clip: { x: 0, y: 0, width: 420, height: 860 },
  });

  // 4. Capture Stock Ledger Page
  console.log('Navigating to Stock Ledger...');
  await page.goto(`${BASE_URL}/ledger`, { waitUntil: 'networkidle2' });
  await sleep(1500);
  await page.screenshot({
    path: path.join(outDir, '04-stock-ledger.png'),
    clip: { x: 0, y: 0, width: 420, height: 860 },
  });

  // 5. Capture Stock Balance Page
  console.log('Navigating to Stock Balance Overview...');
  await page.goto(`${BASE_URL}/stock`, { waitUntil: 'networkidle2' });
  await sleep(1500);
  await page.screenshot({
    path: path.join(outDir, '05-stock-balance.png'),
    clip: { x: 0, y: 0, width: 420, height: 860 },
  });

  // 6. Capture Sync Centre (Offline / Sync Status)
  console.log('Navigating to Sync Centre...');
  await page.goto(`${BASE_URL}/sync-centre`, { waitUntil: 'networkidle2' });
  await sleep(1500);
  await page.screenshot({
    path: path.join(outDir, '06-sync-centre.png'),
    clip: { x: 0, y: 0, width: 420, height: 860 },
  });

  // 7. Switch to Supervisor Rekhaben & capture Discrepancies
  console.log('Switching to Supervisor (Rekhaben Varma)...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
  await sleep(1000);
  await page.evaluate(() => {
    // Click supervisor demo account
    const supBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('સુપરવાઇઝર') || b.textContent?.includes('Rekhaben')
    );
    if (supBtn) supBtn.click();
  });
  await sleep(1500);

  // Navigate to Discrepancies
  console.log('Capturing Supervisor Discrepancies...');
  await page.goto(`${BASE_URL}/discrepancies`, { waitUntil: 'networkidle2' });
  await sleep(1500);
  await page.screenshot({
    path: path.join(outDir, '07-discrepancies.png'),
    clip: { x: 0, y: 0, width: 420, height: 860 },
  });

  // 8. Capture Reports / MPR Page
  console.log('Capturing Reports & MPR...');
  await page.goto(`${BASE_URL}/reports`, { waitUntil: 'networkidle2' });
  await sleep(1500);
  await page.screenshot({
    path: path.join(outDir, '08-reports-mpr.png'),
    clip: { x: 0, y: 0, width: 420, height: 860 },
  });

  // 9. Also capture wide desktop / tablet view for overview scenes
  await page.setViewport({ width: 1200, height: 750, deviceScaleFactor: 2 });
  await page.goto(`${BASE_URL}/discrepancies`, { waitUntil: 'networkidle2' });
  await sleep(1200);
  await page.screenshot({
    path: path.join(outDir, '09-supervisor-desktop.png'),
  });

  await browser.close();
  console.log('All real application screenshots successfully captured!');
}

capture().catch((err) => {
  console.error('Capture error:', err);
  process.exit(1);
});
