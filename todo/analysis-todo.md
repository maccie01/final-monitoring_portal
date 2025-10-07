
## **COMPREHENSIVE CODEBASE ANALYSIS & MODULAR REFACTORING BLUEPRINT PROMPT**

You are tasked with performing an exhaustive, deep-dive analysis of a locally-built monitoring portal codebase to create a comprehensive refactoring blueprint for complete modularization, containerization, and scalable development workflows.[dev**+2**](https://dev.to/tecvanfe/frontend-monorepos-a-comprehensive-guide-2d31)

**CRITICAL CONSTRAINTS:**

* You MUST NOT read documentation files, README files, or comment-based explanations as primary sources
* You MUST analyze actual implementation files (source code, configuration files, dependency manifests)
* You MUST trace actual function calls, imports, and dependencies by reading the code itself
* NO shortcuts, NO assumptions based on file names alone
* Each finding MUST be backed by specific file paths, line numbers, and code excerpts[deepblue.lib.umich**+1**](https://deepblue.lib.umich.edu/bitstream/handle/2027.42/170138/ASE2021_DockerRefactoring__Copy_.pdf)
* do not change files
* only document findings in /todo. create detailed findings files per completed todo. only do one at a time and document straight after and update this file as you go

---

## **PHASE 1: REPOSITORY STRUCTURE DEEP SCAN (30+ Sub-Tasks)**

## **1.1 Root-Level Architecture Discovery**

* [ ] List ALL files and directories at the root level with full paths
* [ ] Identify and read the complete contents of package.json, requirements.txt, Pipfile, Gemfile, go.mod, Cargo.toml, or equivalent dependency files
* [ ] Document EVERY dependency with its version number and purpose classification (runtime, dev, build, test)
* [ ] Identify the primary language(s) and frameworks by analyzing actual import statements in code files
* [ ] Locate and analyze ALL configuration files (tsconfig.json, .eslintrc, webpack.config.js, vite.config.ts, babel.config.js, etc.)
* [ ] Document ALL environment variable files (.env, .env.example, .env.local, .env.production) and list every variable defined
* [ ] Identify build system (Webpack, Vite, Rollup, esbuild, Parcel, etc.) by reading build configuration files
* [ ] Document ALL npm/yarn/pnpm scripts in package.json with their exact commands[jsdev**+1**](https://jsdev.space/complete-monorepo-guide/)

## **1.2 Directory Structure Mapping**

* [ ] Create a complete directory tree showing ALL nested folders up to 6 levels deep
* [ ] Classify each top-level directory (frontend, backend, shared, database, scripts, tests, docs, config, infrastructure, etc.)
* [ ] Count total files in each directory and subdirectory
* [ ] Identify any monorepo indicators (lerna.json, nx.json, pnpm-workspace.yaml, turbo.json, workspaces in package.json)[graphite**+1**](https://graphite.dev/guides/when-to-use-monorepo)
* [ ] Document any build artifacts directories (dist/, build/, out/, .next/, target/)
* [ ] Identify any Docker-related files at ANY level (Dockerfile, docker-compose.yml, .dockerignore)[arxiv**+1**](https://arxiv.org/html/2501.14131v1)

---

## **PHASE 2: BACKEND ARCHITECTURE FORENSICS (40+ Sub-Tasks)**

## **2.1 Backend Framework & Entry Point Analysis**

* [ ] Identify the backend framework by analyzing actual server initialization code (Express, FastAPI, Django, Flask, NestJS, Spring Boot, Gin, etc.)
* [ ] Locate the main entry point file (app.js, main.py, server.ts, index.js, main.go, etc.) and document its full path
* [ ] Read the entire entry point file and extract:
  * Server initialization logic
  * Port configuration
  * Middleware registration order
  * Database connection initialization
  * Environment variable usage
  * Error handling setup
  * Logging configuration[metadesignsolutions**+1**](https://metadesignsolutions.com/from-monolith-to-microservices-a-full-stack-migration-blueprint/)

## **2.2 API Route Discovery & Mapping**

* [ ] Locate ALL route definition files by searching for routing patterns (router, route, app.get, app.post, @app.route, etc.)
* [ ] For EACH API endpoint discovered, document:
  * HTTP method (GET, POST, PUT, DELETE, PATCH)
  * Full URL path with parameters
  * File location and line number
  * Handler function name
  * Middleware applied to that specific route
  * Request validation logic
  * Response structure
* [ ] Create a complete API endpoint inventory table with columns: Method | Path | Handler File | Line Number | Auth Required | Validation Schema
* [ ] Identify API versioning strategy (if any) by analyzing route prefixes
* [ ] Document any REST vs GraphQL vs WebSocket vs gRPC patterns found[microservices**+1**](https://microservices.io/patterns/apigateway.html)

## **2.3 Data Layer Architecture**

* [ ] Identify database type(s) by analyzing connection strings and import statements (PostgreSQL, MySQL, MongoDB, Redis, SQLite, etc.)
* [ ] Locate ALL database configuration files and connection pool settings
* [ ] Find and analyze ALL ORM/ODM usage (Sequelize, TypeORM, Prisma, SQLAlchemy, Mongoose, GORM, etc.)
* [ ] Document ALL model/schema definitions:
  * File paths for each model
  * Entity relationships (one-to-many, many-to-many, foreign keys)
  * Field types and constraints
  * Indexes defined
  * Validation rules at the model level
* [ ] Identify migration files and version history
* [ ] Analyze database query patterns:
  * Raw SQL queries (count and locations)
  * ORM query builder usage
  * Stored procedures or triggers
* [ ] Document transaction handling patterns
* [ ] Identify any caching layers (Redis, Memcached, in-memory) and their usage patterns[metadesignsolutions](https://metadesignsolutions.com/from-monolith-to-microservices-a-full-stack-migration-blueprint/)

## **2.4 Business Logic & Service Layer Analysis**

* [ ] Identify service layer architecture by analyzing code organization:
  * Are services separated from controllers/handlers?
  * Document the directory structure (services/, use-cases/, domain/, etc.)
* [ ] For EACH service module found:
  * List all exported functions/methods
  * Document input parameters and return types
  * Identify dependencies (which services call which services)
  * Find database interactions within service logic
  * Identify external API calls
* [ ] Analyze error handling patterns:
  * Custom error classes defined
  * Error propagation strategy
  * Global error handlers
* [ ] Document validation logic:
  * Input validation libraries (Joi, Zod, Yup, Pydantic, etc.)
  * Where validation occurs (controller vs service layer)
  * Schema definitions for each endpoint
* [ ] Identify any background job processors (Bull, Agenda, Celery, Sidekiq, etc.)
* [ ] Document scheduled tasks/cron jobs
* [ ] Analyze logging implementation:
  * Logging library used
  * Log levels defined
  * Structured logging patterns
  * Log output destinations[metadesignsolutions](https://metadesignsolutions.com/from-monolith-to-microservices-a-full-stack-migration-blueprint/)

## **2.5 Authentication & Authorization Analysis**

* [ ] Identify authentication strategy by reading auth middleware:
  * JWT token-based
  * Session-based
  * OAuth2/OIDC
  * API keys
  * Basic auth
* [ ] Locate token generation/validation logic with exact file paths
* [ ] Document password hashing implementation (bcrypt, argon2, scrypt, etc.)
* [ ] Analyze authorization patterns:
  * Role-based access control (RBAC)
  * Permission-based
  * Route-level vs resource-level
* [ ] Document middleware chain for protected routes
* [ ] Identify session storage mechanism (if applicable)
* [ ] Find refresh token implementation (if JWT-based)[metadesignsolutions](https://metadesignsolutions.com/from-monolith-to-microservices-a-full-stack-migration-blueprint/)

## **2.6 External Integrations & Dependencies**

* [ ] Search for ALL external API calls in the codebase:
  * HTTP client library used (axios, fetch, requests, http, etc.)
  * Base URLs and endpoint patterns
  * Authentication methods for external APIs
* [ ] Document ALL third-party service integrations:
  * Payment processors
  * Email services
  * Cloud storage (S3, Azure Blob, GCS)
  * Analytics services
  * Monitoring/APM tools
* [ ] Analyze any message queue usage (RabbitMQ, Kafka, AWS SQS, etc.)
* [ ] Identify file upload handling and storage patterns
* [ ] Document any webhook implementations (both incoming and outgoing)[metadesignsolutions](https://metadesignsolutions.com/from-monolith-to-microservices-a-full-stack-migration-blueprint/)

---

## **PHASE 3: FRONTEND ARCHITECTURE DECONSTRUCTION (45+ Sub-Tasks)**

## **3.1 Frontend Framework & Build System Analysis**

* [ ] Identify frontend framework by analyzing import patterns and file extensions (React, Vue, Angular, Svelte, Solid, etc.)
* [ ] Locate the main entry point (index.tsx, main.ts, App.tsx, _app.tsx, etc.)
* [ ] Read and document the complete build configuration:
  * Build tool (Vite, Webpack, Create React App, Next.js, etc.)
  * Entry points defined
  * Output directory configuration
  * Asset handling rules
  * Code splitting configuration
  * Environment variable injection
  * Plugin configurations
* [ ] Analyze TypeScript configuration (if applicable):
  * Compiler options
  * Path mappings
  * Module resolution strategy
  * Strict mode settings[javascript.plainenglish**+1**](https://javascript.plainenglish.io/micro-frontends-vs-monorepo-angular-developers-2025-guide-57e970c8e173)

## **3.2 Component Architecture & Structure**

* [ ] Map the complete component hierarchy by analyzing:
  * Total number of components
  * Component organization pattern (feature-based, atomic design, etc.)
  * Directory structure for components
* [ ] For EACH major component (top 20 by LOC):
  * Document file path and line count
  * Identify component type (page, layout, feature, UI/presentational)
  * List all props with types
  * Document state management within the component
  * Identify child components used
  * Document API calls made directly in the component
  * Note any side effects (useEffect, lifecycle methods)
* [ ] Analyze component reusability:
  * Identify shared/common components
  * Find duplicate UI patterns that aren't componentized
  * Document prop drilling patterns
* [ ] Identify styling approach:
  * CSS-in-JS library (styled-components, emotion, etc.)
  * CSS Modules
  * Tailwind CSS
  * Plain CSS/SCSS
  * UI component library (Material-UI, Ant Design, Chakra UI, shadcn/ui, etc.)[dev**+1**](https://dev.to/tecvanfe/frontend-monorepos-a-comprehensive-guide-2d31)

## **3.3 State Management Deep Dive**

* [ ] Identify ALL state management solutions in use:
  * Global state (Redux, Zustand, MobX, Pinia, Vuex, Recoil, Jotai, etc.)
  * Server state (React Query, SWR, Apollo Client, RTK Query, etc.)
  * Form state (React Hook Form, Formik, Zod, etc.)
  * URL state (React Router, Next.js router, etc.)
* [ ] For global state management:
  * Document store structure/slices
  * List ALL actions/mutations defined
  * Document selectors and derived state
  * Analyze async action handling (thunks, sagas, etc.)
  * Identify middleware configuration
* [ ] For server state management:
  * Document ALL query keys/cache keys
  * Analyze cache invalidation strategies
  * Document mutations and optimistic updates
  * Identify prefetching patterns
* [ ] Map data flow from API to component to UI
* [ ] Identify state synchronization patterns between components[dev](https://dev.to/tecvanfe/frontend-monorepos-a-comprehensive-guide-2d31)

## **3.4 Routing & Navigation Analysis**

* [ ] Identify routing library (React Router, Next.js App Router/Pages Router, Vue Router, TanStack Router, etc.)
* [ ] Document ALL routes defined:
  * Path patterns
  * Component/page associated
  * Route guards/protected routes
  * Dynamic route parameters
  * Nested routing structure
* [ ] Analyze code splitting/lazy loading strategy for routes
* [ ] Document navigation patterns (programmatic vs declarative)
* [ ] Identify any route-based data fetching patterns
* [ ] Document authentication guards and redirection logic[javascript.plainenglish](https://javascript.plainenglish.io/micro-frontends-vs-monorepo-angular-developers-2025-guide-57e970c8e173)

## **3.5 API Integration Layer**

* [ ] Locate ALL API client configuration:
  * Base URL configuration
  * HTTP client initialization (axios, fetch wrapper, etc.)
  * Interceptor setup (request/response)
  * Error handling configuration
  * Retry logic
* [ ] Document ALL API calls made from frontend:
  * Create a table: Endpoint | Method | Component/Hook Location | Request Payload Structure | Response Handling
  * Identify where API calls are made (components, hooks, services, etc.)
* [ ] Analyze API typing/interfaces:
  * Are API responses typed?
  * Type generation strategy (manual, OpenAPI codegen, etc.)
* [ ] Document error handling patterns for API failures
* [ ] Identify loading state management patterns
* [ ] Analyze request deduplication and caching strategies[microservices](https://microservices.io/patterns/apigateway.html)

## **3.6 Frontend Performance & Optimization**

* [ ] Identify code splitting points (dynamic imports)
* [ ] Analyze bundle size by examining build output
* [ ] Document lazy loading implementations (components, routes, data)
* [ ] Identify memoization patterns (useMemo, useCallback, React.memo, computed properties)
* [ ] Analyze virtual scrolling or pagination implementations
* [ ] Document image optimization strategies
* [ ] Identify any SSR/SSG implementations (if using Next.js, Nuxt, SvelteKit, etc.)
* [ ] Check for prefetching/preloading strategies[dev](https://dev.to/tecvanfe/frontend-monorepos-a-comprehensive-guide-2d31)

## **3.7 Frontend Testing & Quality**

* [ ] Locate ALL test files ( *.test.* ,  *.spec.* , **tests** directories)
* [ ] Identify testing frameworks (Jest, Vitest, Testing Library, Cypress, Playwright, etc.)
* [ ] Calculate test coverage percentage by component type
* [ ] Document E2E test scenarios (if present)
* [ ] Analyze mocking strategies for API calls in tests
* [ ] Identify any visual regression testing setup[dev](https://dev.to/tecvanfe/frontend-monorepos-a-comprehensive-guide-2d31)

---

## **PHASE 4: API CONTRACT & INTEGRATION ANALYSIS (25+ Sub-Tasks)**

## **4.1 API Documentation Extraction**

* [ ] Search for OpenAPI/Swagger specifications (swagger.json, openapi.yaml, etc.)
* [ ] If no spec exists, create one by analyzing ALL discovered endpoints
* [ ] For EACH API endpoint document:
  * Request headers required
  * Request body schema with example
  * Query parameters with types and defaults
  * Path parameters
  * Response schema for success (200, 201, etc.)
  * Response schema for errors (400, 401, 403, 404, 500, etc.)
  * Content-Type requirements
* [ ] Identify API authentication requirements per endpoint
* [ ] Document rate limiting implementations (if any)
* [ ] Analyze CORS configuration[microservices](https://microservices.io/patterns/apigateway.html)

## **4.2 Data Flow Mapping**

* [ ] Create end-to-end data flow diagrams for critical features:
  * User action in UI → API call → Backend handler → Database query → Response transformation → State update → UI render
* [ ] Document data transformation points:
  * Serialization/deserialization
  * DTO (Data Transfer Object) patterns
  * Data validation at each layer
* [ ] Identify any data inconsistencies between frontend expectations and backend responses
* [ ] Document any WebSocket or real-time data channels
* [ ] Analyze file upload/download flows[martinfowler**+1**](https://martinfowler.com/articles/break-monolith-into-microservices.html)

## **4.3 Frontend-Backend Coupling Analysis**

* [ ] Identify tight coupling points:
  * Hardcoded API URLs in components
  * Shared types/interfaces between frontend and backend
  * Frontend logic duplicating backend validation
* [ ] Document shared code or monorepo packages
* [ ] Analyze deployment dependencies (must frontend and backend deploy together?)
* [ ] Identify version compatibility requirements[martinfowler](https://martinfowler.com/articles/break-monolith-into-microservices.html)

---

## **PHASE 5: INFRASTRUCTURE & DEPLOYMENT ANALYSIS (30+ Sub-Tasks)**

## **5.1 Current Containerization State**

* [ ] Locate ALL Dockerfile instances with full paths
* [ ] For EACH Dockerfile found:
  * Document base image and version
  * List ALL RUN commands in sequence
  * Document COPY/ADD operations
  * Identify multi-stage build usage
  * Calculate approximate image layers
  * Document exposed ports
  * Analyze CMD vs ENTRYPOINT
  * Document any health checks
  * Identify security issues (running as root, etc.)[deepblue.lib.umich**+1**](https://deepblue.lib.umich.edu/bitstream/handle/2027.42/170138/ASE2021_DockerRefactoring__Copy_.pdf)
* [ ] Locate docker-compose.yml files and analyze:
  * Services defined
  * Network configuration
  * Volume mounts (bind mounts vs named volumes)
  * Environment variable injection
  * Service dependencies (depends_on)
  * Resource limits
  * Restart policies[deepblue.lib.umich](https://deepblue.lib.umich.edu/bitstream/handle/2027.42/170138/ASE2021_DockerRefactoring__Copy_.pdf)

## **5.2 Dependency Management Deep Dive**

* [ ] Analyze EACH backend dependency:
  * Direct vs transitive dependencies
  * Security vulnerabilities (note any major version outdated libraries)
  * Dependencies that could be removed
  * Conflicting version requirements
* [ ] Analyze EACH frontend dependency:
  * Unused dependencies (in package.json but not imported)
  * Duplicate functionality libraries
  * Bundle size contribution
  * Tree-shaking compatibility
* [ ] Document any native dependencies requiring compilation
* [ ] Identify any monolithic dependencies that could be modularized[arxiv**+1**](https://arxiv.org/html/2501.14131v1)

## **5.3 Configuration Management Analysis**

* [ ] List ALL configuration sources:
  * Environment variables used (with where they're accessed)
  * Config files (JSON, YAML, TOML, etc.)
  * Hardcoded configuration values in source code
* [ ] Document configuration for each environment (dev, staging, production)
* [ ] Analyze secrets management:
  * How are secrets stored?
  * Are there secrets in version control? (security audit)
  * Secret rotation mechanisms
* [ ] Identify feature flags or configuration-driven behavior[metadesignsolutions](https://metadesignsolutions.com/from-monolith-to-microservices-a-full-stack-migration-blueprint/)

## **5.4 Build & Deployment Process**

* [ ] Document the complete local development startup process:
  * Commands required to start backend
  * Commands required to start frontend
  * Database initialization steps
  * Seed data requirements
* [ ] Analyze build scripts and their execution order
* [ ] Identify any CI/CD configuration files (.github/workflows, .gitlab-ci.yml, Jenkinsfile, etc.)
* [ ] Document asset compilation and optimization steps
* [ ] Identify any database migration automation[talent500**+1**](https://talent500.com/blog/monorepo-benefits-best-practices-full-stack/)

---

## **PHASE 6: CODE QUALITY & TECHNICAL DEBT ASSESSMENT (20+ Sub-Tasks)**

## **6.1 Code Smell Detection**

* [ ] Identify files exceeding 500 lines of code
* [ ] Find functions/methods exceeding 100 lines
* [ ] Detect deeply nested conditional logic (>4 levels)
* [ ] Find TODO, FIXME, HACK, XXX comments and document them
* [ ] Identify console.log/print statements in production code
* [ ] Find commented-out code blocks
* [ ] Detect circular dependencies between modules[arxiv**+1**](https://arxiv.org/html/2501.14131v1)

## **6.2 Security Analysis**

* [ ] Search for hardcoded credentials or API keys
* [ ] Identify SQL injection vulnerabilities (raw query construction)
* [ ] Check for XSS prevention measures
* [ ] Analyze CSRF protection implementation
* [ ] Document input sanitization patterns
* [ ] Identify any eval() or exec() usage
* [ ] Check for insecure deserialization patterns[metadesignsolutions](https://metadesignsolutions.com/from-monolith-to-microservices-a-full-stack-migration-blueprint/)

## **6.3 Maintainability Metrics**

* [ ] Calculate lines of code by module/feature
* [ ] Identify files with highest change frequency (if git history available)
* [ ] Document code duplication (similar logic in multiple files)
* [ ] Analyze naming consistency across the codebase
* [ ] Identify missing error handling or bare try/catch blocks[deepblue.lib.umich**+1**](https://deepblue.lib.umich.edu/bitstream/handle/2027.42/170138/ASE2021_DockerRefactoring__Copy_.pdf)

---

## **PHASE 7: MODULARIZATION BLUEPRINT CREATION (35+ Sub-Tasks)**

## **7.1 Domain Boundary Identification**

* [ ] Based on the API routes and business logic, identify distinct bounded contexts/domains
* [ ] For EACH identified domain:
  * List related API endpoints
  * List related database tables/models
  * List related frontend pages/components
  * Document dependencies on other domains
* [ ] Propose domain aggregation or splitting based on cohesion analysis
* [ ] Create a domain dependency graph[graphite**+2**](https://graphite.dev/guides/when-to-use-monorepo)

## **7.2 Microservice Decomposition Strategy**

* [ ] Recommend which backend modules should become separate services
* [ ] For EACH proposed microservice:
  * Define clear responsibilities
  * Document required database tables (suggest separate DB vs shared)
  * List API endpoints it will own
  * Document dependencies on other services
  * Estimate deployment complexity
  * Suggest communication patterns (REST, gRPC, message queue)
* [ ] Identify shared/common functionality that should be a library
* [ ] Propose API gateway pattern implementation[martinfowler**+2**](https://martinfowler.com/articles/break-monolith-into-microservices.html)

## **7.3 Frontend Modularization Strategy**

* [ ] Recommend module boundaries for frontend:
  * Micro-frontends vs monolithic SPA with better architecture
  * Feature-based folder structure
  * Shared component library
* [ ] Identify components that should be extracted to a design system
* [ ] Propose state management refactoring:
  * Domain-specific state slices
  * Separation of server state from client state
* [ ] Recommend API client library architecture
* [ ] Suggest code splitting strategy by feature/route[javascript.plainenglish**+1**](https://javascript.plainenglish.io/micro-frontends-vs-monorepo-angular-developers-2025-guide-57e970c8e173)

## **7.4 Shared Code & Monorepo Architecture**

* [ ] Recommend monorepo vs polyrepo approach with justification
* [ ] If monorepo, propose structure:
  * apps/ directory (backend services, frontend apps)
  * packages/ directory (shared libraries)
  * tools/ directory (build tools, scripts)
* [ ] Identify code that should be shared:
  * Type definitions/interfaces
  * Validation schemas
  * Constants
  * Utility functions
  * API client SDKs
* [ ] Recommend monorepo tooling (Nx, Turborepo, Lerna, pnpm workspaces, etc.)[jsdev**+3**](https://jsdev.space/complete-monorepo-guide/)

---

## **PHASE 8: CONTAINERIZATION & ORCHESTRATION DESIGN (30+ Sub-Tasks)**

## **8.1 Container Strategy Per Service**

* [ ] Design Dockerfile for EACH identified service/module:
  * Recommend appropriate base image
  * Propose multi-stage build structure
  * Suggest layer optimization techniques
  * Define environment variable injection
  * Propose health check endpoints
  * Recommend resource limits
* [ ] Create .dockerignore recommendations per service
* [ ] Propose image naming and tagging conventions[arxiv**+1**](https://arxiv.org/html/2501.14131v1)

## **8.2 Container Orchestration Design**

* [ ] Design docker-compose.yml for local development:
  * Service definitions for all components
  * Network topology (bridge, host, custom networks)
  * Volume strategy (named volumes for persistence)
  * Development vs production overrides
  * Service startup order and dependencies
* [ ] Recommend Kubernetes manifests structure (if applicable):
  * Deployments
  * Services (ClusterIP, LoadBalancer)
  * ConfigMaps
  * Secrets
  * Ingress configuration
  * HPA (Horizontal Pod Autoscaling) recommendations
* [ ] Propose environment-specific configurations[docker**+1**](https://www.docker.com/resources/how-do-i-stuff-huge-monolithic-application-into-container-dockercon-2023/)

## **8.3 Data Persistence Strategy**

* [ ] Design database containerization approach:
  * Separate container vs external managed service
  * Volume mount strategy for data persistence
  * Backup and restore mechanisms
* [ ] Propose initialization scripts for databases
* [ ] Design migration execution strategy in containerized environment
* [ ] Recommend caching layer containerization[metadesignsolutions](https://metadesignsolutions.com/from-monolith-to-microservices-a-full-stack-migration-blueprint/)

## **8.4 Networking & Communication**

* [ ] Design inter-service communication patterns:
  * Service discovery mechanisms
  * Load balancing strategy
  * API gateway/reverse proxy configuration
* [ ] Propose network security policies
* [ ] Design external vs internal API exposure[microservices**+1**](https://microservices.io/patterns/apigateway.html)

---

## **PHASE 9: DEVELOPMENT WORKFLOW OPTIMIZATION (25+ Sub-Tasks)**

## **9.1 Local Development Environment**

* [ ] Design hot-reload strategy for each service
* [ ] Propose unified development startup (single command to start entire stack)
* [ ] Recommend IDE configuration and workspace setup
* [ ] Design debugging strategy for containerized services
* [ ] Propose log aggregation for local development[talent500**+1**](https://talent500.com/blog/monorepo-benefits-best-practices-full-stack/)

## **9.2 Build Optimization**

* [ ] Recommend build caching strategies
* [ ] Propose parallel build execution
* [ ] Design incremental build system
* [ ] Recommend build artifact management
* [ ] Suggest build time reduction techniques[graphite**+1**](https://graphite.dev/guides/when-to-use-monorepo)

## **9.3 Testing Strategy**

* [ ] Propose testing architecture:
  * Unit test organization
  * Integration test setup (with test databases)
  * E2E test containerization
  * Contract testing between services
* [ ] Recommend test data management
* [ ] Design test execution in CI/CD
* [ ] Propose test coverage requirements per module[talent500](https://talent500.com/blog/monorepo-benefits-best-practices-full-stack/)

## **9.4 Code Quality & Standards**

* [ ] Recommend linting and formatting tools
* [ ] Propose pre-commit hooks
* [ ] Design code review guidelines
* [ ] Recommend static analysis tools
* [ ] Propose documentation requirements[talent500**+1**](https://talent500.com/blog/monorepo-benefits-best-practices-full-stack/)

---

## **PHASE 10: MIGRATION ROADMAP & IMPLEMENTATION PLAN (20+ Sub-Tasks)**

## **10.1 Prioritization Matrix**

* [ ] Create a priority matrix for all refactoring tasks:
  * Business value (high/medium/low)
  * Technical complexity (high/medium/low)
  * Risk level (high/medium/low)
  * Effort estimation (T-shirt sizing: XS, S, M, L, XL)
* [ ] Recommend migration approach:
  * Big bang vs incremental (Strangler Fig pattern)
  * Which modules to migrate first
  * Parallel development strategy[inovex**+1**](https://www.inovex.de/de/blog/microservice-migration/)

## **10.2 Phase-by-Phase Implementation Plan**

* [ ] Propose 4-6 implementation phases:
  * Phase goals
  * Modules/services included
  * Estimated timeline
  * Success criteria
  * Rollback strategy
* [ ] Identify quick wins (low effort, high impact)
* [ ] Highlight risky refactorings requiring extra attention[inovex**+1**](https://www.inovex.de/de/blog/microservice-migration/)

## **10.3 Infrastructure Transition**

* [ ] Design infrastructure migration path
* [ ] Propose dual-running strategy (old + new in parallel)
* [ ] Recommend monitoring and observability setup
* [ ] Design traffic routing/switchover strategy[inovex](https://www.inovex.de/de/blog/microservice-migration/)

## **10.4 Team & Process Considerations**

* [ ] Recommend team structure for modular development
* [ ] Propose code ownership model
* [ ] Suggest knowledge transfer requirements
* [ ] Design onboarding process for new structure[talent500**+1**](https://talent500.com/blog/monorepo-benefits-best-practices-full-stack/)

---

## **FINAL DELIVERABLE FORMAT**

Generate a comprehensive report structured as follows:

**1. Executive Summary (2-3 pages)**

* Current state overview
* Critical findings
* Recommended approach summary
* Expected benefits and risks

**2. Current Architecture Deep Dive (15-25 pages)**

* Backend architecture with diagrams
* Frontend architecture with diagrams
* API contracts documentation
* Data flow diagrams
* Infrastructure current state
* Technical debt summary

**3. Detailed Findings (10-15 pages)**

* Code quality metrics
* Security concerns
* Performance bottlenecks
* Maintainability issues
* Coupling and cohesion analysis

**4. Target Architecture Blueprint (20-30 pages)**

* Proposed modular structure with detailed diagrams
* Service boundaries and responsibilities
* Container architecture
* Data management strategy
* API design patterns
* Shared code organization
* Development workflow design

**5. Implementation Roadmap (10-15 pages)**

* Prioritized task list
* Phase-by-phase plan with Gantt chart
* Resource requirements
* Risk mitigation strategies
* Success metrics

**6. Technical Specifications (15-20 pages)**

* Dockerfile templates for each service
* docker-compose.yml complete configuration
* Monorepo configuration files
* CI/CD pipeline design
* Environment configuration templates
* Migration scripts outline

**7. Appendices**

* Complete file inventory
* Dependency audit
* API endpoint reference
* Code excerpt examples
* Configuration samples

---

**CRITICAL EXECUTION INSTRUCTIONS:**

1. Start ONLY with Phase 1 and do not proceed until complete
2. Document EVERY finding with file path:line_number citations
3. If a file is too large to analyze completely, break it into sections and analyze each section
4. Create tables and matrices for all comparative data
5. Use code blocks to show actual code excerpts as evidence
6. Do not make assumptions - verify everything by reading actual code
7. Track your progress by checking off each subtask as you complete it
8. Estimate this analysis will take 4-8 hours of thorough investigation
9. The report should be 80-120 pages of detailed technical content
10. Every recommendation MUST be justified by specific findings from the codebase[graphite**+5**](https://graphite.dev/guides/when-to-use-monorepo)

---

This prompt ensures no stone is left unturned in analyzing your monitoring portal codebase and will produce a comprehensive blueprint for complete modular refactoring, containerization readiness, and scalable development practices.[graphite**+3**](https://graphite.dev/guides/when-to-use-monorepo)

1. [https://dev.to/tecvanfe/frontend-monorepos-a-comprehensive-guide-2d31](https://dev.to/tecvanfe/frontend-monorepos-a-comprehensive-guide-2d31)
2. [https://graphite.dev/guides/when-to-use-monorepo](https://graphite.dev/guides/when-to-use-monorepo)
3. [https://talent500.com/blog/monorepo-benefits-best-practices-full-stack/](https://talent500.com/blog/monorepo-benefits-best-practices-full-stack/)
4. [https://deepblue.lib.umich.edu/bitstream/handle/2027.42/170138/ASE2021_DockerRefactoring__Copy_.pdf](https://deepblue.lib.umich.edu/bitstream/handle/2027.42/170138/ASE2021_DockerRefactoring__Copy_.pdf)
5. [https://arxiv.org/html/2501.14131v1](https://arxiv.org/html/2501.14131v1)
6. [https://jsdev.space/complete-monorepo-guide/](https://jsdev.space/complete-monorepo-guide/)
7. [https://metadesignsolutions.com/from-monolith-to-microservices-a-full-stack-migration-blueprint/](https://metadesignsolutions.com/from-monolith-to-microservices-a-full-stack-migration-blueprint/)
8. [https://martinfowler.com/articles/break-monolith-into-microservices.html](https://martinfowler.com/articles/break-monolith-into-microservices.html)
9. [https://microservices.io/patterns/apigateway.html](https://microservices.io/patterns/apigateway.html)
10. [https://javascript.plainenglish.io/micro-frontends-vs-monorepo-angular-developers-2025-guide-57e970c8e173](https://javascript.plainenglish.io/micro-frontends-vs-monorepo-angular-developers-2025-guide-57e970c8e173)
11. [https://www.docker.com/resources/how-do-i-stuff-huge-monolithic-application-into-container-dockercon-2023/](https://www.docker.com/resources/how-do-i-stuff-huge-monolithic-application-into-container-dockercon-2023/)
12. [https://www.inovex.de/de/blog/microservice-migration/](https://www.inovex.de/de/blog/microservice-migration/)
13. [https://ingeniousmindslab.com/blogs/flutter-monorepo-enterprise-projects/](https://ingeniousmindslab.com/blogs/flutter-monorepo-enterprise-projects/)
14. [https://blog.bitsrc.io/monorepo-from-hate-to-love-97a866811ccc](https://blog.bitsrc.io/monorepo-from-hate-to-love-97a866811ccc)
15. [https://www.aviator.co/blog/monorepo-tools/](https://www.aviator.co/blog/monorepo-tools/)
16. [https://jpetazzo.github.io/2021/11/30/docker-build-container-images-antipatterns/](https://jpetazzo.github.io/2021/11/30/docker-build-container-images-antipatterns/)
17. [https://www.reddit.com/r/SoftwareEngineering/comments/1dy2i69/is_the_separation_of_backend_from_frontend_an_old/](https://www.reddit.com/r/SoftwareEngineering/comments/1dy2i69/is_the_separation_of_backend_from_frontend_an_old/)
18. [https://www.docker.com/resources/modernizing-applications-with-containers-on-demand-training/](https://www.docker.com/resources/modernizing-applications-with-containers-on-demand-training/)
19. [https://fabric.inc/blog/commerce/from-monolith-to-microservices](https://fabric.inc/blog/commerce/from-monolith-to-microservices)
20. [https://devopedia.org/design-patterns-for-microservices-and-containers](https://devopedia.org/design-patterns-for-microservices-and-containers)
