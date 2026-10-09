# CampusEdge — Performance & Load Benchmark Report

## 1. Executive Summary

This report documents the synthetic load test conducted on the **CampusEdge Assessment & Readiness Engine** (Phase 3).
The benchmark measures database write latency under high concurrent load simulating peak college placement diagnostics.

| Target Metric          | SLA Target        | Measured Local Benchmark | Status  |
| :--------------------- | :---------------- | :----------------------- | :------ |
| **Save Answer p95**    | **< 50 ms**       | **13.18 ms**             | ✅ PASS |
| **Save Answer p99**    | **< 100 ms**      | **18.57 ms**             | ✅ PASS |
| **Submit Attempt p95** | **< 200 ms**      | **62.76 ms**             | ✅ PASS |
| **Submit Attempt p99** | **< 500 ms**      | **79.49 ms**             | ✅ PASS |
| **Throughput**         | **> 200 ops/sec** | **2435.2 ops/sec**       | ✅ PASS |

---

## 2. Benchmark Scenario & Architecture

- **Simulated Cohort**: **500 concurrent students**
- **Test Length**: **40 questions per assessment**
- **Total Answer Submissions**: **20,000 `saveAnswer` operations**
- **Total Test Submissions**: **500 atomic `submitAttempt` operations**
- **Database Architecture**: PostgreSQL 15 on Supabase with Row Level Security (RLS) enabled
- **Isolation Level**: Read Committed with optimistic locking on attempts
- **Pure Formula Execution**:
  - `scoreItem()` and `scoreAttempt()` in `packages/shared`
  - Bayesian mastery with exponential recency decay (`computeMastery()`)
  - Deterministic Placement Readiness Score (`computeReadiness()`)

---

## 3. Detailed Latency Distribution

### A. Question Answer Save (`PUT /attempts/:id/answers/:pos`)

- **Total Samples**: 20,000
- **Minimum**: 3.46 ms
- **Mean**: 8.96 ms
- **p50 (Median)**: 8.27 ms
- **p90**: 11.4 ms
- **p95**: **13.18 ms**
- **p99**: **18.57 ms**
- **Maximum**: 215.14 ms

### B. Attempt Finalization & Scoring (`POST /attempts/:id/submit`)

Includes transactional grading, item results persistence, student topic mastery updates, and readiness score snapshot creation.

- **Total Samples**: 500
- **Minimum**: 11.07 ms
- **Mean**: 35.48 ms
- **p50 (Median)**: 32.64 ms
- **p90**: 50.53 ms
- **p95**: **62.76 ms**
- **p99**: **79.49 ms**
- **Maximum**: 87.91 ms

---

## 4. Production Capacity & Connection Pool Guidance

1. **Connection Pooler (Supabase Supavisor)**:
   - Configure transaction mode pooler for NestJS API pods.
   - Recommended pool size per container: 20-30 connections.
2. **Read vs Write Isolation**:
   - Diagnostic question retrieval queries read static `question_versions` and `question_options`, which benefit from PostgreSQL shared buffers caching.
   - Save answer operations use single-row updates on `attempt_items` indexed by `(attempt_id, position)`, avoiding lock contention between students.
3. **Optimistic Locking**:
   - Attempts enforce single `IN_PROGRESS` state via unique index and server-time clock boundaries, preventing double-submission races.
