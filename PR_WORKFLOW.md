# Pull Request Workflow - MANDATORY

## 🚨 Golden Rule
**NEVER create a PR before running ALL checks and fixing ALL issues**

## Pre-PR Checklist (Required)

Run these commands IN ORDER and fix all issues before creating any PR:

```bash
# Quick option - Run all checks at once
pnpm check

# OR run individually:
# 1. Lint check - Fix all linting warnings/errors
pnpm lint
# Auto-fix: pnpm lint:fix

# 2. Format code - Apply consistent formatting
pnpm format

# 3. TypeScript check - No type errors allowed
pnpm typecheck

# 4. Build - Must build successfully
pnpm build
```

Note: The `pnpm check` command runs: biome check + typecheck + build all at once!

## Workflow Steps

1. **Make changes** in feature branch
2. **Run full checklist** above
3. **Fix all issues** - no exceptions
4. **Verify clean run** - run checklist again
5. **Only then create PR**

## For Sub-agents

When working on any task:
- Run checks after EVERY significant change
- Never skip steps to "save time"
- If a check fails, fix it immediately
- Don't create "WIP" PRs with failing checks

## Pre-commit Hook

To enforce this automatically:

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "Running pre-commit checks..."
pnpm lint && 
pnpm format && 
pnpm typecheck && 
pnpm build && 
pnpm test
```

## Common Issues

- **Lint errors**: Usually import order, unused vars
- **Format issues**: Run `pnpm format` to auto-fix
- **Type errors**: Check function signatures, missing types
- **Build failures**: Often missing dependencies or syntax errors
- **Test failures**: Update tests when changing functionality

## Benefits

✅ No broken CI  
✅ Faster PR reviews  
✅ Higher code quality  
✅ Less back-and-forth  
✅ Professional workflow

This is non-negotiable. Quality > Speed.