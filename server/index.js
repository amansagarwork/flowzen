const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const os = require('os');
const { exec } = require('child_process');
const { ApolloServer, gql } = require('apollo-server-express');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// Initialize Prisma Client
console.log('🔗 Database URL:', process.env.DATABASE_URL);
const prisma = new PrismaClient();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// In-memory logs
let LOGS = [
    { timestamp: new Date().toISOString(), level: 'INFO', message: 'FlowZen Brain online (Web Mode).' },
    { timestamp: new Date().toISOString(), level: 'INFO', message: `System: ${os.type()} ${os.release()}` }
];

// GraphQL Schema
const typeDefs = gql`
  type User {
    id: ID!
    username: String
    email: String!
    createdAt: String!
    updatedAt: String!
    onboardingCompleted: Boolean!
    projectInterests: [String!]
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  input RegisterInput {
    email: String!
    password: String!
  }

  input OnboardingInput {
    username: String!
    projectInterests: [String!]
  }

  input LoginInput {
    email: String!
    password: String!
  }

  type Query {
    me: User
    users: [User!]!
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    completeOnboarding(input: OnboardingInput!): User!
  }
`;

// GraphQL Resolvers
const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      
      try {
        // Find user by ID from context
        const user = await prisma.user.findUnique({
          where: { id: context.user.id }
        });
        
        if (!user) {
          throw new Error('User not found');
        }
        
        return user;
      } catch (error) {
        console.error('Database error:', error);
        throw new Error('Database connection error');
      }
    },
    
    users: async () => {
      try {
        // Return all users without passwords
        return await prisma.user.findMany({
          select: {
            id: true,
            username: true,
            email: true,
            createdAt: true,
            updatedAt: true
          }
        });
      } catch (error) {
        console.error('Database error:', error);
        throw new Error('Database connection error');
      }
    }
  },

  Mutation: {
    register: async (parent, { input }) => {
      const { email, password } = input;
      console.log('🔧 Registration attempt:', { email, password });

      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email }
        });
        
        console.log('🔍 Existing user check:', existingUser);
        
        if (existingUser) {
          throw new Error('User already exists with this email');
        }

        // Hash password
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('🔐 Password hashed successfully');

        // Create new user (username will be set during onboarding)
        const newUser = await prisma.user.create({
          data: {
            username: null,
            email,
            password: hashedPassword,
            onboardingCompleted: false,
            projectInterests: []
          }
        });

        console.log('✅ User created in database:', newUser);

        // Generate JWT token
        const token = jwt.sign(
          { userId: newUser.id, email: newUser.email },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        console.log('🎫 JWT Token generated');

        // Return user without password
        const { password: _, ...userWithoutPassword } = newUser;

        return {
          token,
          user: userWithoutPassword
        };
      } catch (error) {
        console.error('❌ Registration error:', error.message);
        if (error.message.includes('already exists')) {
          throw error;
        }
        throw new Error('Registration failed');
      }
    },

    completeOnboarding: async (parent, { input }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const { username, projectInterests } = input;

      try {
        // Update user with onboarding data
        const updatedUser = await prisma.user.update({
          where: { id: context.user.id },
          data: {
            username,
            projectInterests: projectInterests || [],
            onboardingCompleted: true
          }
        });

        console.log('✅ Onboarding completed for user:', updatedUser);
        return updatedUser;
      } catch (error) {
        console.error('❌ Onboarding error:', error);
        throw new Error('Onboarding failed');
      }
    },

    login: async (parent, { input }) => {
      const { email, password } = input;

      try {
        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email }
        });
        
        if (!user) {
          throw new Error('Invalid credentials');
        }

        // Verify password
        const bcrypt = require('bcryptjs');
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          throw new Error('Invalid credentials');
        }

        // Generate JWT token
        const token = jwt.sign(
          { userId: user.id, email: user.email },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;

        return {
          token,
          user: userWithoutPassword
        };
      } catch (error) {
        console.error('Login error:', error);
        if (error.message === 'Invalid credentials') {
          throw error;
        }
        throw new Error('Login failed');
      }
    }
  }
};

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
  try {
    await server.start();
    server.applyMiddleware({ app, path: '/graphql' });

    app.listen(PORT, () => {
      console.log(`FlowZen Server running on http://localhost:${PORT}`);
      console.log(`GraphQL Playground: http://localhost:${PORT}/graphql`);
      console.log(`Database connected with Prisma Accelerate`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
}

startServer();

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});
