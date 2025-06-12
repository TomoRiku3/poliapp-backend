// test/utils/auth.ts
import request from 'supertest';
import app from '../../src/app';

export async function getAuthCookies(
  username: string,
  email: string,
  password: string
): Promise<string[]> {
  // register (ignore 409 if you’ve already run it once)
  await request(app)
    .post('/api/auth/register')
    .send({ username, email, password })
    .expect(res => {
      if (![201, 409].includes(res.status)) throw new Error();
    });

  // login and pull out cookies
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email, password })
    .expect(200);

  const cookies = login.headers['set-cookie'];
  if (!cookies) throw new Error('No auth cookie set');
  // @ts-ignore
  return cookies;
}
