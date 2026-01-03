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
    authProvider: String
    avatarUrl: String
    googleSub: String
    projects: [Project!]
    githubUsername: String
    githubConnected: Boolean
  }

  type GithubRepo {
    id: ID!
    name: String!
    fullName: String!
    description: String
    url: String!
    updatedAt: String!
  }

  type Project {
    id: ID!
    name: String!
    description: String
    status: String!
    health: String!
    lastAccessedAt: String!
    currentVersion: String!
    githubRepo: String
    githubConnected: Boolean
    createdAt: String!
    updatedAt: String!
    userId: String!
  }

  input ProjectInput {
    name: String!
    description: String
  }

  type AuthPayload {
    token: String!
    user: User!
    isNewUser: Boolean
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

  input GoogleLoginInput {
    idToken: String!
  }

  type Query {
    me: User
    users: [User!]!
    projects: [Project!]!
    githubAuthUrl: String!
    githubRepositories: [GithubRepo!]!
    projectByName(name: String!): Project
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    completeOnboarding(input: OnboardingInput!): User!
    loginWithGoogle(input: GoogleLoginInput!): AuthPayload!
    connectGithubAccount(code: String!): User!
    createProject(input: ProjectInput!): Project!
    linkProjectToGithub(projectId: ID!, repoFullName: String!): Project!
    checkInProject(id: ID!, version: String!): Project!
    connectGithub(id: ID!, repo: String!): Project!
    deleteProject(id: ID!): Boolean!
  }
`;

// GraphQL Resolvers
const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (!context.user) throw new Error('Not authenticated');
      try {
        const user = await prisma.user.findUnique({
          where: { id: context.user.id },
          include: { projects: true }
        });
        if (!user) throw new Error('User not found');
        return { ...user, githubConnected: !!user.githubAccessToken };
      } catch (error) {
        console.error('Database error:', error);
        throw new Error('Database connection error');
      }
    },
    users: async () => {
      try {
        return await prisma.user.findMany({
          select: {
            id: true, username: true, email: true, createdAt: true, updatedAt: true,
            authProvider: true, avatarUrl: true, googleSub: true, projects: true
          }
        });
      } catch (error) {
        console.error('Database error:', error);
        throw new Error('Database connection error');
      }
    },
    projects: async (parent, args, context) => {
      if (!context.user) throw new Error('Not authenticated');
      try {
        return await prisma.project.findMany({
          where: { userId: context.user.id },
          orderBy: { lastAccessedAt: 'desc' }
        });
      } catch (error) {
        console.error('Error fetching projects:', error);
        throw new Error('Failed to fetch projects');
      }
    },
    githubAuthUrl: () => {
      const clientId = process.env.GITHUB_CLIENT_ID || 'your-github-client-id';
      const redirectUri = 'http://localhost:3000/github/callback';
      return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=repo,user`;
    },
    githubRepositories: async (parent, args, context) => {
      if (!context.user) throw new Error('Not authenticated');
      const user = await prisma.user.findUnique({ where: { id: context.user.id } });
      if (!user || !user.githubAccessToken) throw new Error('GitHub account not connected');
      try {
        const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
          headers: {
            'Authorization': `token ${user.githubAccessToken}`,
            'User-Agent': 'FlowZen-App'
          }
        });
        const repos = await response.json();
        if (!Array.isArray(repos)) return [];
        return repos.map(repo => ({
          id: repo.id.toString(), name: repo.name, fullName: repo.full_name,
          description: repo.description, url: repo.html_url, updatedAt: repo.updated_at
        }));
      } catch (error) {
        console.error('Error fetching GitHub repos:', error);
        return [];
      }
    },
    projectByName: async (parent, { name }, context) => {
      if (!context.user) throw new Error('Not authenticated');
      try {
        const project = await prisma.project.findFirst({
          where: { userId: context.user.id, name: { equals: name, mode: 'insensitive' } }
        });
        if (!project) throw new Error('Project not found');
        return project;
      } catch (error) {
        console.error('Error fetching project by name:', error);
        throw new Error('Failed to fetch project');
      }
    }
  },
  User: {
    githubConnected: (parent) => !!parent.githubAccessToken,
    projects: async (parent) => {
      return await prisma.project.findMany({ where: { userId: parent.id } });
    }
  },
  Project: {
    githubConnected: (parent) => !!parent.githubConnected,
    githubRepo: (parent) => parent.githubRepo || ""
  },
  Mutation: {
    register: async (parent, { input }) => {
      const { email, password } = input;
      try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) throw new Error('User already exists');
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
          data: { email, password: hashedPassword, onboardingCompleted: false, projectInterests: [] }
        });
        const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '24h' });
        const { password: _, ...userWithoutPassword } = newUser;
        return { token, user: userWithoutPassword, isNewUser: false };
      } catch (error) {
        throw new Error(error.message || 'Registration failed');
      }
    },
    login: async (parent, { input }) => {
      const { email, password } = input;
      try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) throw new Error('Invalid credentials');
        const bcrypt = require('bcryptjs');
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) throw new Error('Invalid credentials');
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
        const { password: _, ...userWithoutPassword } = user;
        return { token, user: userWithoutPassword, isNewUser: false };
      } catch (error) {
        throw new Error('Login failed');
      }
    },
    completeOnboarding: async (parent, { input }, context) => {
      if (!context.user) throw new Error('Not authenticated');
      const { username, projectInterests } = input;
      try {
        return await prisma.user.update({
          where: { id: context.user.id },
          data: { username, projectInterests: projectInterests || [], onboardingCompleted: true }
        });
      } catch (error) {
        throw new Error('Onboarding failed');
      }
    },
    loginWithGoogle: async (parent, { input }) => {
      const { idToken } = input;
      const { OAuth2Client } = require('google-auth-library');
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      try {
        const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload();
        const { sub: googleSub, email, name, picture: avatarUrl } = payload;
        if (!email) throw new Error('Email is required from Google');
        let user = await prisma.user.findFirst({ where: { OR: [{ googleSub }, { email }] } });
        let isNewUser = false;
        if (!user) {
          user = await prisma.user.create({
            data: { email, username: name || email.split('@')[0], authProvider: 'google', googleSub, avatarUrl, onboardingCompleted: false, projectInterests: [] }
          });
          isNewUser = true;
        } else if (!user.googleSub) {
          user = await prisma.user.update({ where: { id: user.id }, data: { authProvider: 'google', googleSub, avatarUrl: avatarUrl || user.avatarUrl } });
        }
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
        const { password: _, ...userWithoutPassword } = user;
        return { token, user: { ...userWithoutPassword, isNewUser, githubConnected: !!user.githubAccessToken } };
      } catch (error) {
        throw new Error('Google authentication failed');
      }
    },
    connectGithubAccount: async (parent, { code }, context) => {
      console.log("🐙 connectGithubAccount Mutation started");
      if (!context.user) throw new Error('Not authenticated');
      const clientId = process.env.GITHUB_CLIENT_ID || 'your-github-client-id';
      const clientSecret = process.env.GITHUB_CLIENT_SECRET || 'your-github-client-secret';

      try {
        console.log("🐙 Exchanging code for access_token...");
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code })
        });
        const tokenData = await tokenResponse.json();
        console.log("🐙 GitHub Token Data:", tokenData);

        if (tokenData.error) {
          console.error("🐙 GitHub Token Error:", tokenData.error_description || tokenData.error);
          throw new Error(tokenData.error_description || tokenData.error);
        }

        console.log("🐙 Fetching GitHub user profile...");
        const userResponse = await fetch('https://api.github.com/user', {
          headers: { 'Authorization': `token ${tokenData.access_token}`, 'User-Agent': 'FlowZen-App' }
        });
        const userData = await userResponse.json();
        console.log("🐙 GitHub User Profile:", userData.login);

        const updatedUser = await prisma.user.update({
          where: { id: context.user.id },
          data: { githubAccessToken: tokenData.access_token, githubUsername: userData.login }
        });

        console.log("🐙 User updated successfully in database:", updatedUser.githubUsername);
        return { ...updatedUser, githubConnected: true };
      } catch (error) {
        console.error("🐙 GitHub Connection Error:", error.message);
        throw new Error('Failed to connect GitHub: ' + error.message);
      }
    },
    createProject: async (parent, { input }, context) => {
      if (!context.user) throw new Error('Not authenticated');
      const { name, description } = input;
      try {
        return await prisma.project.create({ data: { name, description, userId: context.user.id } });
      } catch (error) {
        throw new Error('Failed to create project');
      }
    },
    linkProjectToGithub: async (parent, { projectId, repoFullName }, context) => {
      console.log(`🐙 linking project ${projectId} to repo ${repoFullName}`);
      if (!context.user) throw new Error('Not authenticated');
      try {
        const updated = await prisma.project.update({
          where: { id: projectId, userId: context.user.id },
          data: { githubRepo: repoFullName, githubConnected: true }
        });
        console.log("🐙 project updated successfully:", updated.id, "Connected:", updated.githubConnected);
        return updated;
      } catch (error) {
        console.error("🐙 error linking project:", error.message);
        throw new Error('Failed to link project to GitHub: ' + error.message);
      }
    },
    checkInProject: async (parent, { id, version }, context) => {
      if (!context.user) throw new Error('Not authenticated');
      try {
        return await prisma.project.update({
          where: { id, userId: context.user.id },
          data: { lastAccessedAt: new Date(), currentVersion: version }
        });
      } catch (error) {
        throw new Error('Failed to check in project');
      }
    },
    connectGithub: async (parent, { id, repo }, context) => {
      if (!context.user) throw new Error('Not authenticated');
      try {
        return await prisma.project.update({
          where: { id, userId: context.user.id },
          data: { githubRepo: repo, githubConnected: true }
        });
      } catch (error) {
        throw new Error('Failed to connect GitHub');
      }
    },
    deleteProject: async (parent, { id }, context) => {
      if (!context.user) throw new Error('Not authenticated');
      try {
        await prisma.project.delete({
          where: { id, userId: context.user.id }
        });
        return true;
      } catch (error) {
        console.error("🐙 Error deleting project:", error.message);
        throw new Error('Failed to delete project');
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
