const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Add to cart and checkout
  await page.goto('http://localhost:3000/products/test-leather-wallet');
  await page.waitForTimeout(2000);
  await page.click('button:has-text("Add to Cart")');
  await page.waitForTimeout(2000);
  await page.click('button:has-text("Checkout")');
  await page.waitForTimeout(3000);
  
  // Fill form
  await page.fill('input[name="fullName"]', 'Quick Test');
  await page.fill('input[name="phone"]', '9876543210');
  await page.fill('input[name="email"]', 'quick@test.com');
  await page.fill('input[placeholder="Enter 6-digit pincode"]', '400001');
  
  // Wait for pincode check (should be instant with bypass)
  await page.waitForTimeout(5000);
  await page.screenshot({ path: '/tmp/quick_pincode.png', fullPage: true });
  
  // Check if we can see "Delivery available" or if still checking
  const pageText = await page.textContent('body');
  if (pageText.includes('Delivery available')) {
    console.log('SUCCESS: Pincode check bypassed - delivery available!');
  } else if (pageText.includes('Checking')) {
    console.log('FAIL: Still checking delivery');
  } else {
    console.log('UNKNOWN: Check screenshot');
  }
  
  await browser.close();
})();
