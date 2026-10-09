# ADR 0003: Global Recruiter Catalog with Tenant-Scoped Institutional Facts

## Status

Accepted

## Context

CampusEdge serves multiple college placement cells while building cross-institutional recruiter intelligence. In traditional placement software architectures, two failure modes occur:

1. **Isolated Silos**: Each college maintains an independent company table, resulting in massive fragmentation (e.g., "Google", "Google India", "Google Inc.", "Alphabet Inc"), making cross-college placement benchmarking, alumni round pattern recognition, and salary intelligence impossible.
2. **Leaky Shared Records**: Making companies and their recruitment records shared without tenant isolation risks leaking confidential institutional placement statistics, student CTC numbers, and bespoke institutional drive policies between competing universities.

## Decision

We adopt a **Hybrid Canonical Catalog & Tenant-Scoped Facts** architecture:

1. **Global Canonical Recruiter Catalog (`companies`)**:
   - Stores authoritative recruiter profiles (`name`, `normalizedName`, `slug`, `website`, `industry`, `logoUrl`, `status`).
   - Normalization function: `normalizeCompanyName()` strips legal suffixes (`Inc`, `LLC`, `Pvt Ltd`), punctuation, and multiple spaces.
   - Status lifecycle: `PENDING_REVIEW` (when created by college admins) -> `VERIFIED` (reviewed by Super Admin) -> `MERGED` (aliased to target canonical record).
   - Exact deduplication: If a college creates a company whose normalized name already exists, the system returns the existing canonical company without creating a duplicate.

2. **Strictly Tenant-Scoped Institutional Facts**:
   - All operational hiring events and facts belong solely to the college tenant:
     - `drives`: Scoped by composite primary key `(id, college_id)`.
     - `drive_roles`: Scoped by composite key `(id, college_id)`.
     - `drive_rounds`: Scoped by composite key `(id, college_id)`.
     - `drive_applications`: Scoped by composite key `(id, college_id)`.
     - `experiences`: Scoped by composite key `(id, college_id)`.
   - All foreign keys between operational models are composite FKs `(parent_id, college_id) REFERENCES parent(id, college_id)`.
   - PostgreSQL RLS enforces that college administrators and students can only query facts where `college_id = auth_college_id()`.

3. **Super Admin Deduplication & Merger Pipeline**:
   - Super Admins can execute an atomic merger transaction (`POST /companies/:id/merge`) that:
     - Updates all `drives` referencing the source company to point to the target company.
     - Updates all `experiences` referencing the source company to point to the target company.
     - Marks the source company as `MERGED` with `mergedIntoId = targetCompanyId`.

## Consequences

- **Positive**: High data cleanliness across colleges; unified company hiring intelligence; strict database-level mathematical guarantee against cross-tenant data leaks.
- **Trade-off**: Requires composite primary keys and composite foreign keys across all tenant-scoped tables in Prisma schema and PostgreSQL migrations.
