# Target Architecture - Netzwächter Refactored

Created: 2025-10-07
Purpose: Define the complete target architecture after all agent work

---

## Overview

**Current State**: Monolithic application with 3,961 LOC storage.ts
**Target State**: Modular monorepo with clean separation of concerns
**Migration Strategy**: Incremental refactoring via specialized agents

---

## Directory Structure

```
netzwaechter-refactored/
├── .agents/                          # Agent coordination (existing)
│   ├── agents/                       # Agent configs
│   ├── state/                        # Orchestrator state
│   └── logs/                         # Agent execution logs
│
├── apps/                             # Applications
│   ├── backend-api/                  # Backend API server
│   │   ├── src/
│   │   │   ├── modules/              # Domain modules
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   ├── auth.repository.ts
│   │   │   │   │   ├── auth.routes.ts
│   │   │   │   │   ├── auth.types.ts
│   │   │   │   │   └── __tests__/
│   │   │   │   ├── users/
│   │   │   │   │   ├── users.controller.ts
│   │   │   │   │   ├── users.service.ts
│   │   │   │   │   ├── users.repository.ts
│   │   │   │   │   ├── users.routes.ts
│   │   │   │   │   ├── users.types.ts
│   │   │   │   │   └── __tests__/
│   │   │   │   ├── objects/
│   │   │   │   │   └── [same structure]
│   │   │   │   ├── energy/
│   │   │   │   │   └── [same structure]
│   │   │   │   ├── temperature/
│   │   │   │   │   └── [same structure]
│   │   │   │   ├── monitoring/
│   │   │   │   │   └── [same structure]
│   │   │   │   ├── ki-reports/
│   │   │   │   │   └── [same structure]
│   │   │   │   └── settings/
│   │   │   │       └── [same structure]
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.ts
│   │   │   │   ├── rate-limit.middleware.ts
│   │   │   │   ├── error-handler.middleware.ts
│   │   │   │   └── validation.middleware.ts
│   │   │   ├── config/
│   │   │   │   ├── database.config.ts
│   │   │   │   ├── email.config.ts
│   │   │   │   ├── session.config.ts
│   │   │   │   └── security.config.ts
│   │   │   ├── scripts/
│   │   │   │   ├── migrate-passwords.ts
│   │   │   │   ├── seed-database.ts
│   │   │   │   └── test-connections.ts
│   │   │   ├── utils/
│   │   │   │   ├── logger.ts
│   │   │   │   ├── crypto.ts
│   │   │   │   └── validators.ts
│   │   │   ├── app.ts                # Express app setup
│   │   │   └── index.ts              # Server entry point
│   │   ├── tests/
│   │   │   ├── integration/
│   │   │   ├── unit/
│   │   │   └── e2e/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── Dockerfile
│   │
│   └── frontend-web/                 # Frontend SPA
│       ├── src/
│       │   ├── features/             # Feature modules
│       │   │   ├── auth/
│       │   │   │   ├── components/
│       │   │   │   ├── hooks/
│       │   │   │   ├── pages/
│       │   │   │   ├── services/
│       │   │   │   └── types/
│       │   │   ├── user-management/
│       │   │   │   └── [same structure]
│       │   │   ├── object-management/
│       │   │   │   └── [same structure]
│       │   │   ├── energy-dashboard/
│       │   │   │   └── [same structure]
│       │   │   ├── temperature-monitor/
│       │   │   │   └── [same structure]
│       │   │   ├── network-monitor/
│       │   │   │   └── [same structure]
│       │   │   ├── ki-reports/
│       │   │   │   └── [same structure]
│       │   │   └── settings/
│       │   │       └── [same structure]
│       │   ├── components/           # Shared UI components
│       │   │   ├── ui/
│       │   │   │   ├── button.tsx
│       │   │   │   ├── card.tsx
│       │   │   │   ├── input.tsx
│       │   │   │   └── [22 components total]
│       │   │   └── layout/
│       │   │       ├── AppLayout.tsx
│       │   │       ├── Sidebar.tsx
│       │   │       └── Header.tsx
│       │   ├── hooks/                # Shared hooks
│       │   │   ├── useAuth.ts
│       │   │   ├── useApi.ts
│       │   │   └── useQueryClient.ts
│       │   ├── lib/                  # Shared utilities
│       │   │   ├── api-client.ts
│       │   │   ├── query-client.ts
│       │   │   └── utils.ts
│       │   ├── styles/               # Global styles
│       │   │   ├── globals.css
│       │   │   ├── design-tokens.ts
│       │   │   └── theme.ts
│       │   ├── App.tsx               # App root
│       │   ├── main.tsx              # Entry point
│       │   └── router.tsx            # Route configuration
│       ├── public/
│       ├── tests/
│       │   ├── components/
│       │   ├── integration/
│       │   └── e2e/
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       └── Dockerfile
│
├── packages/                         # Shared packages
│   ├── shared-types/                 # TypeScript types
│   │   ├── src/
│   │   │   ├── api/
│   │   │   │   ├── auth.types.ts
│   │   │   │   ├── users.types.ts
│   │   │   │   ├── objects.types.ts
│   │   │   │   ├── energy.types.ts
│   │   │   │   └── [all API types]
│   │   │   ├── database/
│   │   │   │   ├── user.model.ts
│   │   │   │   ├── object.model.ts
│   │   │   │   └── [all DB models]
│   │   │   └── common/
│   │   │       ├── pagination.types.ts
│   │   │       ├── filter.types.ts
│   │   │       └── response.types.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── shared-validation/            # Validation schemas
│   │   ├── src/
│   │   │   ├── auth.schemas.ts
│   │   │   ├── users.schemas.ts
│   │   │   ├── objects.schemas.ts
│   │   │   └── [all validation]
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── shared-utils/                 # Shared utilities
│       ├── src/
│       │   ├── date.utils.ts
│       │   ├── string.utils.ts
│       │   ├── number.utils.ts
│       │   └── validation.utils.ts
│       ├── package.json
│       └── tsconfig.json
│
├── infrastructure/                   # Infrastructure code
│   ├── docker/
│   │   ├── Dockerfile.backend
│   │   ├── Dockerfile.frontend
│   │   ├── docker-compose.yml
│   │   ├── docker-compose.prod.yml
│   │   └── .dockerignore
│   ├── nginx/
│   │   ├── nginx.conf
│   │   └── ssl/
│   └── scripts/
│       ├── deploy.sh
│       ├── backup-db.sh
│       └── rollback.sh
│
├── db/                               # Database
│   ├── migrations/
│   │   ├── 0001_initial_schema.sql
│   │   ├── 0002_add_indexes.sql
│   │   └── [migration files]
│   ├── seeds/
│   │   ├── dev-seed.ts
│   │   └── test-seed.ts
│   └── schema.ts                     # Drizzle schema
│
├── docs/                             # Documentation
│   ├── api/
│   │   ├── openapi.yaml
│   │   └── endpoints.md
│   ├── architecture/
│   │   ├── overview.md
│   │   ├── backend-modules.md
│   │   ├── frontend-features.md
│   │   └── database-schema.md
│   ├── deployment/
│   │   ├── docker.md
│   │   ├── production.md
│   │   └── rollback.md
│   └── development/
│       ├── setup.md
│       ├── testing.md
│       └── contributing.md
│
├── scripts/                          # Root-level scripts
│   ├── setup.sh                      # Initial setup
│   ├── test-all.sh                   # Run all tests
│   └── pre-deployment-check.sh       # Deployment verification
│
├── .github/                          # GitHub Actions
│   └── workflows/
│       ├── ci.yml
│       ├── deploy.yml
│       └── security.yml
│
├── pnpm-workspace.yaml               # Monorepo config
├── package.json                      # Root package.json
├── tsconfig.json                     # Root TypeScript config
├── .env.example                      # Environment template
├── .gitignore
├── .eslintrc.json
├── .prettierrc
└── README.md
```

