# 07 - AI Agent Execution Protocol

## 1. Operating Principles

1. **Plan First**: Always formulate a clear, sequential plan before touching files or running multi-stage commands.
2. **One Small Task at a Time**: Execute changes incrementally. Verify each step with automated checks before advancing.
3. **Execution Order**: When creating new features, always adhere to:
   `Database Schema -> Migration & RLS -> Shared Types -> API Module -> Frontend UI -> Tests`.
4. **Human Review on Sensitive Changes**:
   - Present explicit code diffs for review whenever modifying:
     - `schema.prisma` or migration SQL files.
     - Authentication logic (`JwtAuthGuard`, `JwtStrategy`).
     - Authorization and isolation logic (`RolesGuard`, `TenantGuard`, RLS policies).
5. **No Broken Windows**:
   - Never declare a step complete if `pnpm lint`, `pnpm typecheck`, or `pnpm test` fails.
   - Fix lint and type errors immediately at the root cause without using `any` or `@ts-ignore`.
6. **Ambiguity Resolution**:
   - Stop and ask the human developer for clarification whenever product specifications or tenant access rules are ambiguous.
7. **Roadmap Tracking**:
   - Update checkboxes in `ROADMAP.md` as tasks are completed and verified.
