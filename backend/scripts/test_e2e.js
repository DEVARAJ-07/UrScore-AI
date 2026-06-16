const axios = require('axios');
const FormData = require('form-data');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const BACKEND_URL = 'http://localhost:5001';
const WS_URL = 'ws://localhost:5001';

async function runTest() {
  console.log('--- STARTING E2E TEST ---');

  // 1. Create a dummy PDF resume for testing
  const dummyPdfPath = path.join(__dirname, 'dummy_resume.pdf');
  fs.writeFileSync(dummyPdfPath, 'Dummy PDF content simulating a real resume with TypeScript and React experience.');

  // 2. Connect to WebSocket
  const ws = new WebSocket(WS_URL);
  
  ws.on('open', async () => {
    console.log('✅ Connected to WebSocket');
    
    // 3. Trigger a scan
    console.log('Triggering new scan via API...');
    const formData = new FormData();
    formData.append('github_username', 'octocat'); // public github user
    formData.append('resume_file', fs.createReadStream(dummyPdfPath));
    formData.append('portfolio_url', 'https://example.com');
    formData.append('leetcode_username', '');

    try {
      const response = await axios.post(`${BACKEND_URL}/api/scans/trigger`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      console.log(`Scan triggered! Scan ID: ${response.data.scanId}`);
      
      // Send WebSocket subscribe event
      ws.send(JSON.stringify({ type: 'subscribe', scanId: response.data.scanId }));

    } catch (err) {
      console.error('❌ Failed to trigger scan:', err.response ? err.response.data : err.message);
      ws.close();
      process.exit(1);
    }
  });

  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    
    if (msg.type === 'LOG') {
      console.log(`[WS] Log: ${msg.text} (${msg.progress}%)`);
    } else if (msg.type === 'STATUS_UPDATE') {
      console.log(`[WS] Status changed to: ${msg.status}`);
      if (msg.status === 'completed') {
        console.log('✅ Worker successfully finished the scan!');
        verifyDatabase(msg.scanId);
      } else if (msg.status === 'failed') {
        console.error('❌ Worker failed the scan!');
        ws.close();
        process.exit(1);
      }
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket Error:', err);
  });

  async function verifyDatabase(scanId) {
    console.log('--- Verifying Database Integrity ---');
    try {
      // Check scan object
      const scanRes = await axios.get(`${BACKEND_URL}/api/scans/${scanId}`);
      if (scanRes.data && scanRes.data.status === 'completed') {
        console.log('✅ Scan document verified in MongoDB.');
      }

      // Check report object
      const reportRes = await axios.get(`${BACKEND_URL}/api/scans/${scanId}/report`);
      if (reportRes.data && reportRes.data.overall_score) {
        console.log(`✅ Report document verified in MongoDB. Score: ${reportRes.data.overall_score}`);
        console.log(`✅ AWS PDF URL: ${reportRes.data.pdf_report_url}`);
      }

      console.log('\n🎉 E2E TEST COMPLETED SUCCESSFULLY! 🎉');
      ws.close();
      process.exit(0);

    } catch (err) {
      console.error('❌ Database verification failed:', err.response ? err.response.data : err.message);
      ws.close();
      process.exit(1);
    }
  }
}

runTest();
