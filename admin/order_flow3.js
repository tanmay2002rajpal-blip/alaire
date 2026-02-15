const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Go to product
  await page.goto('http://localhost:3000/products/test-leather-wallet');
  await page.waitForTimeout(2000);
  
  // Add to cart - this opens a drawer
  await page.click('button:has-text("Add to Cart")');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/cart_drawer.png', fullPage: true });
  console.log('Captured: cart drawer');
  
  // Look for checkout button in the drawer
  const checkoutBtn = await page.$('button:has-text("Checkout"), a:has-text("Checkout")');
  if (checkoutBtn) {
    await checkoutBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/checkout_page.png', fullPage: true });
    console.log('Captured: checkout page');
    console.log('URL:', page.url());
  } else {
    console.log('No checkout button found');
    
    // Try to close drawer and go to cart page
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    await page.goto('http://localhost:3000/cart');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/cart_page2.png', fullPage: true });
    console.log('Captured: cart page after escape');
  }
  
  await browser.close();
  console.log('Done!');
})();
