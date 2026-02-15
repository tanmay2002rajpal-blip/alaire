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
  
  // Blog posts page
  await page.goto('http://localhost:3001/content/blog');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: '/tmp/blog_improved.png', fullPage: true });
  console.log('Captured: blog improved');
  
  // Blog editor (new post)
  await page.goto('http://localhost:3001/content/blog/new');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/blog_editor.png', fullPage: true });
  console.log('Captured: blog editor');
  
  // Sales reports
  await page.goto('http://localhost:3001/analytics/sales');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: '/tmp/sales_improved.png', fullPage: true });
  console.log('Captured: sales improved');
  
  await browser.close();
  console.log('Done!');
})();
