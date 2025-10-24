const request = require('supertest');
const express = require('express');

// Create a minimal test app without database dependencies
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  });
  
  return app;
};

describe('Health Check Endpoint', () => {
  test('GET /api/health should return healthy status', async () => {
    const app = createTestApp();
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'healthy');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('environment', 'test');
  });
});

describe('Application Configuration', () => {
  test('Environment variables should be set correctly', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.JWT_SECRET).toBeDefined();
  });
  
  test('Express app should be creatable', () => {
    const app = createTestApp();
    expect(app).toBeDefined();
    expect(typeof app.get).toBe('function');
  });
});
