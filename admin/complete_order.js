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
  
  // Fill in checkout form
  await page.fill('input[name="fullName"], input[placeholder*="Name"]', 'Test Customer');
  await page.fill('input[name="phone"], input[placeholder*="phone"], input[type="tel"]', '9876543210');
  await page.fill('input[name="email"], input[type="email"]', 'test@example.com');
  
  // Address
  await page.fill('input[name="pincode"], input[placeholder*="pincode"]', '400001');
  await page.fill('input[name="addressLine1"], input[placeholder*="Address Line 1"], input[placeholder*="House"]', '123 Test Street');
  await page.fill('input[name="city"]', 'Mumbai');
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/checkout_filled.png', fullPage: true });
  console.log('Captured: checkout filled');
  
  // Select Cash on Delivery
  const codOption = await page.$('text=Cash on Delivery');
  if (codOption) {
    await codOption.click();
    await page.waitForTimeout(500);
  }
  
  // Click Pay Now / Place Order
  await page.screenshot({ path: '/tmp/before_pay.png', fullPage: true });
  console.log('Captured: before pay');
  
  const payBtn = await page.$('button:has-text("Pay Now"), button:has-text("Place Order")');
  if (payBtn) {
    await payBtn.click();
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/tmp/after_order.png', fullPage: true });
    console.log('Captured: after order');
    console.log('Final URL:', page.url());
  } else {
    console.log('No pay button found');
  }
  
  await browser.close();
  console.log('Done!');
})();
