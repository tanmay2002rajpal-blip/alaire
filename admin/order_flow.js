const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Go to product page
  await page.goto('http://localhost:3000/products');
  await page.waitForTimeout(2000);
  
  // Click on Test Leather Wallet
  await page.click('text=Test Leather Wallet');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/product_detail.png', fullPage: true });
  console.log('Captured: product detail');
  console.log('URL:', page.url());
  
  // Try to add to cart
  const addToCartBtn = await page.$('button:has-text("Add to Cart"), button:has-text("Add to Bag")');
  if (addToCartBtn) {
    await addToCartBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/after_add_cart.png', fullPage: true });
    console.log('Captured: after add to cart');
  } else {
    console.log('No add to cart button found');
  }
  
  // Go to cart
  await page.goto('http://localhost:3000/cart');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/cart_page.png', fullPage: true });
  console.log('Captured: cart page');
  
  await browser.close();
  console.log('Done!');
})();
