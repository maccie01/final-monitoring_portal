# PHASE 1.1: Dependency Analysis - package.json

Created: 2025-10-07
Timestamp: 13:42:00

## Package Metadata

**File Location**: `/Users/janschubert/code-projects/monitoring_firma/app-version-4_netzwächter/package.json`

| Property | Value |
|----------|-------|
| Package Name | `rest-express` |
| Version | `1.0.0` |
| Module Type | `module` (ESM) |
| License | MIT |

## NPM Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `NODE_ENV=development tsx --env-file=.env server/index.ts` | Start development server with hot reload |
| `build` | `vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist` | Build frontend (Vite) and backend (esbuild) |
| `start` | `NODE_ENV=production node dist/index.js` | Start production server |
| `check` | `tsc` | TypeScript type checking |
| `db:push` | `drizzle-kit push` | Push database schema changes |

### Script Analysis

**Development Workflow**:
- Uses `tsx` for TypeScript execution in development (server/index.ts:7)
- Hot reload enabled via tsx
- Environment variables loaded from `.env` file
- Entry point: `server/index.ts`

**Build Process** (Line 8):
1. **Frontend**: `vite build` - builds client code
2. **Backend**: `esbuild server/index.ts` - bundles server code
   - Platform: node
   - External packages (not bundled)
   - Output format: ESM
   - Output directory: `dist/`

**Production** (Line 9):
- Runs compiled code from `dist/index.js`
- No build tools, pure Node.js execution

## Dependencies Analysis (96 total)

### Backend Framework & Server (4 dependencies)
| Dependency | Version | Purpose | Classification |
|------------|---------|---------|----------------|
| `express` | ^4.21.2 | Web framework | Runtime - Core |
| `express-session` | ^1.18.1 | Session management | Runtime - Auth |
| `ws` | ^8.18.0 | WebSocket server | Runtime - Real-time |
| `@types/express` | 4.17.21 | TypeScript types | Dev - Types |

**Evidence**: Line 73 (express), Line 74 (express-session), Line 106 (ws), Line 114 (@types/express)

---

### Database & ORM (8 dependencies)
| Dependency | Version | Purpose | Classification |
|------------|---------|---------|----------------|
| `pg` | ^8.16.3 | PostgreSQL client | Runtime - Database |
| `@types/pg` | ^8.15.5 | PostgreSQL types | Runtime - Types |
| `drizzle-orm` | ^0.39.1 | ORM | Runtime - Database |
| `drizzle-zod` | ^0.7.0 | Zod integration for Drizzle | Runtime - Validation |
| `drizzle-kit` | ^0.30.4 | Database migrations | Dev - Database |
| `@neondatabase/serverless` | ^0.10.4 | Neon DB serverless driver | Runtime - Database |
| `connect-pg-simple` | ^10.0.0 | PostgreSQL session store | Runtime - Session |
| `@types/connect-pg-simple` | ^7.0.3 | Types | Dev - Types |

**Evidence**: Lines 91, 54, 70, 71, 122, 18, 67, 113

**Database Type**: PostgreSQL with Neon serverless support
**ORM Strategy**: Drizzle ORM with Zod validation integration
**Session Storage**: PostgreSQL-backed sessions

---

### Authentication & Security (4 dependencies)
| Dependency | Version | Purpose | Classification |
|------------|---------|---------|----------------|
| `bcryptjs` | ^3.0.2 | Password hashing | Runtime - Security |
| `@types/bcryptjs` | ^2.4.6 | Types | Runtime - Types |
| `google-auth-library` | ^10.2.1 | Google OAuth | Runtime - Auth |
| `nanoid` | ^5.1.5 | ID generation | Runtime - Utility |

**Evidence**: Lines 62, 48, 77, 87

**Auth Strategy**: bcrypt password hashing + Google OAuth support

---

### Frontend Framework - React (28 dependencies)
| Dependency | Version | Purpose | Classification |
|------------|---------|---------|----------------|
| `react` | ^18.3.1 | Core framework | Runtime - Frontend |
| `react-dom` | ^18.3.1 | DOM rendering | Runtime - Frontend |
| `@types/react` | ^18.3.11 | Types | Dev - Types |
| `@types/react-dom` | ^18.3.1 | Types | Dev - Types |

