// Jest setup file
require('dotenv').config();

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'HmHyRrH3+UwZrfY1em4v7Ie3Iy5bCZ6Vz+0M9sebC08=';
process.env.DATABASE_URL = 'postgres://postgres:0000@localhost:5432/aiCareer_test';

// Mock external services for testing
jest.mock('@pinecone-database/pinecone');
jest.mock('@supabase/supabase-js');
jest.mock('stripe');

// Mock database connection to avoid connection issues during tests
jest.mock('./config/db', () => ({
  sequelize: {
    sync: jest.fn().mockResolvedValue(true),
    authenticate: jest.fn().mockResolvedValue(true)
  },
  testConnection: jest.fn().mockResolvedValue(true)
}));

// Mock socket.io to avoid server startup issues
jest.mock('socket.io', () => ({
  Server: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    to: jest.fn().mockReturnThis()
  }))
}));

// Mock cron jobs to prevent them from running during tests
jest.mock('node-cron', () => ({
  schedule: jest.fn()
}));

// Global test timeout
jest.setTimeout(10000);
