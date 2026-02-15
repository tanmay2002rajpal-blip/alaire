const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3001');
  await page.waitForTimeout(2000);
  
  // Try admin@alaire.in with Admin123!
  await page.fill('input[type="email"], input[name="email"]', 'admin@alaire.in');
  await page.fill('input[type="password"], input[name="password"]', 'Admin123!');
  await page.click('button[type="submit"], button:has-text("Sign In")');
  
  await page.waitForTimeout(4000);
  await page.screenshot({ path: '/tmp/admin_dashboard.png', fullPage: true });
  console.log('Screenshot saved');
  console.log('Current URL:', page.url());
  
  await browser.close();
})();