---

## Module Architecture

### Backend Module Structure

Each module follows this pattern:

```typescript
// Example: apps/backend-api/src/modules/users/

// users.types.ts - Type definitions
export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  mandantId: number;
}

export type CreateUserDTO = Omit<User, 'id'>;
export type UpdateUserDTO = Partial<CreateUserDTO>;

// users.repository.ts - Data access layer
export class UsersRepository {
  constructor(private db: Database) {}

  async findById(id: string): Promise<User | null> {
    const result = await this.db
      .select()
      .from(users)
      .leftJoin(userProfiles, eq(users.userProfileId, userProfiles.id))
      .where(eq(users.id, id))
      .limit(1);

    return result[0] || null;
  }

  async findAll(filters?: UserFilters): Promise<User[]> {
    // ... implementation with filters
  }

  async create(data: CreateUserDTO): Promise<User> {
    // ... implementation
  }

  async update(id: string, data: UpdateUserDTO): Promise<User | null> {
    // ... implementation
  }

  async delete(id: string): Promise<boolean> {
    // ... implementation
  }
}

// users.service.ts - Business logic layer
export class UsersService {
  constructor(
    private repository: UsersRepository,
    private crypto: CryptoService
  ) {}

  async getUserById(id: string): Promise<User | null> {
    return this.repository.findById(id);
  }

  async createUser(data: CreateUserDTO): Promise<User> {
    // Hash password
    if (data.password) {
      data.password = await this.crypto.hash(data.password);
    }

    // Validate mandant access
    await this.validateMandantAccess(data.mandantId);

    return this.repository.create(data);
  }

  async updateUser(id: string, data: UpdateUserDTO): Promise<User | null> {
    // Hash password if provided
    if (data.password) {
      data.password = await this.crypto.hash(data.password);
    }

    return this.repository.update(id, data);
  }

  private async validateMandantAccess(mandantId: number): Promise<void> {
    // Validation logic
  }
}

// users.controller.ts - HTTP layer
export class UsersController {
  constructor(private service: UsersService) {}

  async getUser(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const user = await this.service.getUserById(id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  }

  async createUser(req: Request, res: Response): Promise<void> {
    const data = req.body;
    const user = await this.service.createUser(data);
    res.status(201).json(user);
  }

  // ... other endpoints
}

// users.routes.ts - Route definitions
export function createUsersRouter(controller: UsersController): Router {
  const router = Router();

  router.get('/:id', requireAuth, controller.getUser.bind(controller));
  router.post('/', requireAdmin, controller.createUser.bind(controller));
  router.put('/:id', requireAdmin, controller.updateUser.bind(controller));
  router.delete('/:id', requireAdmin, controller.deleteUser.bind(controller));

  return router;
}
```

