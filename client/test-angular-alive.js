const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  await page.goto('http://localhost:4200', { waitUntil: 'networkidle0' });
  
  // check if Angular is attached to the body or app-root
  const hasNgVersion = await page.evaluate(() => {
    return !!document.querySelector('[ng-version]');
  });
  console.log('HAS NG-VERSION?', hasNgVersion);
  
  await browser.close();
})();
