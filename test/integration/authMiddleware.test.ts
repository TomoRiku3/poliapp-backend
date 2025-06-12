import request from 'supertest';
import app from '../../src/app';

describe('Auth middleware protection', () => {
  it('rejects unauthenticated requests with 401', async () => {
    await request(app)
      .get('/api/users/me')
      .expect(401);
  });

  it('allows authenticated requests to proceed with Bearer token', async () => {
    // 1) Register a new user
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'authTester',
        email: 'auth@example.com',
        password: 'secure_pw'
      })
      .expect(201);

    // 2) Log in and grab the token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'auth@example.com',
        password: 'secure_pw'
      })
      .expect(200);

    const token = loginRes.body.token;
    expect(token).toBeDefined();

    // 3) Call protected route with that Bearer token
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toHaveProperty('id');
    expect(res.body.email).toBe('auth@example.com');
  });
});
