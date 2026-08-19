const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  
  await page.goto('http://localhost:4200', { waitUntil: 'networkidle0' });
  
  // Attach a global click listener to log the target
  await page.evaluate(() => {
    window.addEventListener('click', e => {
      console.log('GLOBAL CLICK CAUGHT! Target class:', e.target.className, 'Target tag:', e.target.tagName);
    }, true);
  });
  
  await page.click('.spotlight-cta').catch(e => console.log('CLICK ERROR:', e.message));
  await new Promise(r => setTimeout(r, 1000));
  
  await browser.close();
})();
