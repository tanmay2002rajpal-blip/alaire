const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Categories page
  await page.goto('http://localhost:3000/categories');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/user_categories.png', fullPage: true });
  console.log('Captured: categories');
  
  // Products page
  await page.goto('http://localhost:3000/products');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/user_products.png', fullPage: true });
  console.log('Captured: products');
  
  // Socks category
  await page.goto('http://localhost:3000/categories/socks');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/user_socks.png', fullPage: true });
  console.log('Captured: socks category');
  
  await browser.close();
  console.log('Done!');
})();
