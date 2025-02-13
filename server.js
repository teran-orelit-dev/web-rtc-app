const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 3000 });

let clients = [];

wss.on('connection', (ws) => {
    console.log('New client connected');

    clients.push(ws);

    ws.on('message', (message) => {
        let data = JSON.parse(message);

        console.log('Received:', data);

        // Broadcast the message to the other peer
        clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        clients = clients.filter(client => client !== ws);
    });
});

console.log('WebSocket server is running on ws://localhost:3000');
