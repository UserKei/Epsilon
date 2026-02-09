# Auth Module Testing Guide (Final Edition)

This guide covers the philosophy, strategy, and implementation of **Unit Testing** and **End-to-End (E2E) Testing** for the Authentication module in NestJS, with a focus on **Database Safety** and **Type Safety**.

---

## 1. Testing Philosophy & Strategy

### 1.1 Unit Testing: Isolate and Verify
The goal of unit testing is to verify business logic in **isolation**.

*   **Dependency Mocking**: Use `jest-mock-extended` (`mockDeep`) to automatically create type-safe mocks for complex services like `PrismaService`. This prevents "mock drift" where your manual mocks become outdated.
*   **Static Module Mocking**: Use `jest.spyOn(bcrypt, 'hash')` for static libraries. Always `jest.restoreAllMocks()` in `afterEach`.
*   **Controller Logic**: Verify that data flows correctly from DTO -> Service -> Response.

### 1.2 E2E Testing: Full Chain Validation (Safely)
E2E tests verify the **entire request-response cycle** against a real database.

*   **⚠️ CRITICAL: Database Safety**: E2E tests wipe data (`deleteMany`). **You must use a separate test database**. We implement a "Safety Fuse" in code to prevent running against production/dev databases.
*   **Correct Context**: Retrieve `PrismaService` from the NestJS application context (`app.get()`) rather than importing a global instance. This ensures lifecycle hooks (connection/disconnection) work correctly.
*   **Full App Instance**: Manually apply `ValidationPipe` to the test app instance.

---

## 2. Unit Testing Implementation (Type-Safe)

**Prerequisites**:
```bash
pnpm add -D jest-mock-extended
```

### 2.1 AuthService Unit Test
**File**: `apps/api/src/auth/auth.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Role } from '@repo/db';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: DeepMockProxy<PrismaService>; // Type-safe mock
  let jwtService: DeepMockProxy<JwtService>;

  beforeEach(async () => {
    // Generate deep mocks automatically
    prisma = mockDeep<PrismaService>();
    jwtService = mockDeep<JwtService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('register', () => {
    const dto = { username: 'test', password: '123', nickname: 'nick', role: Role.STUDENT };

    it('should successfully register and return user data', async () => {
      // Type-safe mocking
      prisma.client.user.findUnique.mockResolvedValue(null);
      prisma.client.user.create.mockResolvedValue({ id: 1, ...dto, password: 'hashed' } as any);
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashed'));

      const result = await service.register(dto);
      
      expect(result.message).toBeDefined();
      expect(result.user.username).toBe('test');
      expect(prisma.client.user.create).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return token on valid credentials', async () => {
      const mockUser = { id: 1, username: 'test', password: 'hashed', role: Role.STUDENT, status: 'ACTIVE' };
      prisma.client.user.findUnique.mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
      jwtService.sign.mockReturnValue('mock_token');

      const result = await service.login({ username: 'test', password: '123' });

      expect(result.token).toBe('mock_token');
    });
  });
});
```

---

## 3. End-to-End (E2E) Testing Implementation (Safe)

**Setup**:
Ensure you have a test database URL in `.env.test` (e.g., `postgres://.../epsilon_test`).

**File**: `apps/api/test/auth.e2e-spec.ts`

```typescript
import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('Auth Module (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // 1. Get PrismaService from the app context (Correct Dependency Injection)
    prismaService = app.get<PrismaService>(PrismaService);

    // 2. ⚠️ DATABASE SAFETY FUSE ⚠️
    // Prevents accidental deletion of dev/prod data
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl || !dbUrl.includes('_test')) {
      throw new Error(
        'FATAL: E2E tests must be run against a TEST database. ' +
        'Check your DATABASE_URL to ensure it contains "_test".'
      );
    }

    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    // 3. Clean DB using the injected service
    await prismaService.user.deleteMany();
  });

  afterAll(async () => {
    await prismaService.user.deleteMany();
    await app.close(); // Automatically disconnects Prisma
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'e2e_safe', password: 'pw', nickname: 'Safe' })
        .expect(201);
    });
  });
});
```

---

## 4. Execution Commands

### 4.1 Running Unit Tests
```bash
pnpm test --filter api
```

### 4.2 Running E2E Tests (with Environment Isolation)
Use `dotenv-cli` to force the test environment variables.

1.  **Create `.env.test`**:
    ```properties
    DATABASE_URL="postgresql://user:pass@localhost:5432/epsilon_test"
    JWT_SECRET="test_secret"
    ```
2.  **Run Command**:
    ```bash
    # Install dotenv-cli if needed: pnpm add -D dotenv-cli
    dotenv -e .env.test -- jest --config apps/api/test/jest-e2e.json
    ```
