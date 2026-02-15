const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // User products page
  await page.goto('http://localhost:3000/products');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/user_all_products.png', fullPage: true });
  console.log('Captured: all products');
  
  // Try accessories category
  await page.goto('http://localhost:3000/categories/accessories');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/user_accessories.png', fullPage: true });
  console.log('Captured: accessories');
  
  await browser.close();
  console.log('Done!');
})();
