const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function runTest() {
  console.log('[TEST] Starting file upload and integration test...');
  
  // 1. Create a dummy resume file to upload
  const dummyFile = path.resolve(__dirname, 'dummy_resume.txt');
  fs.writeFileSync(dummyFile, 'Resume of a software engineer with React and Node.js skills.');
  console.log(`[TEST] Created dummy resume file at: ${dummyFile}`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Listen to page errors & logs
    page.on('console', (msg) => {
      console.log(`[PAGE LOG] ${msg.text()}`);
    });
    page.on('pageerror', (err) => {
      console.error(`[PAGE ERROR] ${err.toString()}`);
    });

    // Go to the local Next.js server
    console.log('[TEST] Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 20000 });
    
    // Give it a brief moment to hydration/parsing
    console.log('[TEST] Waiting for hydration...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('[TEST] Page loaded. Checking for file input...');
    
    // Find the hidden file input
    const fileInput = await page.$('#file-ingest');
    if (!fileInput) {
      throw new Error('Could not find file input element (#file-ingest)');
    }

    // Upload the file
    console.log('[TEST] Uploading dummy resume...');
    await fileInput.uploadFile(dummyFile);
    
    // Wait for the simulated parsing loader or state change
    console.log('[TEST] Waiting for upload state to render...');
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Verify if the file name is displayed inside the dropzone container
    const dropzoneContent = await page.evaluate(() => {
      const dropzone = document.querySelector('.border-dashed');
      return dropzone ? dropzone.textContent : 'Not Found';
    });
    
    console.log(`[TEST] Dropzone text content after upload: "${dropzoneContent.trim()}"`);
    
    if (dropzoneContent.includes('dummy_resume.txt')) {
      console.log('[TEST SUCCESS] File upload registered successfully and displayed filename on screen!');
    } else {
      throw new Error('Filename not detected in dropzone after file upload.');
    }

    // Input Github Username
    console.log('[TEST] Typing GitHub username...');
    await page.type('#gh-user', 'DEVARAJ-07');

    // Click Check Analysis
    console.log('[TEST] Clicking Check Analysis button...');
    const buttons = await page.$$('button');
    let triggerBtn;
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('Check Analysis')) {
        triggerBtn = btn;
        break;
      }
    }

    if (!triggerBtn) {
      throw new Error('Could not find Check Analysis button');
    }

    await triggerBtn.click();
    console.log('[TEST] Button clicked. Waiting for scanning screen...');

    // Wait for isScanning (status !== 'idle' -> rendering the telemetry view)
    await new Promise(resolve => setTimeout(resolve, 6000));

    const isScanningScreen = await page.evaluate(() => {
      return !!document.querySelector('.h-80'); // checking if logs telemetry scrollbar is visible
    });

    if (isScanningScreen) {
      console.log('[TEST SUCCESS] Page successfully transitioned to the Ingestion/Scanning state page!');
    } else {
      const bodyHtml = await page.evaluate(() => document.body.innerHTML);
      console.log('[TEST DEBUG] Current page state html segment:', bodyHtml.substring(0, 500));
      throw new Error('Page did not transition to the scanning/log telemetry view.');
    }

  } catch (err) {
    console.error('[TEST FAILURE]', err.message);
  } finally {
    if (browser) {
      await browser.close();
    }
    // Clean up dummy file
    if (fs.existsSync(dummyFile)) {
      fs.unlinkSync(dummyFile);
    }
    console.log('[TEST] Finished.');
  }
}

runTest();
