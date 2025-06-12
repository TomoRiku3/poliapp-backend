import request from 'supertest';
import app from '../../src/app';

describe('Auth & CSRF middleware protection', () => {
  it('rejects unauthenticated GET /api/users/me with 401', async () => {
    await request(app)
      .get('/api/users/me')
      .expect(401);
  });

  it('rejects POST /api/auth/register without CSRF token', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'authTester', email: 'auth@example.com', password: 'secure_pw' })
      .expect(403);
  });

  it('supports full CSRF + cookie auth flow', async () => {
    let cookies: string[] = [];
    let csrfToken: string;

    // 1) Fetch initial CSRF token
    const csrfRes1 = await request(app)
      .get('/api/csrf-token')
      .expect(200);
    csrfToken = csrfRes1.body.csrfToken;
    cookies = cookies.concat(csrfRes1.headers['set-cookie'] || []);

    // 2) Register with CSRF token
    const registerRes = await request(app)
      .post('/api/auth/register')
      .set('Cookie', cookies)
      .set('X-CSRF-Token', csrfToken)
      .send({ username: 'authTester', email: 'auth@example.com', password: 'secure_pw' })
      .expect(201);
    cookies = cookies.concat(registerRes.headers['set-cookie'] || []);

    // 3) Fetch new CSRF token after register
    const csrfRes2 = await request(app)
      .get('/api/csrf-token')
      .set('Cookie', cookies)
      .expect(200);
    csrfToken = csrfRes2.body.csrfToken;
    cookies = cookies.concat(csrfRes2.headers['set-cookie'] || []);

    // 4) Login with CSRF token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .set('Cookie', cookies)
      .set('X-CSRF-Token', csrfToken)
      .send({ email: 'auth@example.com', password: 'secure_pw' })
      .expect(200);
    cookies = cookies.concat(loginRes.headers['set-cookie'] || []);

    // 5) Call protected endpoint using cookies
    const meRes = await request(app)
      .get('/api/users/me')
      .set('Cookie', cookies)
      .expect(200);

    expect(meRes.body).toHaveProperty('id');
    expect(meRes.body.email).toBe('auth@example.com');
  });
});
