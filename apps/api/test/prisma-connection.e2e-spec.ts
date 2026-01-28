import 'dotenv/config';
import { prisma } from '@repo/db';

describe('Prsima Connection', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should connect to the database and query users count', async () => {
    console.log('DB URL:', process.env.DATABASE_URL);
    // 动作：查询用户数量
    const userCount = await prisma.user.count();
    expect(typeof userCount).toBe('number');
    expect(userCount).toBeGreaterThanOrEqual(0);
    console.log(`Verified: Found ${userCount} users in database.`);
  });
});
