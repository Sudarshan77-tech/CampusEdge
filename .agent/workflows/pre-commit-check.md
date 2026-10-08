# Workflow: /pre-commit-check

## Description

Quality and regression verification pipeline run before committing code to version control.

## Automated Verification Steps

Execute the following sequential checks from the repository root:

```powershell
# 1. Format & Lint Verification
pnpm lint

# 2. Strict TypeScript Verification
pnpm typecheck

# 3. Test Suites Execution (Jest + Vitest)
pnpm test

# 4. Production Build Verification
pnpm build
```

## Failure Protocol

- If any command fails, halt the workflow immediately.
- Inspect the log trace and repair the source issue.
- Never use `@ts-ignore`, `any`, or skip flags to bypass a failing check.
- Repeat the verification until all 4 steps exit with code 0.
