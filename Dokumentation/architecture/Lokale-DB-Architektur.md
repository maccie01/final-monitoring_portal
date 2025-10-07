# ⚠️ OUTDATED - Database Architecture Documentation

## Current Status
- **Architecture**: Single PostgreSQL database (Neon) via `ConnectionPoolManager`
- **Connection Pool**: 50 persistent connections with health monitoring
- **No dual-database setup**: Previous "Portal vs Local" architecture no longer exists
- **All operations**: Use unified `ConnectionPoolManager.getInstance().getPool()`

## Verified Architecture (October 2025)

### Database Connection
- **Single Database**: PostgreSQL (Neon)
- **Connection Management**: `ConnectionPoolManager` singleton
- **Pool Size**: 50 connections with automatic health checks
- **Environment**: `DATABASE_URL` from `.env`

### Key Components
- **`server/db.ts`**: Drizzle ORM instance with connection pool
- **`server/connection-pool.ts`**: Pool management and monitoring
- **`server/storage.ts`**: Data access layer using unified pool
- **No separate databases**: All components use same connection pool

---

*This dual-database documentation is obsolete. System now uses single unified database architecture.*
