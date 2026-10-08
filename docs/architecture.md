# CampusEdge System Architecture

## Architecture Diagram

```mermaid
graph TD
    ClientBrowser["Client Browser (Desktop/Mobile)"]

    subgraph Frontend ["apps/web (Next.js 15 App Router)"]
        LandingPage["Landing & Status Pages"]
        StudentUI["Student Portal"]
        TPOUI["Placement Cell Cockpit"]
        AdminUI["Super Admin Dashboard"]
        SSRAuth["@supabase/ssr Auth Session"]
    end

    subgraph Backend ["apps/api (NestJS 11 Engine)"]
        GuardLayer["JwtAuthGuard + RolesGuard + TenantGuard"]
        ValidationLayer["ValidationPipe (Zod / class-validator)"]
        Controllers["API Controllers (/api/v1/*)"]
        Services["Domain Services (Business Logic)"]
        AuditService["Audit Logger (DPDP Compliant)"]
        PrismaService["Prisma ORM Client"]
    end

    subgraph DatabaseLayer ["Supabase Infrastructure"]
        PostgresDB[(PostgreSQL 15+ DB)]
        RLS["Row Level Security (Tenant Scoped)"]
        SupabaseAuth["Supabase Auth (JWKS / JWT)"]
        SupabaseStorage["Supabase Storage (Resumes/Docs)"]
    end

    ClientBrowser -->|HTTPS| Frontend
    Frontend -->|Session Cookies| SSRAuth
    Frontend -->|REST API / Bearer JWT| Backend
    GuardLayer --> Controllers
    Controllers --> Services
    Services --> AuditService
    Services --> PrismaService
    PrismaService -->|Connection Pooling| PostgresDB
    PostgresDB --- RLS
    SSRAuth -.->|Verify| SupabaseAuth
```

## Multi-Tenant Security Model

- **College Tenant Scoping**: Every institutional entity is scoped by `college_id`.
- **Primary Enforcement**: NestJS `TenantGuard` verifies that requests belong to the authenticated user's institution.
- **Secondary Defense**: PostgreSQL Row Level Security (RLS) ensures database-level row segregation even if queries are executed directly.
