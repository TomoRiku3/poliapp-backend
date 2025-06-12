import request from 'supertest';
import app from '../../src/app';

describe('Auth middleware protection (cookie-based)', () => {
  it('rejects unauthenticated requests with 401', async () => {
    await request(app)
      .get('/api/users/me')
      .expect(401);
  });

  it('allows authenticated requests to proceed with cookies', async () => {
    // 1) Register a new user (sets cookie)
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'authTester',
        email: 'auth@example.com',
        password: 'secure_pw'
      })
      .expect(201);

    // 2) Log in and grab fresh cookie
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'auth@example.com',
        password: 'secure_pw'
      })
      .expect(200);

    const cookies = loginRes.headers['set-cookie'];
    expect(cookies).toBeDefined();

    // 3) Call protected route with that cookie
    const res = await request(app)
      .get('/api/users/me')
      .set('Cookie', cookies)
      .expect(200);

    expect(res.body).toHaveProperty('id');
    expect(res.body.email).toBe('auth@example.com');
  });
});
