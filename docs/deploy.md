# Deployment Strategy: Google Cloud Run (asia-south1)

## Architecture Overview

CampusEdge production infrastructure will be hosted in the `asia-south1` (Mumbai, India) region to ensure ultra-low latency for Indian engineering colleges and strict compliance with the **Digital Personal Data Protection (DPDP) Act 2023**.

## Target Components

1. **Frontend (`apps/web`)**:
   - Containerized Next.js service deployed to Cloud Run.
   - Connected via custom domain with managed SSL.
   - Serves Server Components and dynamic pages.
2. **Backend API (`apps/api`)**:
   - Containerized NestJS service deployed to Cloud Run.
   - Autoscaling: min 1 instance, max 10 instances.
   - VPC Connector enabling private connectivity to Redis and Cloud SQL / Supabase pooler.
3. **Database & Auth (Supabase)**:
   - Hosted PostgreSQL instance with Supabase Auth, Storage, and pgvector.
4. **Queue & Compute (Upcoming)**:
   - Managed Redis (Cloud Memorystore) for BullMQ background workers.
   - Judge0 isolated sandbox cluster for coding compilation.

## Continuous Deployment Pipeline (Planned)

- Image builds using Google Cloud Build.
- Artifact Registry for storing multi-stage Docker images.
- Cloud Run blue/green revision traffic splitting.
