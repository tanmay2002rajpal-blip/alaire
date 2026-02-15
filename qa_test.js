const puppeteer = require('puppeteer');
const fs = require('fs');

const ADMIN_URL = 'http://localhost:3001';
const USER_URL = 'http://localhost:3000';

const bugs = {
  user: [],
  admin: []
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testUserPanel(browser) {
  console.log('\n========== USER PANEL TESTING ==========\n');
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Test 1: Homepage Load
  console.log('TEST 1: Homepage Load');
  try {
    const response = await page.goto(USER_URL, { waitUntil: 'networkidle2', timeout: 15000 });
    if (!response.ok()) {
      bugs.user.push({ test: 'Homepage Load', severity: 'Critical', description: `Homepage returns ${response.status()}` });
    } else {
      console.log('  ✓ Homepage loads successfully');
    }
  } catch (e) {
    bugs.user.push({ test: 'Homepage Load', severity: 'Critical', description: e.message });
  }

  // Test 2: Products Page
  console.log('TEST 2: Products Page');
  try {
    await page.goto(`${USER_URL}/products`, { waitUntil: 'networkidle2', timeout: 15000 });
    const products = await page.$$('[data-testid="product-card"], .product-card, [class*="product"]');
    console.log(`  Found ${products.length} product elements`);
    if (products.length === 0) {
      bugs.user.push({ test: 'Products Display', severity: 'Medium', description: 'No products visible on products page' });
    }
  } catch (e) {
    bugs.user.push({ test: 'Products Page', severity: 'High', description: e.message });
  }

  // Test 3: Search Functionality
  console.log('TEST 3: Search Functionality');
  try {
    const searchInput = await page.$('input[type="search"], input[placeholder*="search" i], input[name="search"]');
    if (searchInput) {
      await searchInput.type('nonexistentproduct12345');
      await delay(1000);
      const noResults = await page.$('text/no results, text/not found, [class*="empty"]');
      console.log('  ✓ Search input found');
    } else {
      bugs.user.push({ test: 'Search', severity: 'Low', description: 'No search functionality found' });
    }
  } catch (e) {
    console.log('  Search test skipped:', e.message);
  }

  // Test 4: Add to Cart without login
  console.log('TEST 4: Add to Cart');
  try {
    await page.goto(`${USER_URL}/products`, { waitUntil: 'networkidle2' });
    const addToCartBtn = await page.$('button:has-text("Add to Cart"), button:has-text("Add"), [class*="add-to-cart"]');
    if (addToCartBtn) {
      await addToCartBtn.click();
      await delay(1000);
      console.log('  ✓ Add to cart button found and clicked');
    }
  } catch (e) {
    console.log('  Add to cart test:', e.message);
  }

  // Test 5: Cart Page
  console.log('TEST 5: Cart Page');
  try {
    await page.goto(`${USER_URL}/cart`, { waitUntil: 'networkidle2', timeout: 15000 });
    const cartContent = await page.content();
    if (cartContent.includes('404') || cartContent.includes('not found')) {
      bugs.user.push({ test: 'Cart Page', severity: 'High', description: 'Cart page returns 404' });
    } else {
      console.log('  ✓ Cart page accessible');
    }
  } catch (e) {
    bugs.user.push({ test: 'Cart Page', severity: 'High', description: e.message });
  }

  // Test 6: Checkout without items
  console.log('TEST 6: Empty Checkout');
  try {
    await page.goto(`${USER_URL}/checkout`, { waitUntil: 'networkidle2', timeout: 15000 });
    const checkoutContent = await page.content();
    // Should redirect or show message about empty cart
    console.log('  Checkout page loaded');
  } catch (e) {
    console.log('  Checkout test:', e.message);
  }

  // Test 7: Invalid Routes
  console.log('TEST 7: 404 Handling');
  try {
    await page.goto(`${USER_URL}/invalid-route-xyz`, { waitUntil: 'networkidle2' });
    const content = await page.content();
    if (!content.includes('404') && !content.includes('not found') && !content.includes('Not Found')) {
      bugs.user.push({ test: '404 Handling', severity: 'Low', description: 'Invalid routes do not show proper 404 page' });
    } else {
      console.log('  ✓ 404 page displays correctly');
    }
  } catch (e) {
    console.log('  404 test:', e.message);
  }

  // Test 8: Product Detail Page
  console.log('TEST 8: Product Detail');
  try {
    await page.goto(`${USER_URL}/products`, { waitUntil: 'networkidle2' });
    const productLink = await page.$('a[href*="/product"], a[href*="/products/"]');
    if (productLink) {
      await productLink.click();
      await delay(2000);
      const url = page.url();
      if (url.includes('/product')) {
        console.log('  ✓ Product detail page accessible');
        // Check for required elements
        const hasPrice = await page.$('[class*="price"], [data-testid="price"]');
        const hasAddToCart = await page.$('button');
        if (!hasPrice) {
          bugs.user.push({ test: 'Product Detail', severity: 'Medium', description: 'Price not clearly visible on product page' });
        }
      }
    }
  } catch (e) {
    console.log('  Product detail test:', e.message);
  }

  // Test 9: Mobile Responsiveness
  console.log('TEST 9: Mobile Responsiveness');
  try {
    await page.setViewport({ width: 375, height: 667 });
    await page.goto(USER_URL, { waitUntil: 'networkidle2' });
    const hasHamburger = await page.$('[class*="menu"], [class*="hamburger"], button[aria-label*="menu"]');
    await page.setViewport({ width: 1280, height: 900 }); // Reset
    console.log('  Mobile viewport tested');
  } catch (e) {
    console.log('  Mobile test:', e.message);
  }

  // Test 10: Console Errors
  console.log('TEST 10: JavaScript Errors');
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  await page.goto(USER_URL, { waitUntil: 'networkidle2' });
  await delay(2000);
  if (consoleErrors.length > 0) {
    bugs.user.push({ test: 'JavaScript Errors', severity: 'Medium', description: `${consoleErrors.length} console errors found` });
  }

  await page.close();
}

async function testAdminPanel(browser) {
  console.log('\n========== ADMIN PANEL TESTING ==========\n');
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Test 1: Login Page
  console.log('TEST 1: Admin Login Page');
  try {
    await page.goto(ADMIN_URL, { waitUntil: 'networkidle2', timeout: 15000 });
    const url = page.url();
    if (url.includes('login')) {
      console.log('  ✓ Redirects to login page');
    }
    const loginForm = await page.$('form, input[type="email"], input[type="password"]');
    if (!loginForm) {
      bugs.admin.push({ test: 'Login Page', severity: 'Critical', description: 'Login form not found' });
    }
  } catch (e) {
    bugs.admin.push({ test: 'Admin Access', severity: 'Critical', description: e.message });
  }

  // Test 2: Login with invalid credentials
  console.log('TEST 2: Invalid Login');
  try {
    await page.goto(`${ADMIN_URL}/login`, { waitUntil: 'networkidle2' });
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    const passInput = await page.$('input[type="password"], input[name="password"]');
    if (emailInput && passInput) {
      await emailInput.type('fake@email.com');
      await passInput.type('wrongpassword');
      const submitBtn = await page.$('button[type="submit"], button:has-text("Login"), button:has-text("Sign")');
      if (submitBtn) {
        await submitBtn.click();
        await delay(2000);
        const errorMsg = await page.$('[class*="error"], [role="alert"], [class*="toast"]');
        if (!errorMsg) {
          bugs.admin.push({ test: 'Invalid Login', severity: 'Medium', description: 'No error message shown for invalid credentials' });
        } else {
          console.log('  ✓ Error message shown for invalid login');
        }
      }
    }
  } catch (e) {
    console.log('  Invalid login test:', e.message);
  }

  // Test 3: Login with valid credentials (using test account)
  console.log('TEST 3: Valid Login');
  try {
    await page.goto(`${ADMIN_URL}/login`, { waitUntil: 'networkidle2' });
    // Try common test credentials
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    const passInput = await page.$('input[type="password"], input[name="password"]');
    if (emailInput && passInput) {
      await emailInput.click({ clickCount: 3 });
      await emailInput.type('admin@alaire.com');
      await passInput.click({ clickCount: 3 });
      await passInput.type('admin123');
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) {
        await submitBtn.click();
        await delay(3000);
        const currentUrl = page.url();
        if (currentUrl.includes('dashboard') || !currentUrl.includes('login')) {
          console.log('  ✓ Login successful');
        } else {
          // Try another common password
          await page.goto(`${ADMIN_URL}/login`, { waitUntil: 'networkidle2' });
          await page.type('input[type="email"]', 'admin@alaire.com');
          await page.type('input[type="password"]', 'password123');
          await page.click('button[type="submit"]');
          await delay(2000);
        }
      }
    }
  } catch (e) {
    console.log('  Login test:', e.message);
  }

  // Test 4: Dashboard Access
  console.log('TEST 4: Dashboard');
  try {
    await page.goto(`${ADMIN_URL}/dashboard`, { waitUntil: 'networkidle2' });
    const url = page.url();
    if (url.includes('login')) {
      bugs.admin.push({ test: 'Dashboard', severity: 'Info', description: 'Dashboard requires authentication (expected)' });
    } else {
      console.log('  ✓ Dashboard accessible');
    }
  } catch (e) {
    console.log('  Dashboard test:', e.message);
  }

  // Test 5: Products Page
  console.log('TEST 5: Products Management');
  try {
    await page.goto(`${ADMIN_URL}/products`, { waitUntil: 'networkidle2' });
    console.log('  Products page loaded');
  } catch (e) {
    console.log('  Products test:', e.message);
  }

  // Test 6: Orders Page
  console.log('TEST 6: Orders Management');
  try {
    await page.goto(`${ADMIN_URL}/orders`, { waitUntil: 'networkidle2' });
    console.log('  Orders page loaded');
  } catch (e) {
    console.log('  Orders test:', e.message);
  }

  // Test 7: SQL Injection Test
  console.log('TEST 7: SQL Injection (Basic)');
  try {
    await page.goto(`${ADMIN_URL}/login`, { waitUntil: 'networkidle2' });
    const emailInput = await page.$('input[type="email"]');
    if (emailInput) {
      await emailInput.click({ clickCount: 3 });
      await emailInput.type("admin'--");
      const passInput = await page.$('input[type="password"]');
      if (passInput) {
        await passInput.type('anything');
        const submitBtn = await page.$('button[type="submit"]');
        if (submitBtn) {
          await submitBtn.click();
          await delay(2000);
          const url = page.url();
          if (!url.includes('login')) {
            bugs.admin.push({ test: 'SQL Injection', severity: 'Critical', description: 'Potential SQL injection vulnerability in login' });
          } else {
            console.log('  ✓ Basic SQL injection blocked');
          }
        }
      }
    }
  } catch (e) {
    console.log('  SQL injection test:', e.message);
  }

  // Test 8: XSS Test
  console.log('TEST 8: XSS (Basic)');
  try {
    const xssPayload = '<script>alert("xss")</script>';
    await page.goto(`${ADMIN_URL}/products?search=${encodeURIComponent(xssPayload)}`, { waitUntil: 'networkidle2' });
    const content = await page.content();
    if (content.includes('<script>alert')) {
      bugs.admin.push({ test: 'XSS Vulnerability', severity: 'Critical', description: 'XSS payload not sanitized in URL params' });
    } else {
      console.log('  ✓ Basic XSS appears blocked');
    }
  } catch (e) {
    console.log('  XSS test:', e.message);
  }

  // Test 9: Unauthorized Access
  console.log('TEST 9: Direct URL Access');
  try {
    // Clear cookies
    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCookies');
    
    await page.goto(`${ADMIN_URL}/products/new`, { waitUntil: 'networkidle2' });
    const url = page.url();
    if (!url.includes('login')) {
      bugs.admin.push({ test: 'Auth Bypass', severity: 'Critical', description: 'Can access /products/new without authentication' });
    } else {
      console.log('  ✓ Unauthorized access properly blocked');
    }
  } catch (e) {
    console.log('  Auth test:', e.message);
  }

  // Test 10: Rate Limiting
  console.log('TEST 10: Rate Limiting');
  try {
    let loginAttempts = 0;
    for (let i = 0; i < 10; i++) {
      await page.goto(`${ADMIN_URL}/login`, { waitUntil: 'networkidle2' });
      const emailInput = await page.$('input[type="email"]');
      const passInput = await page.$('input[type="password"]');
      if (emailInput && passInput) {
        await emailInput.type('test@test.com');
        await passInput.type('wrongpass');
        const submitBtn = await page.$('button[type="submit"]');
        if (submitBtn) await submitBtn.click();
        loginAttempts++;
      }
      await delay(200);
    }
    if (loginAttempts >= 10) {
      bugs.admin.push({ test: 'Rate Limiting', severity: 'Medium', description: 'No rate limiting on login attempts (10 rapid attempts allowed)' });
    }
  } catch (e) {
    console.log('  Rate limit test:', e.message);
  }

  await page.close();
}

