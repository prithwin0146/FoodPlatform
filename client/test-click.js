const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  let clicked = false;
  page.on('console', msg => {
    if (msg.text() === 'NAVIGATING') clicked = true;
    console.log('BROWSER CONSOLE:', msg.text());
  });
  await page.goto('http://localhost:4200', { waitUntil: 'networkidle0' });
  await page.click('.spotlight-cta').catch(e => console.log('CLICK ERROR:', e.message));
  await new Promise(r => setTimeout(r, 1000));
  console.log('WAS CLICK HANDLED?', clicked);
  
  // also check other buttons
  await page.click('.cta-primary').catch(e => console.log('CLICK ERROR 2:', e.message));
  await new Promise(r => setTimeout(r, 1000));

  await browser.close();
})();
