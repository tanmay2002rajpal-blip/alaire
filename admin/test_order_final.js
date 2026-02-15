const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Go to product and add to cart
  await page.goto('http://localhost:3000/products/test-leather-wallet');
  await page.waitForTimeout(2000);
  await page.click('button:has-text("Add to Cart")');
  await page.waitForTimeout(2000);
  
  // Click checkout
  await page.click('button:has-text("Checkout"), a:has-text("Checkout")');
  await page.waitForTimeout(3000);
  
  // Fill contact info
  await page.fill('input[name="fullName"]', 'Test Customer');
  await page.fill('input[name="phone"]', '9876543210');
  await page.fill('input[name="email"]', 'test@example.com');
  
  // Fill address
  await page.fill('input[name="pincode"]', '400001');
  await page.waitForTimeout(1500);
  await page.fill('input[name="addressLine1"]', '123 Test Street');
  
  // Select Cash on Delivery
  await page.click('text=Cash on Delivery');
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: '/tmp/order_ready.png', fullPage: true });
  console.log('Captured: order ready');
  
  // Click Place Order
  await page.click('button:has-text("Place Order")');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/tmp/order_result.png', fullPage: true });
  console.log('Captured: order result');
  console.log('Final URL:', page.url());
  
  await browser.close();
  console.log('Done!');
})();
