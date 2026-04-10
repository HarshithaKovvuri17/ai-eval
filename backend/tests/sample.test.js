const request = require('supertest');
const express = require('express');

// Mock a simple app for testing setup
const app = express();
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

describe('Infrastructure Setup Test', () => {
  it('should verify that the test environment is working', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});
