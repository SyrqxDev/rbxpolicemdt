const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

let messages = [];
let sockets = [];

// WebSocket connections
wss.on('connection', (ws) => {
    sockets.push(ws);

    ws.on('message', (msg) => {
        console.log('From Web:', msg);
        const message = { from: 'web', text: msg, timestamp: Date.now() };
        messages.push(message);
    });

    ws.on('close', () => {
        sockets = sockets.filter(s => s !== ws);
    });
});

// Roblox posts message
app.post('/from-roblox', (req, res) => {
    const message = { from: 'roblox', text: req.body.text, timestamp: Date.now() };
    messages.push(message);

    // Broadcast to all web clients
    sockets.forEach(ws => {
        ws.send(JSON.stringify(message));
    });

    res.sendStatus(200);
});

// Roblox fetches new messages
app.get('/to-roblox', (req, res) => {
    const robloxMessages = messages.filter(msg => msg.from === 'web');
    res.json(robloxMessages);
    // Clear web messages after sending to Roblox
    messages = messages.filter(msg => msg.from !== 'web');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));