**Radix UI Components (24 packages)**: Lines 19-45
- Complete Radix UI suite for accessible components
- accordion, alert-dialog, aspect-ratio, avatar, checkbox, collapsible
- context-menu, dialog, dropdown-menu, hover-card, label, menubar
- navigation-menu, popover, progress, radio-group, scroll-area
- select, separator, slider, slot, switch, tabs, toast, toggle, toggle-group, tooltip

**Evidence**: Lines 92-94, 117-118, 19-45

**UI Library**: shadcn/ui pattern (Radix UI + Tailwind CSS)

---

### State Management & Data Fetching (2 dependencies)
| Dependency | Version | Purpose | Classification |
|------------|---------|---------|----------------|
| `@tanstack/react-query` | ^5.60.5 | Server state management | Runtime - Frontend |
| `wouter` | ^3.3.5 | Routing library | Runtime - Frontend |

**Evidence**: Lines 47, 105

**Router**: wouter (lightweight React Router alternative)
**Server State**: React Query for API caching and synchronization

---

### Form Handling & Validation (4 dependencies)
| Dependency | Version | Purpose | Classification |
|------------|---------|---------|----------------|
| `react-hook-form` | ^7.55.0 | Form management | Runtime - Frontend |
| `@hookform/resolvers` | ^3.10.0 | Validation resolvers | Runtime - Frontend |
| `zod` | ^3.24.2 | Schema validation | Runtime - Validation |
| `zod-validation-error` | ^3.4.0 | Zod error formatting | Runtime - Validation |

**Evidence**: Lines 95, 16, 107, 108

**Validation Strategy**: Zod schemas with React Hook Form integration

---

### UI & Styling (13 dependencies)
| Dependency | Version | Purpose | Classification |
|------------|---------|---------|----------------|
| `tailwindcss` | ^3.4.17 | CSS framework | Dev - Styling |
| `tailwind-merge` | ^2.6.0 | Tailwind class merging | Runtime - Styling |
| `tailwindcss-animate` | ^1.0.7 | Animation utilities | Runtime - Styling |
| `tw-animate-css` | ^1.2.5 | CSS animations | Runtime - Styling |
| `@tailwindcss/typography` | ^0.5.15 | Typography plugin | Dev - Styling |
| `@tailwindcss/vite` | ^4.1.3 | Vite integration | Dev - Styling |
| `postcss` | ^8.4.47 | CSS processing | Dev - Styling |
| `autoprefixer` | ^10.4.20 | CSS vendor prefixing | Dev - Styling |
| `class-variance-authority` | ^0.7.1 | Component variants | Runtime - Styling |
| `clsx` | ^2.1.1 | Class name utility | Runtime - Styling |
| `lucide-react` | ^0.453.0 | Icon library | Runtime - UI |
| `@heroicons/react` | ^2.2.0 | Icon library | Runtime - UI |
| `react-icons` | ^5.4.0 | Icon library | Runtime - UI |

**Evidence**: Lines 125, 100, 101, 102, 111, 112, 124, 121, 64, 65, 83, 15, 96

**Styling Approach**: Tailwind CSS with PostCSS processing
**Icon Libraries**: Multiple (Lucide, Heroicons, React Icons)

---

### UI Component Libraries (8 dependencies)
| Dependency | Version | Purpose | Classification |
|------------|---------|---------|----------------|
| `cmdk` | ^1.1.1 | Command palette | Runtime - UI |
| `vaul` | ^1.1.2 | Drawer component | Runtime - UI |
| `embla-carousel-react` | ^8.6.0 | Carousel | Runtime - UI |
| `react-resizable-panels` | ^2.1.7 | Resizable panels | Runtime - UI |
| `react-day-picker` | ^8.10.1 | Date picker | Runtime - UI |
| `input-otp` | ^1.4.2 | OTP input | Runtime - UI |
| `framer-motion` | ^11.13.1 | Animation library | Runtime - UI |
| `next-themes` | ^0.4.6 | Theme switching | Runtime - UI |

**Evidence**: Lines 66, 104, 72, 98, 93, 79, 76, 88

---

### Data Visualization & Charts (3 dependencies)
| Dependency | Version | Purpose | Classification |
|------------|---------|---------|----------------|
| `recharts` | ^2.15.4 | Charting library | Runtime - Visualization |
| `leaflet` | ^1.9.4 | Mapping library | Runtime - Visualization |
| `react-leaflet` | ^4.2.1 | React Leaflet bindings | Runtime - Visualization |
| `@types/leaflet` | ^1.9.20 | Leaflet types | Runtime - Types |

