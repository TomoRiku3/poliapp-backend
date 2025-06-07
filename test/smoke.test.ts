import request from 'supertest';
import app from '../src/app';

describe('Smoke Test', () => {
  it('GET / should return 200 and Hello, world!', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/Hello, world!/);
  });
});
