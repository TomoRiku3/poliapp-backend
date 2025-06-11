import request from 'supertest';
import app from '../../src/app'; // Your express app
import { AppDataSource } from '../../src/config/data-source';
import { User } from '../../src/entities/User';

describe('GET /api/users/search', () => {
  beforeAll(async () => {
    const repo = AppDataSource.getRepository(User);
    await repo.save([
      { username: 'emily', email: 'tomo@example.com', passwordHash: 'x' },
      { username: 'emilia', email: 'tommy@example.com', passwordHash: 'x' },
      { username: 'alice', email: 'alice@example.com', passwordHash: 'x' }
    ]);
  });

  it('returns usernames similar to query', async () => {
    const res = await request(app).get('/api/users/search?query=emily');
    expect(res.status).toBe(200);
    expect(res.body.users.some((u: any) => u.username.includes('emily'))).toBe(true);
  });
});
