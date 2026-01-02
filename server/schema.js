const { gql } = require('graphql-tag');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// In-memory user storage (for demo purposes)
const users = [];
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const typeDefs = gql`
  type User {
    id: ID!
    username: String
    email: String!
    createdAt: String!
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

const resolvers = {
  Query: {
    me: (parent, args, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }
      // Find user by ID from context
      const user = users.find(u => u.id === context.user.id);
      if (!user) {
        throw new Error('User not found');
      }
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    },
    users: () => {
      // Return users without passwords
      return users.map(({ password, ...user }) => user);
    }
  },

  Mutation: {
    register: async (parent, { input }) => {
      const { email, password } = input;

      // Check if user already exists
      const existingUser = users.find(user => user.email === email);
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user (username will be set during onboarding)
      const newUser = {
        id: String(users.length + 1),
        username: null,
        email,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        onboardingCompleted: false,
        projectInterests: []
      };

      users.push(newUser);

      // Generate JWT token
      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Return user without password
      const { password: _, ...userWithoutPassword } = newUser;

      return {
        token,
        user: userWithoutPassword
      };
    },

    completeOnboarding: async (parent, { input }, context) => {
      if (!context.user) {
        throw new Error('Not authenticated');
      }

      const { username, projectInterests } = input;

      // Find user by ID from context
      const userIndex = users.findIndex(u => u.id === context.user.id);
      if (userIndex === -1) {
        throw new Error('User not found');
      }

      // Update user with onboarding data
      users[userIndex] = {
        ...users[userIndex],
        username,
        projectInterests: projectInterests || [],
        onboardingCompleted: true
      };

      // Return updated user without password
      const { password: _, ...userWithoutPassword } = users[userIndex];
      return userWithoutPassword;
    },

    login: async (parent, { input }) => {
      const { email, password } = input;

      // Find user by email
      const user = users.find(u => u.email === email);
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Verify password
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
    }
  }
};

module.exports = { typeDefs, resolvers };