**Evidence**: Lines 99, 82, 97, 50

**Visualization**: Recharts for charts, Leaflet for maps

---

### File Upload & Storage (8 dependencies)
| Dependency | Version | Purpose | Classification |
|------------|---------|---------|----------------|
| `multer` | ^2.0.2 | File upload middleware | Runtime - File |
| `@types/multer` | ^2.0.0 | Types | Runtime - Types |
| `@google-cloud/storage` | ^7.16.0 | GCS client | Runtime - Cloud |
| `@uppy/core` | ^4.5.2 | Upload core | Runtime - Frontend |
| `@uppy/dashboard` | ^4.4.3 | Upload UI | Runtime - Frontend |
| `@uppy/react` | ^4.5.2 | React integration | Runtime - Frontend |
| `@uppy/drag-drop` | ^4.2.2 | Drag-drop upload | Runtime - Frontend |
| `@uppy/file-input` | ^4.2.2 | File input | Runtime - Frontend |
| `@uppy/progress-bar` | ^4.3.2 | Progress indicator | Runtime - Frontend |
| `@uppy/aws-s3` | ^4.3.2 | S3 upload | Runtime - Frontend |

**Evidence**: Lines 86, 52, 14, 56-61, 55

**File Upload**: Multer (backend) + Uppy (frontend)
**Cloud Storage**: Google Cloud Storage + AWS S3 support

---

### Email Services (3 dependencies)
| Dependency | Version | Purpose | Classification |
|------------|---------|---------|----------------|
| `nodemailer` | ^7.0.6 | Email sending | Runtime - Email |
| `@types/nodemailer` | ^7.0.1 | Types | Runtime - Types |
| `@sendgrid/mail` | ^8.1.5 | SendGrid API | Runtime - Email |

**Evidence**: Lines 89, 53, 46

**Email Strategy**: Nodemailer (SMTP) + SendGrid (API)

---

### AI/ML Integration (1 dependency)
| Dependency | Version | Purpose | Classification |
|------------|---------|---------|----------------|
| `openai` | ^5.23.1 | OpenAI API client | Runtime - AI |

**Evidence**: Line 90

**AI Features**: OpenAI integration for AI-powered reports

---

### Data Processing & Utilities (8 dependencies)
| Dependency | Version | Purpose | Classification |
|------------|---------|---------|----------------|
| `csv-parser` | ^3.2.0 | CSV parsing | Runtime - Data |
| `fast-csv` | ^5.0.5 | Fast CSV processing | Runtime - Data |
| `date-fns` | ^3.6.0 | Date utilities | Runtime - Utility |
| `uuid` | ^13.0.0 | UUID generation | Runtime - Utility |
| `memoizee` | ^0.4.17 | Memoization | Runtime - Performance |
| `@types/memoizee` | ^0.4.12 | Types | Runtime - Types |
| `memorystore` | ^1.6.7 | In-memory session store | Runtime - Session |
| `@jridgewell/trace-mapping` | ^0.3.25 | Source map utilities | Runtime - Build |

**Evidence**: Lines 68, 75, 69, 103, 84, 51, 85, 17

---

### PDF & Document Generation (4 dependencies)
| Dependency | Version | Purpose | Classification |
|------------|---------|---------|----------------|
| `jspdf` | ^3.0.2 | PDF generation | Runtime - Documents |
| `jspdf-autotable` | ^5.0.2 | PDF tables | Runtime - Documents |
| `html2canvas` | ^1.4.1 | HTML to canvas | Runtime - Documents |
| `canvas-confetti` | ^1.9.3 | Confetti animations | Runtime - UI |
| `@types/canvas-confetti` | ^1.9.0 | Types | Runtime - Types |

**Evidence**: Lines 80, 81, 78, 63, 49

**PDF Generation**: jsPDF with table support and HTML screenshot capability

---