---

## Frontend Feature Structure

Each feature follows this pattern:

```typescript
// Example: apps/frontend-web/src/features/user-management/

// types/index.ts
export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}

// services/users.service.ts
export const usersService = {
  async getUsers(): Promise<User[]> {
    const response = await apiClient.get('/api/users');
    return response.data;
  },

  async getUser(id: string): Promise<User> {
    const response = await apiClient.get(`/api/users/${id}`);
    return response.data;
  },

  async createUser(data: CreateUserDTO): Promise<User> {
    const response = await apiClient.post('/api/users', data);
    return response.data;
  },
};

// hooks/useUsers.ts
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.getUsers(),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => usersService.getUser(id),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// components/UserList.tsx
export function UserList() {
  const { data: users, isLoading, error } = useUsers();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="user-list">
      {users?.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}

// pages/UsersPage.tsx
export function UsersPage() {
  return (
    <AppLayout>
      <div className="users-page">
        <h1>User Management</h1>
        <UserList />
      </div>
    </AppLayout>
  );
}
```

---

## Shared Packages Structure

### @netzwaechter/shared-types

```typescript
// packages/shared-types/src/api/users.types.ts
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  mandantId: number;
  mandantAccess: number[];
}

export interface CreateUserDTO {
  username: string;
  email: string;
  password: string;
  role: User['role'];
  mandantId: number;
}

export interface UpdateUserDTO {
  email?: string;
  password?: string;
  role?: User['role'];
  mandantAccess?: number[];
}

export interface UserFilters {
  role?: User['role'];
  mandantId?: number;
  search?: string;
}
```

### @netzwaechter/shared-validation

```typescript
// packages/shared-validation/src/users.schemas.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'user', 'viewer']),
  mandantId: z.number().positive(),
});

export const updateUserSchema = createUserSchema.partial();

export const userFiltersSchema = z.object({
  role: z.enum(['admin', 'user', 'viewer']).optional(),
  mandantId: z.number().positive().optional(),
  search: z.string().optional(),
});
```

---

## Module Responsibilities

### 1. Auth Module
- **Responsibilities**: Authentication, session management, password reset
- **Endpoints**: `/api/auth/login`, `/api/auth/logout`, `/api/auth/refresh`
- **Key Files**:
  - `auth.service.ts`: Login logic, password validation, session creation
  - `auth.middleware.ts`: `requireAuth`, `requireAdmin` middleware
  - `auth.repository.ts`: User credential queries

### 2. Users Module
- **Responsibilities**: User CRUD, user profiles, mandant access
- **Endpoints**: `/api/users`, `/api/user-profiles`
- **Key Files**:
  - `users.service.ts`: User business logic, mandant validation
  - `users.repository.ts`: User queries with profile JOINs
  - `users.controller.ts`: HTTP endpoints for user management

### 3. Objects Module
- **Responsibilities**: Object management, object data (objdata JSONB)
- **Endpoints**: `/api/objects`, `/api/objects/:id/data`
- **Key Files**:
  - `objects.service.ts`: Object CRUD, data validation
  - `objects.repository.ts`: Object queries, data transformations
  - `objects.controller.ts`: Object API endpoints

### 4. Energy Module
- **Responsibilities**: Energy consumption tracking, zlog data
- **Endpoints**: `/api/energy/consumption`, `/api/energy/monthly`
- **Key Files**:
  - `energy.service.ts`: Consumption calculations, aggregations
  - `energy.repository.ts`: Zlog queries, day_comp queries
  - `energy.controller.ts`: Energy data APIs

