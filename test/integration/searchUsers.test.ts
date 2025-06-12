import request from 'supertest';
import app from '../../src/app';

describe('GET /api/users/search (full integration, cookie-based)', () => {
  let cookies: string[];

  beforeAll(async () => {
    // 1) Register two users
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'emily',
        email: 'emily@example.com',
        password: 'plain_pw'
      })
      .expect(201);

    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'emilio',
        email: 'emilio@example.com',
        password: 'plain_pw'
      })
      .expect(201);

    // 2) Log in and grab cookies
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'emily@example.com',
        password: 'plain_pw'
      })
      .expect(200);

    // @ts-ignore
    cookies = loginRes.headers['set-cookie'];
    expect(cookies).toBeDefined();
  });

  it('returns usernames similar to query', async () => {
    const res = await request(app)
      .get('/api/users/search')
      .set('Cookie', cookies)
      .query({ query: 'emil', page: 1, limit: 10 })
      .expect(200);

    expect(
      Array.isArray(res.body.users) &&
      res.body.users.some((u: any) => u.username.includes('emil'))
    ).toBe(true);

    // Optional: assert pagination metadata
    expect(res.body).toMatchObject({
      page: 1,
      limit: 10,
      total: expect.any(Number),
      users: expect.any(Array)
    });
  });
});
