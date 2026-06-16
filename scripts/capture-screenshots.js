const fs = require('fs')
const path = require('path')
const playwright = require('playwright')

;(async () => {
  const outDir = path.resolve(__dirname, '../public/screenshots')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  const url = process.argv[2] || 'http://localhost:5173'
  console.log('Opening', url)

  const browser = await playwright.chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await context.newPage()

  try {
    await page.goto(url, { waitUntil: 'networkidle' })

    // Capture Arbitrage page
    await page.goto(url + '/#/?page=arbitrage', { waitUntil: 'networkidle' }).catch(() => {})
    await page.waitForTimeout(500)
    const arbPath = path.join(outDir, 'arbitrage-list.png')
    await page.screenshot({ path: arbPath, fullPage: true })
    console.log('Saved', arbPath)

    // Capture Simulator page
    await page.goto(url + '/#/?page=simulator', { waitUntil: 'networkidle' }).catch(() => {})
    await page.waitForTimeout(500)
    const simPath = path.join(outDir, 'simulator.png')
    await page.screenshot({ path: simPath, fullPage: true })
    console.log('Saved', simPath)

  } catch (err) {
    console.error('Error capturing screenshots:', err)
  } finally {
    await browser.close()
  }
})()
