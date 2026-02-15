const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Go to product
  await page.goto('http://localhost:3000/products/test-leather-wallet');
  await page.waitForTimeout(2000);
  
  // Add to cart
  await page.click('button:has-text("Add to Cart")');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/after_add.png', fullPage: true });
  console.log('Captured: after add');
  
  // Click cart icon in header
  await page.click('[href="/cart"], a:has-text("cart"), button[aria-label*="cart"]');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/cart_via_icon.png', fullPage: true });
  console.log('Captured: cart via icon');
  console.log('URL:', page.url());
  
  // If still empty, check localStorage
  const localStorage = await page.evaluate(() => {
    return JSON.stringify(window.localStorage);
  });
  console.log('LocalStorage:', localStorage);
  
  await browser.close();
  console.log('Done!');
})();
