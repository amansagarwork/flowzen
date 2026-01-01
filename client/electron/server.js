const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Function to start the server
function startServer() {
    const app = express();
    // Use port 5000 or let OS choose if 5000 is taken, but for MVP we hardcode 5000
    // In a real desktop app, better to use port 0 and communicate the port to the renderer via IPC
    const PORT = 5000;

    app.use(cors());
    app.use(bodyParser.json());

    // Mock Data for MVP
    const PROJECT_STATUS = {
        status: 'Active',
        issues: 3,
        lastBuild: 'Success'
    };

    const LOGS = [
        { timestamp: new Date().toISOString(), level: 'INFO', message: 'FlowZen Brain started.' },
        { timestamp: new Date().toISOString(), level: 'WARN', message: 'High memory usage detected (mock).' }
    ];

    // Routes
    app.get('/api/status', (req, res) => {
        res.json(PROJECT_STATUS);
    });

    app.get('/api/logs', (req, res) => {
        res.json(LOGS);
    });

    app.post('/api/action', (req, res) => {
        const { action } = req.body;
        console.log(`Received action: ${action}`);

        // Simulate action execution
        const newLog = {
            timestamp: new Date().toISOString(),
            level: 'INFO',
            message: `Executed action: ${action}`
        };
        LOGS.push(newLog);

        res.json({ success: true, message: `Action ${action} initiated.` });
    });

    const server = app.listen(PORT, 'localhost', () => {
        console.log(`FlowZen Internal Server running on http://localhost:${PORT}`);
    });

    return server;
}

module.exports = { startServer };
