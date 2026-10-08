# 05 - AI Integration & Usage Rules

## 1. Provider Abstraction

- All Google Gemini or LLM interactions must implement an abstract `AiProvider` interface defined in `apps/api`.
- Concrete implementations (e.g. `GeminiAiService`) must be injected via NestJS Dependency Injection.
- Model IDs (e.g. `gemini-2.0-flash`, `gemini-1.5-pro`) must be loaded from environment variables (`GEMINI_MODEL`), never hardcoded.

## 2. Determinism vs AI Responsibility

- **NEVER use AI for deterministic calculations**:
  - MCQ evaluation and answer scoring must be 100% deterministic code.
  - Coding question test-case evaluation is handled strictly by Judge0 / compiler sandbox.
  - Placement readiness score formula (weighted sum of aptitude, core, coding, CGPA) is computed deterministically in TypeScript.
- **Allowed AI Use Cases**:
  - Unstructured resume parsing and gap recommendations.
  - Contextual mock interview conversational simulation.
  - Code refactoring hints and explanatory feedback after test cases pass/fail.
  - Senior interview experience synthesis into company tips.

## 3. Structured Output & Validation

- Every prompt must enforce strict structured JSON output using schema enforcement / response schemas.
- The raw AI response MUST be parsed and validated against a dedicated Zod schema before consumption or persistence.
- Store the prompt version, model identifier, tokens used, and validated output in the database for reproducibility and cost audit.

## 4. Rate Limiting, Quotas & Async Execution

- Per-user daily/monthly token quotas must be enforced at the API layer before calling the AI provider.
- AI operations requiring more than 2 seconds (e.g. full resume critique, multi-stage mock interview evaluation) MUST be executed asynchronously via background worker queues (BullMQ), not in a synchronous HTTP request/response cycle.
