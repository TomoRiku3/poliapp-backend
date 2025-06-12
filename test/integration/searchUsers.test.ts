import request from 'supertest';
import app from '../../src/app';
import { getAuthCookies } from '../utils/auth';

describe('GET /api/users/search (full integration, cookie-based)', () => {
  let cookies: string[];

  beforeAll(async () => {
    cookies = await getAuthCookies(
      'emily',
      'emily@example.com',
      'plain_pw'
    );
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
