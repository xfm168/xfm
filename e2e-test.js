const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const errors = [];
  const consoleLogs = [];
  const failedRequests = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push({ type: msg.type(), text });
    if (msg.type() === 'error') errors.push(text);
  });

  page.on('pageerror', err => {
    errors.push(err.message);
  });

  page.on('requestfailed', req => {
    failedRequests.push({ url: req.url(), failure: req.failure()?.errorText });
  });

  const results = {
    pages: {},
    errors: [],
    failedRequests: [],
    screenshots: []
  };

  // Helper
  async function testPage(name, url, actions) {
    console.log(`\n--- Testing: ${name} ---`);
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);
      const screenshot = `/workspace/e2e-${name.replace(/\s+/g, '-').toLowerCase()}.png`;
      await page.screenshot({ path: screenshot, fullPage: true });
      results.screenshots.push(screenshot);
      console.log(`  Screenshot: ${screenshot}`);

      if (actions) await actions();

      results.pages[name] = {
        url: page.url(),
        title: await page.title(),
        contentLength: await page.evaluate(() => document.body.innerText.length),
        hasRootContent: await page.evaluate(() => document.getElementById('root')?.innerHTML?.length > 0)
      };
      console.log(`  Content length: ${results.pages[name].contentLength}`);
      console.log(`  Has root content: ${results.pages[name].hasRootContent}`);
    } catch (e) {
      console.log(`  ERROR: ${e.message}`);
      results.pages[name] = { error: e.message };
    }
  }

  // 1. 首页
  await testPage('Home', 'http://localhost:3000/', async () => {
    // Check for compass/bagua elements
    const hasCompass = await page.evaluate(() =>
      document.querySelector('.compass, .xbiz-compass, [class*="compass"], [class*="bagua"], [class*="taiji"]') !== null
    );
    console.log(`  Has compass/bagua: ${hasCompass}`);

    // Check for feature cards
    const cards = await page.$$eval('.feature-card, [class*="feature"]', els => els.length);
    console.log(`  Feature cards: ${cards}`);

    // Check all nav links
    const links = await page.$$eval('a[href]', els => els.map(e => e.getAttribute('href')));
    console.log(`  Links found: ${links.filter(l => l && !l.startsWith('http')).join(', ')}`);
  });

  // 2. 今日卦运
  await testPage('Daily', 'http://localhost:3000/daily', async () => {
    const hasContent = await page.evaluate(() => document.body.innerText.includes('卦'));
    console.log(`  Has gua content: ${hasContent}`);
  });

  // 3. 六爻占卜
  await testPage('Divination', 'http://localhost:3000/liuyao', async () => {
    // Try to click start button
    const buttons = await page.$$('button');
    console.log(`  Buttons: ${buttons.length}`);
    for (const btn of buttons.slice(0, 5)) {
      const text = await btn.textContent();
      console.log(`    Button: "${text?.trim()}"`);
    }
  });

  // 4. 风水勘测
  await testPage('FengShui', 'http://localhost:3000/fengshui', async () => {
    // Check upload area
    const hasUpload = await page.evaluate(() =>
      document.querySelector('input[type="file"], [class*="upload"], [class*="image"]') !== null
    );
    console.log(`  Has upload area: ${hasUpload}`);

    // Check for file input
    const fileInputs = await page.$$('input[type="file"]');
    console.log(`  File inputs: ${fileInputs.length}`);
  });

  // 5. 登录
  await testPage('Login', 'http://localhost:3000/login', async () => {
    const hasEmail = await page.evaluate(() => document.querySelector('input[type="email"], input[placeholder*="邮箱"], input[name="email"]') !== null);
    const hasPassword = await page.evaluate(() => document.querySelector('input[type="password"]') !== null);
    console.log(`  Has email input: ${hasEmail}`);
    console.log(`  Has password input: ${hasPassword}`);
  });

  // 6. 会员中心
  await testPage('Membership', 'http://localhost:3000/membership', async () => {
    const text = await page.evaluate(() => document.body.innerText);
    console.log(`  Page text preview: "${text.substring(0, 200)}"`);
  });

  // 7. 个人中心
  await testPage('UserCenter', 'http://localhost:3000/user-center', async () => {
    const text = await page.evaluate(() => document.body.innerText);
    console.log(`  Page text preview: "${text.substring(0, 200)}"`);
  });

  // Collect errors
  results.errors = errors;
  results.failedRequests = failedRequests;

  console.log('\n=== SUMMARY ===');
  console.log('Pages:', Object.keys(results.pages).map(k => `${k}: ${results.pages[k].error ? 'ERROR' : 'OK'}`).join(', '));
  console.log('Console errors:', errors.length);
  console.log('Failed requests:', failedRequests.length);

  if (errors.length > 0) {
    console.log('\nConsole Errors:');
    errors.forEach(e => console.log('  -', e));
  }
  if (failedRequests.length > 0) {
    console.log('\nFailed Requests:');
    failedRequests.forEach(r => console.log('  -', r.url, r.failure));
  }

  // Final screenshot of home
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/workspace/e2e-final-home.png', fullPage: true });

  await browser.close();

  // Write results
  require('fs').writeFileSync('/workspace/e2e-results.json', JSON.stringify(results, null, 2));
  console.log('\nResults saved to /workspace/e2e-results.json');
})();
