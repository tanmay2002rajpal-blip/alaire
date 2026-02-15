const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3001');
  await page.waitForTimeout(1500);
  await page.fill('input[type="email"]', 'admin@alaire.in');
  await page.fill('input[type="password"]', 'Admin123!');
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(3000);
  
  // Screenshot new sidebar
  await page.screenshot({ path: '/tmp/new_sidebar.png', fullPage: true });
  console.log('Captured: new sidebar');
  
  // Check Sales Reports
  await page.goto('http://localhost:3001/analytics/sales');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/sales_reports.png', fullPage: true });
  console.log('Captured: sales reports');
  console.log('URL:', page.url());
  
  await browser.close();
})();
