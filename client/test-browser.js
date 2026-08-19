const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  await page.goto('http://localhost:4200', { waitUntil: 'networkidle0' });
  await page.click('.spotlight-cta').catch(e => console.log('CLICK ERROR:', e.message));
  await new Promise(r => setTimeout(r, 1000));
  await browser.close();
})();
