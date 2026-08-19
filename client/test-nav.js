const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:4200', { waitUntil: 'networkidle0' });
  const urlBefore = page.url();
  console.log('URL BEFORE:', urlBefore);
  
  await page.click('.spotlight-cta');
  await new Promise(r => setTimeout(r, 2000));
  
  const urlAfter = page.url();
  console.log('URL AFTER:', urlAfter);
  
  await browser.close();
})();
