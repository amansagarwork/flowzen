const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const os = require('os');
const { exec } = require('child_process');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// In-memory logs
let LOGS = [
    { timestamp: new Date().toISOString(), level: 'INFO', message: 'FlowZen Brain online (Web Mode).' },
    { timestamp: new Date().toISOString(), level: 'INFO', message: `System: ${os.type()} ${os.release()}` }
];

// Routes
app.get('/api/status', (req, res) => {
    const totalMem = Math.round(os.totalmem() / 1024 / 1024);
    const freeMem = Math.round(os.freemem() / 1024 / 1024);
    const usedMem = totalMem - freeMem;

    res.json({
        status: 'Online',
        issues: 0,
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

app.post('/api/logs/clear', (req, res) => {
    LOGS = []; // Re-assigning to empty array
    LOGS.push({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: 'Terminal logs cleared by user.'
    });
    res.json({ success: true, message: 'Logs cleared.' });
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

app.listen(PORT, () => {
    console.log(`FlowZen Server running on http://localhost:${PORT}`);
});
