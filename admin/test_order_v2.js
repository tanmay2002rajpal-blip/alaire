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
  
  // Screenshot to see form state
  await page.screenshot({ path: '/tmp/checkout_initial.png', fullPage: true });
  console.log('Captured: checkout initial');
  
  // Log all inputs on page
  const inputs = await page.$$eval('input', els => els.map(e => ({
    name: e.name,
    placeholder: e.placeholder,
    disabled: e.disabled,
    type: e.type
  })));
  console.log('Inputs:', JSON.stringify(inputs, null, 2));
  
  // Try to find the pincode check input
  const pincodeCheckInput = await page.$('input[placeholder*="6-digit"], input[placeholder*="pincode"]');
  if (pincodeCheckInput) {
    console.log('Found pincode check input');
    await pincodeCheckInput.fill('400001');
    await page.waitForTimeout(500);
    
    // Click check button
    const checkBtn = await page.$('button:has-text("Check")');
    if (checkBtn) {
      await checkBtn.click();
      await page.waitForTimeout(3000);
      console.log('Clicked check');
    }
  }
  
  await page.screenshot({ path: '/tmp/checkout_after_check.png', fullPage: true });
  console.log('Captured: after pincode check');
  
  await browser.close();
  console.log('Done!');
})();
