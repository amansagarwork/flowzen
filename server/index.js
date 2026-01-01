const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
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

app.listen(PORT, () => {
    console.log(`FlowZen Server running on http://localhost:${PORT}`);
});