### Build Tools & TypeScript (5 dependencies)
| Dependency | Version | Purpose | Classification |
|------------|---------|---------|----------------|
| `vite` | ^5.4.19 | Frontend build tool | Dev - Build |
| `@vitejs/plugin-react` | ^4.3.2 | React plugin for Vite | Dev - Build |
| `esbuild` | ^0.25.0 | Backend bundler | Dev - Build |
| `typescript` | 5.6.3 | TypeScript compiler | Dev - Language |
| `tsx` | ^4.19.1 | TypeScript executor | Dev - Runtime |
| `@types/node` | 20.16.11 | Node.js types | Dev - Types |

**Evidence**: Lines 128, 120, 123, 127, 126, 116

**Build Strategy**:
- Frontend: Vite (fast HMR)
- Backend: esbuild (fast bundling)
- Development: tsx (direct TS execution)

---

### WebSocket & Real-time (1 dependency)
| Dependency | Version | Purpose | Classification |
|------------|---------|---------|----------------|
| `@types/ws` | ^8.5.13 | WebSocket types | Dev - Types |

**Evidence**: Line 119

---

### Session & Caching (1 dependency)
| Dependency | Version | Purpose | Classification |
|------------|---------|---------|----------------|
| `@types/express-session` | ^1.18.0 | Session types | Dev - Types |

**Evidence**: Line 115

---

### Optional Dependencies (1 dependency)
| Dependency | Version | Purpose | Classification |
|------------|---------|---------|----------------|
| `bufferutil` | ^4.0.8 | WebSocket performance | Optional - Performance |

**Evidence**: Line 131

**Purpose**: Optional native addon for faster WebSocket buffer operations

---

## Dependency Statistics

### Total Count
- **Runtime Dependencies**: 87
- **Dev Dependencies**: 13
- **Optional Dependencies**: 1
- **Total**: 101 packages

### By Category
| Category | Count | % of Total |
|----------|-------|-----------|
| Frontend UI (React + Radix + Styling) | 45 | 44.6% |
| Backend Infrastructure | 12 | 11.9% |
| Database & ORM | 8 | 7.9% |
| File Upload & Storage | 10 | 9.9% |
| Build Tools & TypeScript | 6 | 5.9% |
| Data Processing & Utilities | 8 | 7.9% |
| Visualization | 4 | 4.0% |
| PDF & Documents | 5 | 5.0% |
| Email Services | 3 | 3.0% |

### By Runtime vs Dev
| Type | Count | % of Total |
|------|-------|-----------|
| Runtime | 87 | 86.1% |
| Dev | 13 | 12.9% |
| Optional | 1 | 1.0% |

## Critical Observations

### 1. **Monolithic Dependency Structure**
- All dependencies in single package.json
- Frontend and backend dependencies mixed
- No workspace or monorepo tooling

### 2. **Heavy Frontend Bundle**
- 24 Radix UI packages (could be optimized)
- 3 icon libraries (Lucide, Heroicons, React Icons) - potential duplication
- Multiple animation libraries (Framer Motion, Tailwind Animate, tw-animate-css)

### 3. **Multiple Overlapping Tools**
- CSV processing: csv-parser + fast-csv (2 libraries)
- Email: nodemailer + SendGrid (2 methods)
- Cloud storage: Google Cloud Storage + AWS S3 (2 providers)

### 4. **Type Safety**
- TypeScript types mixed in dependencies (should be devDependencies)
- Examples: @types/bcryptjs, @types/pg (lines 48, 54)

### 5. **Build Tool Complexity**
- Uses 3 different tools: Vite (frontend), esbuild (backend), tsx (dev)
- No unified build system

### 6. **Security Considerations**
- bcryptjs (older library, bcrypt is more secure)
- Express 4.x (not latest 5.x)
- Session management via express-session + PostgreSQL

### 7. **Performance Tools**
- memoizee for caching (line 84)
- bufferutil for WebSocket optimization (line 131)
- memorystore for session fallback (line 85)

## Recommendations for Modularization

### High Priority
1. **Split package.json** into frontend and backend packages
2. **Remove duplicate functionality** (icon libraries, CSV parsers, animation libs)
3. **Move @types/* to devDependencies** (type definitions not needed at runtime)
4. **Implement monorepo** with workspace support

### Medium Priority
1. **Optimize Radix UI imports** - tree-shake unused components
2. **Standardize cloud storage** - choose GCS or S3, not both
3. **Update security dependencies** - bcrypt instead of bcryptjs

### Low Priority
1. **Consolidate build tools** - consider unified build system
2. **Review optional dependencies** - evaluate bufferutil necessity
