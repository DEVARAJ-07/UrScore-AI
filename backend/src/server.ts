import express from 'express';
import cors from 'cors';
import * as http from 'http';
import { WebSocketServer } from 'ws';
import * as path from 'path';
import * as fs from 'fs';
import dotenv from 'dotenv';
import scansRouter from './routes/scans';
import webhooksRouter from './routes/webhooks';
import { initGateway } from './ws/gateway';

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Ensure public directories exist
const reportsDir = path.join(__dirname, '../public/reports');
const resumesDir = path.join(__dirname, '../public/resumes');
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
if (!fs.existsSync(resumesDir)) fs.mkdirSync(resumesDir, { recursive: true });

// Serve static assets for mock uploads
app.use('/public/reports', express.static(reportsDir));
app.use('/public/resumes', express.static(resumesDir));

// Scan API Routing
app.use('/api/scans', scansRouter);
app.use('/api/webhooks', webhooksRouter);

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'UrScore AI API Gateway' });
});

// Endpoint to simulate resume PDF uploading (saves files to local disk for scan reference)
app.post('/api/upload-resume', (req, res) => {
  try {
    const { name, content } = req.body; // Expects filename and base64 text or dummy payload
    if (!name || !content) {
      return res.status(400).json({ error: 'Name and content are required' });
    }

    const fileBuffer = Buffer.from(content, 'base64');
    const filePath = path.join(resumesDir, name);
    fs.writeFileSync(filePath, fileBuffer);

    res.json({
      message: 'Resume uploaded successfully',
      filename: name,
      url: `http://localhost:5001/public/resumes/${name}`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create HTTP Server
const server = http.createServer(app);

// Create WebSocket Server
const wss = new WebSocketServer({ noServer: true });

// Bind WebSocket upgrade
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// Initialize our custom WebSocket gateway manager
initGateway(wss);

server.listen(port, () => {
  console.log(`[UrScore AI] Server is running on http://localhost:${port}`);
  console.log(`[UrScore AI] WebSockets listening on ws://localhost:${port}`);
});
