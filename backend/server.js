// server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const QRCode = require('qrcode');

const app = express();
app.use(express.static('public'));

// Environment variables
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ? 
  process.env.ALLOWED_ORIGINS.split(',') : 
  ['http://localhost:3001', 'http://localhost:3002'];

// CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Store logs in memory for browser viewing
const logs = [];
const maxLogs = 100;

function addLog(message) {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
  const logEntry = `[${timestamp}] ${message}`;
  logs.push(logEntry);
  if (logs.length > maxLogs) logs.shift();
//  console.log(logEntry);
  
  // Broadcast to log viewers
  logViewers.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'log', message: logEntry }));
    }
  });
}

// Store log viewer connections
const logViewers = new Set();

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Add logs endpoint
app.get('/logs', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Server Logs - Webhook Latency</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📋</text></svg>" />
    <style>
        body { font-family: 'Courier New', monospace; background: #0b0f14; color: #e6edf3; margin: 0; padding: 20px; }
        .header { background: #1e293b; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .log-container { background: #111722; border: 1px solid #2b3443; border-radius: 8px; padding: 15px; height: 70vh; overflow-y: auto; }
        .log-entry { margin: 2px 0; padding: 2px 5px; border-radius: 3px; }
        .log-entry:hover { background: #1e293b; }
        .timestamp { color: #60a5fa; }
        .controller { color: #4ade80; }
        .receiver { color: #f59e0b; }
        .connection { color: #8b5cf6; }
        .error { color: #ef4444; background: #2d1b1b; }
        .controls { margin: 10px 0; }
        button { padding: 8px 12px; background: #1e293b; color: #e6edf3; border: 1px solid #2b3443; border-radius: 5px; cursor: pointer; margin-right: 10px; }
        button:hover { background: #334155; }
        .status { padding: 5px 10px; border-radius: 5px; display: inline-block; margin-left: 10px; }
        .connected { background: #0d4d0d; color: #4ade80; }
        .disconnected { background: #4d0d0d; color: #ef4444; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📋 Server Logs - Real Time</h1>
        <div class="controls">
            <button onclick="clearLogs()">Clear Logs</button>
            <button onclick="toggleAutoScroll()">Toggle Auto-scroll</button>
            <span class="status" id="wsStatus">Connecting...</span>
        </div>
    </div>
    <div class="log-container" id="logs">
        ${logs.map(log => `<div class="log-entry">${log.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`).join('')}
    </div>

    <script>
        const logsContainer = document.getElementById('logs');
        const wsStatus = document.getElementById('wsStatus');
        let autoScroll = true;
        
        // WebSocket connection for real-time logs
        const ws = new WebSocket('ws://localhost:${process.env.PORT || 3000}');
        
        ws.onopen = () => {
            wsStatus.textContent = 'Connected';
            wsStatus.className = 'status connected';
            ws.send(JSON.stringify({ type: 'log_viewer' }));
        };
        
        ws.onclose = () => {
            wsStatus.textContent = 'Disconnected';
            wsStatus.className = 'status disconnected';
        };
        
        ws.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (msg.type === 'log') {
                addLogEntry(msg.message);
            }
        };
        
        function addLogEntry(logText) {
            const div = document.createElement('div');
            div.className = 'log-entry';
            
            // Color code based on content
            if (logText.includes('controller')) div.classList.add('controller');
            if (logText.includes('receiver')) div.classList.add('receiver');
            if (logText.includes('connected') || logText.includes('ping') || logText.includes('pong')) div.classList.add('connection');
            if (logText.includes('error') || logText.includes('Error')) div.classList.add('error');
            
            div.innerHTML = logText.replace(/\\[(\\d{2}:\\d{2}:\\d{2})\\]/, '<span class="timestamp">[$1]</span>');
            logsContainer.appendChild(div);
            
            if (autoScroll) {
                div.scrollIntoView({ behavior: 'smooth' });
            }
        }
        
        function clearLogs() {
            logsContainer.innerHTML = '';
        }
        
        function toggleAutoScroll() {
            autoScroll = !autoScroll;
        }
        
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    </script>
</body>
</html>
  `);
});


app.get("/get-ip", (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  console.log("client ip::"+ip)
  res.json({ ip });
});

// Generate QR code for WebRTC connection
app.get("/generate-qr/:room", async (req, res) => {
  try {
    const room = req.params.room || 'A';
    const serverUrl = `${req.protocol}://${req.get('host')}`;
    
    // Allow override with environment variable for ngrok
    const backendUrl = process.env.BACKEND_URL || serverUrl;
    
    // Convert HTTP/HTTPS to WS/WSS appropriately
    let websocketUrl;
    if (backendUrl.startsWith('https://')) {
      websocketUrl = backendUrl.replace('https://', 'wss://');
    } else {
      websocketUrl = backendUrl.replace('http://', 'ws://');
    }
    
    // WebRTC connection info for QR code
    const connectionInfo = {
      type: 'webrtc_connection',
      room: room,
      websocket_url: websocketUrl,
      ice_servers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };
    
    console.log('Generated connection info:', connectionInfo);
    
    const qrCodeData = JSON.stringify(connectionInfo);
    const qrCodeImage = await QRCode.toDataURL(qrCodeData);
    
    res.json({ 
      qr_code: qrCodeImage,
      connection_info: connectionInfo,
      room: room
    });
    
    addLog(`QR code generated for room ${room} with WebSocket URL: ${websocketUrl}`);
  } catch (error) {
    console.error('QR code generation error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});



/** rooms = Map<string, {controllers:Set<WS>, receivers:Set<WS>}> */
const rooms = new Map();

function getRoom(name) {
  if (!rooms.has(name)) rooms.set(name, { controllers: new Set(), receivers: new Set() });
  return rooms.get(name);
}

function safeJsonParse(s) { try { return JSON.parse(s); } catch { return null; } }

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => (ws.isAlive = true));

  ws.on('message', (raw) => {
    const msg = safeJsonParse(raw);
    if (!msg || typeof msg !== 'object') return;

    // Handle log viewer connections
    if (msg.type === 'log_viewer') {
      logViewers.add(ws);
      addLog('Log viewer connected');
      return;
    }

    // First message from a client should be "hello"
    if (msg.type === 'hello') {
      ws.role = msg.role === 'receiver' ? 'receiver' : 'controller';
      ws.room = (msg.room || 'A').toString();
      const r = getRoom(ws.room);
      (ws.role === 'receiver' ? r.receivers : r.controllers).add(ws);
      ws.send(JSON.stringify({ type: 'hello_ack', role: ws.role, room: ws.room }));
      addLog(`New ${ws.role} connected to room ${ws.room}`);
      return;
    }

    // Relay controls only from controllers to receivers in same room
    if (msg.type === 'control' && ws.role === 'controller' && ws.room) {
      const r = getRoom(ws.room);
      for (const rx of r.receivers) {
        if (rx.readyState === WebSocket.OPEN) rx.send(JSON.stringify(msg));
      }
      return;
    }

    // Handle ping from receiver to controller
    if (msg.type === 'ping' && ws.role === 'receiver' && ws.room) {
      const r = getRoom(ws.room);
      addLog(`Ping sent from receiver to controller in room ${ws.room}`);
      for (const ctrl of r.controllers) {
        if (ctrl.readyState === WebSocket.OPEN) ctrl.send(JSON.stringify(msg));
      }
      return;
    }

    // Handle pong from controller back to receiver
    if (msg.type === 'pong' && ws.role === 'controller' && ws.room) {
      const r = getRoom(ws.room);
      addLog(`Pong received from controller in room ${ws.room}`);
      for (const rx of r.receivers) {
        if (rx.readyState === WebSocket.OPEN) rx.send(JSON.stringify(msg));
      }
      return;
    }

    // WebRTC Signaling: Handle WebRTC offer from receiver (PC)
    if (msg.type === 'webrtc_offer' && ws.role === 'receiver' && ws.room) {
      const r = getRoom(ws.room);
      addLog(`WebRTC offer from receiver in room ${ws.room}`);
      for (const ctrl of r.controllers) {
        if (ctrl.readyState === WebSocket.OPEN) ctrl.send(JSON.stringify(msg));
      }
      return;
    }

    // WebRTC Signaling: Handle WebRTC answer from controller (Phone)
    if (msg.type === 'webrtc_answer' && ws.role === 'controller' && ws.room) {
      const r = getRoom(ws.room);
      addLog(`WebRTC answer from controller in room ${ws.room}`);
      for (const rx of r.receivers) {
        if (rx.readyState === WebSocket.OPEN) rx.send(JSON.stringify(msg));
      }
      return;
    }

    // WebRTC Signaling: Handle ICE candidates from either side
    if (msg.type === 'webrtc_ice' && ws.room) {
      const r = getRoom(ws.room);
      const targetRole = ws.role === 'controller' ? 'receivers' : 'controllers';
      addLog(`ICE candidate from ${ws.role} in room ${ws.room}`);
      for (const peer of r[targetRole]) {
        if (peer.readyState === WebSocket.OPEN) peer.send(JSON.stringify(msg));
      }
      return;
    }
  });

  ws.on('close', () => {
    if (!ws.room) return;
    const r = rooms.get(ws.room);
    if (!r) return;
    r.controllers.delete(ws);
    r.receivers.delete(ws);
    logViewers.delete(ws);
    if (ws.role) {
      addLog(`${ws.role} disconnected from room ${ws.room}`);
    }
  });
});

// Heartbeat to clean dead sockets
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 15000);

server.listen(PORT, () => {
  addLog(`🚀 Webhook server running on port ${PORT} (${NODE_ENV})`);
  console.log(`🚀 Server started on port ${PORT} in ${NODE_ENV} mode`);
  console.log(`📡 Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
});
