const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const os = require('os');
const { exec } = require('child_process');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { typeDefs, resolvers } = require('./schema');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// In-memory logs
let LOGS = [
    { timestamp: new Date().toISOString(), level: 'INFO', message: 'FlowZen Brain online (Web Mode).' },
    { timestamp: new Date().toISOString(), level: 'INFO', message: `System: ${os.type()} ${os.release()}` }
];

// Create Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    // Get Authorization header
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    
    // Verify token and get user
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // In a real app, you'd fetch user from database
        // For demo, we'll return the decoded info
        return { user: { id: decoded.userId, email: decoded.email } };
      } catch (error) {
        // Invalid token
        return { user: null };
      }
    }
    
    return { user: null };
  }
});

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

// Start server
async function startServer() {
  await server.start();
  
  app.use('/graphql', expressMiddleware(server));
  
  app.listen(PORT, () => {
      console.log(`FlowZen Server running on http://localhost:${PORT}`);
      console.log(`GraphQL Playground: http://localhost:${PORT}/graphql`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