async function runTests() {
  console.log('Starting Comprehensive QA Testing...\n');
  console.log('Date:', new Date().toISOString());
  console.log('='.repeat(50));

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    await testUserPanel(browser);
    await testAdminPanel(browser);
  } catch (e) {
    console.error('Test error:', e);
  }

  await browser.close();

  // Output results
  console.log('\n' + '='.repeat(50));
  console.log('QA TESTING RESULTS');
  console.log('='.repeat(50));

  console.log('\n## USER PANEL BUGS:');
  if (bugs.user.length === 0) {
    console.log('No bugs found!');
  } else {
    bugs.user.forEach((bug, i) => {
      console.log(`${i+1}. [${bug.severity}] ${bug.test}: ${bug.description}`);
    });
  }

  console.log('\n## ADMIN PANEL BUGS:');
  if (bugs.admin.length === 0) {
    console.log('No bugs found!');
  } else {
    bugs.admin.forEach((bug, i) => {
      console.log(`${i+1}. [${bug.severity}] ${bug.test}: ${bug.description}`);
    });
  }

  // Save to file
  const report = {
    date: new Date().toISOString(),
    userBugs: bugs.user,
    adminBugs: bugs.admin
  };
  fs.writeFileSync('/tmp/qa_report.json', JSON.stringify(report, null, 2));
  console.log('\nDetailed report saved to /tmp/qa_report.json');
}

runTests().catch(console.error);
