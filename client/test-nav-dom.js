const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:4200', { waitUntil: 'networkidle0' });
  await page.click('.spotlight-cta');
  await new Promise(r => setTimeout(r, 2000));
  
  const text = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log('DOM TEXT AFTER NAV:\n', text);
  
  await browser.close();
})();
