# 04 - Coding Standards & Quality Mandates

## 1. TypeScript Strictness

- Full strict mode is activated across all workspaces.
- **`any` is strictly prohibited**. Use `unknown` with type guards, specific interfaces, or generic parameters.
- Handle nullable and optional fields explicitly; never use non-null assertions (`!`) without an assertion guard.

## 2. Layering & Separation of Concerns (NestJS)

- **Controllers**:
  - Responsible ONLY for HTTP transport, Swagger documentation decorators, binding guards, and returning responses.
  - ZERO business logic, scoring formulas, or direct database calls in controllers.
- **Services**:
  - Encapsulate all business rules, eligibility calculations, scoring logic, and tenant validation.
- **Repositories / Data Access**:
  - `PrismaService` operations isolated inside service methods or dedicated repository classes.
  - Transactions must use `prisma.$transaction(...)` for multi-step mutations (e.g. drive registration + audit log).

## 3. Validation & DTOs

- All request payloads must define class-validator DTOs or Zod schemas in `packages/shared`.
- The global NestJS `ValidationPipe` operates with `{ whitelist: true, forbidNonWhitelisted: true, transform: true }`.

## 4. Logging & Error Handling

- **No `console.log`**: Always use NestJS `Logger` or the configured Pino request logger.
- **Exceptions**: Throw standard NestJS HttpExceptions (`NotFoundException`, `ForbiddenException`, `BadRequestException`).
- Catch unexpected exceptions via `AllExceptionsFilter` to produce standard error envelopes with `requestId`.

## 5. Testing Requirements

- Unit tests are MANDATORY for:
  - All NestJS security guards (`JwtAuthGuard`, `RolesGuard`, `TenantGuard`).
  - Placement readiness score computation functions.
  - Eligibility and cutoff filtering logic.
- Target fast, deterministic test suites using Jest (api) and Vitest (web/shared).

## 6. Conventional Commits

- Follow the Conventional Commits specification:
  - `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`, `perf:`.
