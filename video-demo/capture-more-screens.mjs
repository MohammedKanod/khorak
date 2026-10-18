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

async function captureMore() {
  console.log('Launching Chrome to capture Distribution and Aadhaar workflows...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 420, height: 860, deviceScaleFactor: 2.5 });

  // 1. Login as Hansaben
  console.log('Logging in...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
  await sleep(800);
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('આંગણવાડી કાર્યકર તરીકે સીધા પ્રવેશ કરો') ||
      b.textContent?.includes('Hansaben')
    );
    if (btn) btn.click();
  });
  await sleep(1200);

  // 2. Navigate to THR Distribution Page
  console.log('Navigating to /thr-distribution...');
  await page.goto(`${BASE_URL}/thr-distribution`, { waitUntil: 'networkidle2' });
  await sleep(1500);

  await page.screenshot({
    path: path.join(outDir, '10-thr-roster.png'),
    clip: { x: 0, y: 0, width: 420, height: 860 },
  });

  // 3. Open Aadhaar Barcode Scanner Modal
  console.log('Opening Aadhaar QR Scanner...');
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Aadhaar Barcode Scan') ||
      b.textContent?.includes('QR')
    );
    if (btn) btn.click();
  });
  await sleep(1000);

  await page.screenshot({
    path: path.join(outDir, '11-aadhaar-scanner-modal.png'),
    clip: { x: 0, y: 0, width: 420, height: 860 },
  });

  // Close scanner modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector('button[title="બંધ કરો"]') ||
      Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('બંધ') || b.querySelector('svg'));
    if (closeBtn) closeBtn.click();
  });
  await sleep(600);

  // 4. Open Continuous Loop Scanner
  console.log('Opening Continuous Loop Scanner...');
  await page.evaluate(() => {
    const loopBtn = Array.from(document.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('સતત વિતરણ લૂપ') ||
      b.textContent?.includes('લૂપ')
    );
    if (loopBtn) loopBtn.click();
  });
  await sleep(1200);

  await page.screenshot({
    path: path.join(outDir, '12-continuous-loop-modal.png'),
    clip: { x: 0, y: 0, width: 420, height: 860 },
  });

  // 5. Click a sample Aadhaar card to trigger Instant Handover Confirmation
  console.log('Selecting sample Aadhaar card in continuous loop...');
  await page.evaluate(() => {
    const sampleBtns = Array.from(document.querySelectorAll('button')).filter(b =>
      b.textContent?.includes('Aarav') ||
      b.textContent?.includes('Meenaben') ||
      b.textContent?.includes('Diya')
    );
    if (sampleBtns.length > 0) {
      sampleBtns[0].click();
    }
  });
  await sleep(1000);

  await page.screenshot({
    path: path.join(outDir, '13-handover-confirmation.png'),
    clip: { x: 0, y: 0, width: 420, height: 860 },
  });

  // 6. Navigate to Spoilage / Write-off Page
  console.log('Navigating to /write-off...');
  await page.goto(`${BASE_URL}/write-off`, { waitUntil: 'networkidle2' });
  await sleep(1500);

  await page.screenshot({
    path: path.join(outDir, '14-spoilage-reporting.png'),
    clip: { x: 0, y: 0, width: 420, height: 860 },
  });

  // 7. Login as Supervisor and visit Sector Heatmap
  console.log('Logging in as Supervisor for Heatmap...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
  await sleep(800);
  await page.evaluate(() => {
    const supBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('સુપરવાઇઝર') || b.textContent?.includes('Rekhaben')
    );
    if (supBtn) supBtn.click();
  });
  await sleep(1200);

  console.log('Navigating to /heatmap...');
  await page.goto(`${BASE_URL}/heatmap`, { waitUntil: 'networkidle2' });
  await sleep(1500);

  await page.screenshot({
    path: path.join(outDir, '15-sector-heatmap.png'),
    clip: { x: 0, y: 0, width: 420, height: 860 },
  });

  await browser.close();
  console.log('All additional screenshots captured successfully!');
}

captureMore().catch((err) => {
  console.error('Error in captureMore:', err);
  process.exit(1);
});
