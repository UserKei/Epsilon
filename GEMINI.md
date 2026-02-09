# Epsilon Project Context

## Project Overview

**Epsilon** is a full-stack monorepo managed by [Turborepo](https://turbo.build/repo). It integrates a modern web frontend with a robust backend API, utilizing shared packages for type safety, database access, and UI consistency.

### Architecture

The project is structured into **Applications** and **Packages**:

**Applications (`apps/`):**

*   **`web`**: A [Next.js](https://nextjs.org/) 16 application (React 19) styled with Tailwind CSS. It serves as the primary user interface.
*   **`api`**: A [NestJS](https://nestjs.com/) application providing RESTful endpoints. It handles authentication (Passport, JWT), business logic, and database interactions.

**Packages (`packages/`):**

*   **`database` (`@repo/db`)**: Contains the Prisma schema and client for PostgreSQL interactions. It exports the database client used by the API.
*   **`ui` (`@repo/ui`)**: A shared React component library to ensure design consistency across frontend applications.
*   **`eslint-config` (`@repo/eslint-config`)**: Shared ESLint configurations to enforce code quality.
*   **`typescript-config` (`@repo/typescript-config`)**: Shared TypeScript `tsconfig.json` bases.

## Getting Started

### Prerequisites

*   **Node.js**: >= 18
*   **Package Manager**: `pnpm` (version 9.0.0 is specified)

### Installation

Install dependencies from the root directory:

```bash
pnpm install
```

### Development

To start the development servers for all applications and packages simultaneously:

```bash
pnpm dev
```
This runs `turbo run dev`, which typically starts:
*   `apps/web` on http://localhost:3000
*   `apps/api` (NestJS defaults usually to 3000, but in monorepos likely configured to 3001 or similar - check `main.ts` or env vars).

### Building

To build all apps and packages:

```bash
pnpm build
```

## Database Management

The database logic is centralized in `packages/database`.

*   **Generate Client**: `pnpm db:generate` (Runs `prisma generate`)
*   **Migrate Dev**: `pnpm db:migrate` (Runs `prisma migrate dev`)
*   **Deploy Migrations**: `pnpm db:deploy` (Runs `prisma migrate deploy`)

> Note: These scripts are defined in the root `turbo.json` or `packages/database/package.json` and can be run via `turbo` or directly in the package.

## Development Conventions

*   **Monorepo Tooling**: Uses Turborepo for task orchestration and caching.
*   **Type Safety**: 100% TypeScript across all apps and packages.
*   **Code Style**: Enforced via shared ESLint configs and Prettier.
*   **Component Library**: UI components should be developed in `packages/ui` and consumed by `apps/web`.
*   **Database Access**: Direct database access should be restricted to the `api` (via `@repo/db`). The `web` app should communicate with the database via the `api`.

## Directory Structure

```text
/
├── apps/
│   ├── api/          # NestJS Backend
│   └── web/          # Next.js Frontend
├── packages/
│   ├── database/     # Prisma Schema & Client
│   ├── ui/           # Shared React Components
│   ├── eslint-config/# Shared Linting Config
│   └── typescript-config/ # Shared TS Config
├── turbo.json        # Turborepo Configuration
├── package.json      # Root Scripts & Dependencies
└── README.md         # General Documentation
```
