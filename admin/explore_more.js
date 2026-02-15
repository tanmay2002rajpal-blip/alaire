const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('http://localhost:3001');
  await page.waitForTimeout(1500);
  await page.fill('input[type="email"]', 'admin@alaire.in');
  await page.fill('input[type="password"]', 'Admin123!');
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(3000);
  
  const pages = [
    { name: 'blog', url: '/content/blog' },
    { name: 'hero', url: '/content/hero' },
    { name: 'promotions', url: '/content/promotions' },
  ];
  
  for (const p of pages) {
    await page.goto('http://localhost:3001' + p.url);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `/tmp/admin_${p.name}.png`, fullPage: true });
    console.log(`Captured: ${p.name}`);
  }
  
  await browser.close();
  console.log('Done!');
})();
