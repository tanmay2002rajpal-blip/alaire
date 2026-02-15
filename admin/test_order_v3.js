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
  
  // Fill pincode check
  await page.fill('input[placeholder="Enter 6-digit pincode"]', '400001');
  await page.waitForTimeout(4000); // Wait for auto-check
  
  await page.screenshot({ path: '/tmp/after_pincode.png', fullPage: true });
  console.log('Captured: after pincode');
  
  // Fill address
  await page.fill('input[name="line1"]', '123 Test Street');
  
  // Select Cash on Delivery
  await page.click('text=Cash on Delivery');
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: '/tmp/ready_to_order.png', fullPage: true });
  console.log('Captured: ready to order');
  
  // Click Place Order
  const placeOrderBtn = await page.$('button:has-text("Place Order")');
  if (placeOrderBtn) {
    await placeOrderBtn.click();
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/tmp/order_placed.png', fullPage: true });
    console.log('Captured: order placed');
    console.log('Final URL:', page.url());
  } else {
    console.log('No Place Order button found');
  }
  
  await browser.close();
  console.log('Done!');
})();
