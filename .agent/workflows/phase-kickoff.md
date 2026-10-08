# Workflow: /phase-kickoff

## Description

Protocol for initiating the next phase or milestone of the CampusEdge product roadmap.

## Execution Sequence

### 1. Inspect Current State

- Read `ROADMAP.md` from the root directory.
- Identify the first incomplete phase and its unchecked task items `[ ]`.

### 2. Formulate Phase Plan

- Break down the selected milestone into concrete, sequential deliverables:
  1. Database schema and migrations (with RLS).
  2. API endpoints, guards, and unit tests.
  3. Shared types and contracts in `packages/shared`.
  4. Web UI pages, states, and components in `apps/web`.
  5. End-to-end verification.

### 3. Propose to Developer & Pause

- Present the structured plan to the human developer.
- Explicitly highlight architecture decisions, data modeling choices, and security considerations.
- **STOP and wait for user approval** before executing code changes.

### 4. Milestone Completion

- Verify the deliverable with the full verification sweep (`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`).
- Update `ROADMAP.md` checkboxes to `[x]` upon confirmed completion.