### 5. Temperature Module
- **Responsibilities**: Temperature monitoring, outdoor temperature data
- **Endpoints**: `/api/temperature/current`, `/api/temperature/history`
- **Key Files**:
  - `temperature.service.ts`: Temperature calculations, weather integration
  - `temperature.repository.ts`: Temperature data queries
  - `temperature.controller.ts`: Temperature APIs

### 6. Monitoring Module
- **Responsibilities**: Network monitoring, availability checks, alerts
- **Endpoints**: `/api/monitoring/status`, `/api/monitoring/alerts`
- **Key Files**:
  - `monitoring.service.ts`: Network checks, alert generation
  - `monitoring.repository.ts`: Monitoring data persistence
  - `monitoring.controller.ts`: Monitoring APIs

### 7. KI Reports Module
- **Responsibilities**: AI-generated reports, analytics
- **Endpoints**: `/api/ki-reports`, `/api/ki-reports/:id`
- **Key Files**:
  - `ki-reports.service.ts`: Report generation logic
  - `ki-reports.repository.ts`: Report data queries
  - `ki-reports.controller.ts`: Report APIs

### 8. Settings Module
- **Responsibilities**: Application settings, mandant-specific settings
- **Endpoints**: `/api/settings`, `/api/settings/mandant/:id`
- **Key Files**:
  - `settings.service.ts`: Settings validation, defaults
  - `settings.repository.ts`: Settings CRUD
  - `settings.controller.ts`: Settings APIs

---

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express 4.21.2
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL (via Neon.tech)
- **ORM**: Drizzle ORM 0.39.1
- **Authentication**: express-session + bcrypt
- **Validation**: Zod
- **Testing**: Vitest + Supertest

### Frontend
- **Runtime**: Browser
- **Framework**: React 18.3.1
- **Language**: TypeScript 5.x
- **Build Tool**: Vite 5.4.19
- **Routing**: Wouter 3.3.5
- **State Management**:
  - Server State: React Query 5.60.5
  - Client State: React hooks
- **UI Library**: Custom components (shadcn/ui style)
- **Styling**: Tailwind CSS
- **Testing**: Vitest + Testing Library

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **Database**: PostgreSQL 15+
- **Caching**: Redis (optional)
- **Monorepo**: pnpm workspaces

---

## Migration Path

### Current Structure → Target Structure

```
CURRENT:
server/
  storage.ts (3,961 LOC - MONOLITH)
  controllers/
  routes/
client/
  src/
    pages/ (many unused)
    components/ui/ (many unused)

TARGET:
apps/
  backend-api/
    src/modules/ (8 modules, avg 500 LOC each)
  frontend-web/
    src/features/ (8 features, clean structure)
packages/ (shared code)
```

### Migration Strategy

**Phase 1**: Security Agent fixes critical vulnerabilities in current structure
**Phase 2**: Frontend Agent removes dead code, standardizes patterns
**Phase 3**: Backend Modularization Agent extracts modules from storage.ts
**Phase 4**: DB Optimizer Agent optimizes queries in new structure
**Phase 5**: Docker Agent containerizes refactored application

---

## Success Metrics

### Code Organization
- ✅ Backend modules: 8 clean modules (from 1 monolith)
- ✅ Average module size: ~500 LOC (from 3,961 LOC)
- ✅ Frontend features: 8 feature modules (from mixed pages)
- ✅ Shared packages: 3 packages (types, validation, utils)

### Code Quality
- ✅ Dead code: 0% (from 15%)
- ✅ Test coverage: >75% (from minimal)
- ✅ TypeScript strict: true
- ✅ ESLint errors: 0

### Performance
- ✅ Bundle size: -200KB minimum
- ✅ Database queries: -50% to -99.5% (N+1 fixes)
- ✅ Connection pool: 60-90% reduction (50 → 10-20)
- ✅ Build time: <45s

### Security
- ✅ Critical vulnerabilities: 0 (from 12)
- ✅ Password security: 100% bcrypt
- ✅ API authentication: 100% protected
- ✅ SSL/TLS: 100% encrypted

---

## Documentation Requirements

After migration, complete documentation includes:

1. **API Documentation** (OpenAPI spec)
2. **Architecture Overview** (this document + diagrams)
3. **Module Documentation** (per-module READMEs)
4. **Deployment Guide** (Docker setup)
5. **Development Guide** (setup, testing, contributing)
6. **Security Guide** (authentication, authorization)

---

## Next Steps

1. ✅ Validation matrix complete
2. ✅ Todo mapping complete
3. 🔄 Target architecture defined (this document)
4. ⏳ Create actual directory structure
5. ⏳ Execute agent migrations
6. ⏳ Generate final documentation

---

**Status**: Architecture design complete
**Next**: Create target directory structure in new folder
**Timeline**: 7-8 weeks with Agent SDK parallel execution
