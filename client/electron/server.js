const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const os = require('os');
const { exec } = require('child_process');

// Function to start the server
function startServer() {
    const app = express();
    // Use port 5000 or let OS choose if 5000 is taken, but for MVP we hardcode 5000
    // In a real desktop app, better to use port 0 and communicate the port to the renderer via IPC
    const PORT = 5000;

    app.use(cors());
    app.use(bodyParser.json());

    // In-memory logs
    const LOGS = [
        { timestamp: new Date().toISOString(), level: 'INFO', message: 'FlowZen Brain online.' },
        { timestamp: new Date().toISOString(), level: 'INFO', message: `System: ${os.type()} ${os.release()}` }
    ];

    // Routes
    app.get('/api/status', (req, res) => {
        const totalMem = Math.round(os.totalmem() / 1024 / 1024);
        const freeMem = Math.round(os.freemem() / 1024 / 1024);
        const usedMem = totalMem - freeMem;

        res.json({
            status: 'Online',
            issues: 0, // Placeholder
            lastBuild: 'Ready',
            system: {
                platform: os.platform(),
                uptime: Math.floor(os.uptime()) + 's',
                memory: `${usedMem} / ${totalMem} MB`
            }
        });
    });

    app.get('/api/logs', (req, res) => {
        res.json(LOGS);
    });

    app.post('/api/action', (req, res) => {
        const { action } = req.body;

        // Log the command attempt
        LOGS.push({
            timestamp: new Date().toISOString(),
            level: 'CMD',
            message: `> ${action}`
        });

        // Execute real system command
        exec(action, { cwd: process.cwd() }, (error, stdout, stderr) => {
            if (error) {
                LOGS.push({
                    timestamp: new Date().toISOString(),
                    level: 'ERROR',
                    message: error.message
                });
                return;
            }
            if (stderr) {
                LOGS.push({
                    timestamp: new Date().toISOString(),
                    level: 'WARN',
                    message: stderr
                });
            }
            if (stdout) {
                // Split multi-line output into individual logs
                const lines = stdout.split('\n').filter(line => line.trim());
                lines.forEach(line => {
                    LOGS.push({
                        timestamp: new Date().toISOString(),
                        level: 'INFO',
                        message: line.trim()
                    });
                });
            }
        });

        res.json({ success: true, message: `Command '${action}' sent to system.` });
    });

    const server = app.listen(PORT, 'localhost', () => {
        console.log(`FlowZen Internal Server running on http://localhost:${PORT}`);
    });

    return server;
}

module.exports = { startServer };
