// test/integration/csrfFlow.test.ts
import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { csrfProtection, getCsrfToken } from '../../src/middleware/csrf';

// Create a minimal app for testing CSRF middleware
function createCsrfApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(csrfProtection);

  // CSRF token endpoint
  app.get('/test/csrf-token', getCsrfToken);

  // Protected POST endpoint
  app.post('/test/data', (req: Request, res: Response) => {
    res.json({ success: true, data: req.body });
  });

  // Error handler for CSRF failures
  // @ts-ignore
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err.code === 'EBADCSRFTOKEN') {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }
    next(err);
  });

  return app;
}

describe('In-depth CSRF flow integration', () => {
  let app: ReturnType<typeof createCsrfApp>;

  beforeAll(() => {
    app = createCsrfApp();
  });

  it('GET /test/csrf-token should set a CSRF cookie and return a token', async () => {
    const res = await request(app)
      .get('/test/csrf-token')
      .expect(200);

    expect(res.body).toHaveProperty('csrfToken');
    const cookies = res.headers['set-cookie'];
    expect(cookies).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^_csrf=.*; Path=\/; SameSite=Lax/)  
      ])
    );
  });

  it('POST /test/data without CSRF token should be rejected', async () => {
    // Fetch initial cookie
    const { headers } = await request(app)
      .get('/test/csrf-token')
      .expect(200);
    const cookies = headers['set-cookie'];

    // Attempt POST without X-CSRF-Token header
    const postRes = await request(app)
      .post('/test/data')
      .set('Cookie', cookies)
      .send({ foo: 'bar' })
      .expect(403);

    expect(postRes.body).toEqual({ error: 'Invalid CSRF token' });
  });

  it('POST /test/data with valid CSRF token should succeed', async () => {
    // Step 1: GET token + cookie
    const csrfRes = await request(app)
      .get('/test/csrf-token')
      .expect(200);
    const csrfToken = csrfRes.body.csrfToken;
    let cookies = csrfRes.headers['set-cookie'];

    // Step 2: POST with X-CSRF-Token header and cookie
    const data = { hello: 'world' };
    const successRes = await request(app)
      .post('/test/data')
      .set('Cookie', cookies)
      .set('X-CSRF-Token', csrfToken)
      .send(data)
      .expect(200);

    expect(successRes.body).toEqual({ success: true, data });
  });
});
