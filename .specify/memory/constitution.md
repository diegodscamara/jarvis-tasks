<!--
SYNC IMPACT REPORT
==================
Version Change: 0.0.0 → 1.0.0 (MAJOR: Initial constitution creation)

Modified Principles: N/A (new document)

Added Sections:
- Core Principles (5 principles)
- Technology Stack (new section)
- Development Workflow (new section)
- Governance

Removed Sections: N/A

Templates Requiring Updates:
- .specify/templates/plan-template.md: ✅ Compatible (Constitution Check section exists)
- .specify/templates/spec-template.md: ✅ Compatible (Requirements align with principles)
- .specify/templates/tasks-template.md: ✅ Compatible (Phase structure supports TDD)

Follow-up TODOs: None
==================
-->

# Jarvis Task Manager Constitution

## Core Principles

### I. Type Safety First

All code MUST use TypeScript with strict mode enabled. The `any` type is prohibited
except when interfacing with untyped third-party libraries (and MUST be documented
with a `// TODO: Type this properly` comment). Type interfaces MUST be created for
all data structures, API responses, and component props.

**Rationale**: Type safety catches errors at compile time, improves IDE support, and
serves as living documentation for data shapes across the codebase.

### II. Test-Driven Development

TDD is mandatory for all features and bug fixes:
- Tests MUST be written before implementation (Red phase)
- Tests MUST fail before writing implementation code
- Implementation MUST satisfy tests with minimal code (Green phase)
- Code MUST be refactored while tests remain green (Refactor phase)

**Rationale**: TDD ensures requirements are clarified before coding, provides
regression protection, and creates executable documentation of system behavior.

### III. API-First Design

The REST API is the primary integration point for AI agents. All API endpoints MUST:
- Follow RESTful conventions (GET/POST/PUT/DELETE with appropriate HTTP status codes)
- Return JSON responses with consistent structure
- Include proper error messages with actionable information
- Be documented in the README with request/response examples

**Rationale**: Jarvis and other AI agents interact with this system via API. Clear,
predictable API behavior enables reliable automation and multi-agent orchestration.

### IV. Responsive UI Excellence

The UI MUST provide excellent user experience across all devices:
- Mobile-first CSS approach using Tailwind CSS
- All interactive elements MUST be accessible via keyboard
- Components MUST follow shadcn/ui patterns for consistency
- Drag-and-drop interactions MUST have touch-friendly alternatives

**Rationale**: Both Diego (on mobile) and AI agents (via browser automation) interact
with this system. Responsive, accessible UI ensures usability across all contexts.

### V. Database Integrity

Database schema changes MUST follow this process:
1. Modify schema in Drizzle schema files
2. Run `pnpm db:generate` to create migration
3. Run `pnpm db:migrate` to apply migration
4. Never create SQL migrations manually

Data integrity constraints MUST be enforced at the database level (NOT just
application code) for required fields, foreign keys, and valid enum values.

**Rationale**: Database is the source of truth for task state. Migrations ensure
reproducible deployments and prevent data corruption from race conditions.

## Technology Stack

**Core Framework**: Next.js 15 with App Router (React 19)
**Language**: TypeScript 5.x (strict mode)
**Database**: SQLite via Drizzle ORM
**Styling**: Tailwind CSS 4.x with shadcn/ui components
**Deployment**: Vercel (auto-deploy on push to main)
**Package Manager**: pnpm

**Prohibited**:
- Direct SQL queries outside Drizzle ORM
- CSS-in-JS libraries (use Tailwind utilities)
- Class components (use functional components with hooks)
- `var` keyword (use `const`/`let`)

## Development Workflow

### Code Quality Gates

Before any code is considered complete:
1. `pnpm build` MUST pass without errors
2. TypeScript strict mode MUST report zero errors
3. All existing tests MUST pass
4. New functionality MUST have corresponding tests
5. Manual verification MUST confirm expected behavior

### Commit Discipline

- Never commit automatically without explicit approval
- Never use `git add .` or `git add -A` (add files individually)
- Commit messages MUST follow conventional commit format
- Never include co-author tags for AI assistants
- Run `pnpm format` after file changes

### Branch Strategy

- `main` branch deploys automatically to production
- Feature branches MUST be created for non-trivial changes
- PRs require manual review before merge

## Governance

This constitution supersedes all other development practices for the Jarvis Task
Manager project. All PRs and code reviews MUST verify compliance with these
principles.

**Amendment Process**:
1. Propose change with rationale in writing
2. Document impact on existing code/processes
3. Update constitution version following semver:
   - MAJOR: Principle removal or incompatible redefinition
   - MINOR: New principle or material expansion
   - PATCH: Clarification or typo fix
4. Update dependent templates if affected

**Compliance Review**: Constitution principles SHOULD be reviewed quarterly or when
significant architectural decisions arise.

**Version**: 1.0.0 | **Ratified**: 2026-01-29 | **Last Amended**: 2026-01-29
