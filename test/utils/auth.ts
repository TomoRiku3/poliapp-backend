// test/utils/auth.ts
import request from 'supertest';
import app from '../../src/app';

/**
 * Registers and logs in a user, handling CSRF tokens and cookies.
 * Returns all cookies required for authenticated requests.
 */
export async function getAuthCookies(
  username: string,
  email: string,
  password: string
): Promise<string[]> {
  let cookies: string[] = [];

  // 1) Fetch initial CSRF token and secret cookie
  const csrfRes1 = await request(app)
    .get('/api/csrf-token')
    .expect(200);
  const csrfToken1 = csrfRes1.body.csrfToken;
  cookies = cookies.concat(csrfRes1.headers['set-cookie'] || []);

  // 2) Register (ignore 409 if already exists)
  const registerRes = await request(app)
    .post('/api/auth/register')
    .set('Cookie', cookies)
    .set('X-CSRF-Token', csrfToken1)
    .send({ username, email, password })
    .expect(res => {
      if (![201, 409].includes(res.status)) throw new Error('Unexpected register status');
    });
  cookies = cookies.concat(registerRes.headers['set-cookie'] || []);

  // 3) Fetch a fresh CSRF token with updated cookies
  const csrfRes2 = await request(app)
    .get('/api/csrf-token')
    .set('Cookie', cookies)
    .expect(200);
  const csrfToken2 = csrfRes2.body.csrfToken;
  cookies = cookies.concat(csrfRes2.headers['set-cookie'] || []);

  // 4) Login and capture auth cookie
  const loginRes = await request(app)
    .post('/api/auth/login')
    .set('Cookie', cookies)
    .set('X-CSRF-Token', csrfToken2)
    .send({ email, password })
    .expect(200);
  cookies = cookies.concat(loginRes.headers['set-cookie'] || []);

  return cookies;
}
