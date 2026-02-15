const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Login
  await page.goto('http://localhost:3001');
  await page.waitForTimeout(1500);
  await page.fill('input[type="email"]', 'admin@alaire.in');
  await page.fill('input[type="password"]', 'Admin123!');
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(3000);
  
  // Correct routes based on folder structure
  const pages = [
    { name: 'orders', url: '/orders' },
    { name: 'products', url: '/products' },
    { name: 'categories', url: '/categories' },
    { name: 'inventory', url: '/inventory' },
    { name: 'customers', url: '/customers' },
    { name: 'coupons', url: '/coupons' },
    { name: 'content', url: '/content' },
    { name: 'newsletter', url: '/newsletter' },
    { name: 'analytics', url: '/analytics' },
    { name: 'settings', url: '/settings' },
    { name: 'team', url: '/team' },
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
