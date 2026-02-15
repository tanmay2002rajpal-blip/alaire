const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  // ===== ADMIN SESSION =====
  console.log('\n=== ADMIN: Login and check products ===');
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  
  // Login to admin
  await adminPage.goto('http://localhost:3001/login');
  await adminPage.waitForTimeout(2000);
  await adminPage.fill('input[type="email"]', 'admin@alaire.in');
  await adminPage.fill('input[type="password"]', 'Admin123!');
  await adminPage.click('button:has-text("Sign In")');
  await adminPage.waitForTimeout(3000);
  
  // Go to products page
  await adminPage.goto('http://localhost:3001/products');
  await adminPage.waitForTimeout(2000);
  await adminPage.screenshot({ path: '/tmp/test_admin_products.png', fullPage: true });
  console.log('Admin products page captured');
  
  // Activate a product (Athletic Crew Socks) by going to edit
  await adminPage.goto('http://localhost:3001/products');
  await adminPage.waitForTimeout(2000);
  
  // Find and click on Athletic Crew Socks
  const socksProduct = await adminPage.$('text=Athletic Crew Socks');
  if (socksProduct) {
    await socksProduct.click();
    await adminPage.waitForTimeout(2000);
    await adminPage.screenshot({ path: '/tmp/test_product_edit.png', fullPage: true });
    console.log('Product edit page captured');
  }
  
  // Check orders page
  await adminPage.goto('http://localhost:3001/orders');
  await adminPage.waitForTimeout(2000);
  await adminPage.screenshot({ path: '/tmp/test_admin_orders_before.png', fullPage: true });
  console.log('Admin orders (before) captured');
  
  // ===== USER SESSION =====
  console.log('\n=== USER: Browse and order ===');
  const userContext = await browser.newContext();
  const userPage = await userContext.newPage();
  
  // Go to products
  await userPage.goto('http://localhost:3000/products');
  await userPage.waitForTimeout(2000);
  await userPage.screenshot({ path: '/tmp/test_user_products.png', fullPage: true });
  console.log('User products page captured');
  
  // Go to the only active product
  await userPage.goto('http://localhost:3000/products/test-leather-wallet');
  await userPage.waitForTimeout(2000);
  
  // Add to cart
  await userPage.click('button:has-text("Add to Cart")');
  await userPage.waitForTimeout(2000);
  await userPage.screenshot({ path: '/tmp/test_user_cart.png', fullPage: true });
  console.log('Cart captured');
  
  // Go to checkout
  await userPage.click('button:has-text("Checkout"), a:has-text("Checkout")');
  await userPage.waitForTimeout(3000);
  
  // Fill checkout form
  await userPage.fill('input[name="fullName"]', 'Test Order User');
  await userPage.fill('input[name="phone"]', '9876543210');
  await userPage.fill('input[name="email"]', 'testorder@example.com');
  
  // Fill pincode (wait for auto-check)
  await userPage.fill('input[placeholder="Enter 6-digit pincode"]', '400001');
  await userPage.waitForTimeout(4000);
  
  // Fill address
  await userPage.fill('input[name="line1"]', '123 Test Building');
  
  // Select COD
  await userPage.click('text=Cash on Delivery');
  await userPage.waitForTimeout(1000);
  
  await userPage.screenshot({ path: '/tmp/test_checkout_ready.png', fullPage: true });
  console.log('Checkout ready captured');
  
  // Place order
  const placeBtn = await userPage.$('button:has-text("Place Order")');
  if (placeBtn) {
    await placeBtn.click();
    await userPage.waitForTimeout(5000);
    await userPage.screenshot({ path: '/tmp/test_order_result.png', fullPage: true });
    console.log('Order result captured');
    console.log('Final URL:', userPage.url());
  }
  
  // ===== ADMIN: Check if order appeared =====
  console.log('\n=== ADMIN: Check orders after ===');
  await adminPage.goto('http://localhost:3001/orders');
  await adminPage.waitForTimeout(2000);
  await adminPage.screenshot({ path: '/tmp/test_admin_orders_after.png', fullPage: true });
  console.log('Admin orders (after) captured');
  
  // Check dashboard
  await adminPage.goto('http://localhost:3001/dashboard');
  await adminPage.waitForTimeout(2000);
  await adminPage.screenshot({ path: '/tmp/test_admin_dashboard.png', fullPage: true });
  console.log('Admin dashboard captured');
  
  await browser.close();
  console.log('\nDone! All screenshots saved to /tmp/test_*.png');
})();
