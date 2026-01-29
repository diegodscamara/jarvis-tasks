# Jarvis Tasks - Development Workflow

## Task Statuses

| Status | Icon | Description |
|--------|------|-------------|
| **Backlog** | 📋 | Ideas, features to consider |
| **Planning** | 🎯 | Active specification & planning |
| **To Do** | 📝 | Ready to implement |
| **In Progress** | 🔄 | Currently being worked on |
| **Review** | 👀 | Code review, QA, testing |
| **Done** | ✅ | Complete and merged |

## Workflow

### 1. Backlog → Planning
When starting work on a task:
1. Move task to **Planning**
2. Run speckit commands in order:
   - `/speckit.specify` - Write the specification
   - `/speckit.plan` - Create implementation plan
   - `/speckit.tasks` - Break into subtasks
3. Add spec summary to task comments

### 2. Planning → To Do
After planning is complete:
1. Review the spec and plan
2. Move to **To Do** when ready to implement

### 3. To Do → In Progress
When starting implementation:
1. Run `/speckit.implement`
2. Move to **In Progress**
3. Create feature branch
4. Implement the feature
5. Write tests

### 4. In Progress → Review
When implementation is complete:
1. Move to **Review**
2. Open PR (if applicable)
3. Run review skills and commands:
   - Code review excellence skill
   - `pnpm checks` (type check, lint, test)
   - Security analysis
4. Address review comments
5. Add implementation summary to task comments

### 5. Review → Done
When all checks pass:
1. QA testing complete
2. Security checks passed
3. CI/CD green
4. Code reviewed
5. Move to **Done**
6. Write final summary in comments
7. Tag Diego: `@Diego - Task complete!`

## Model Assignment by Status

| Status | Best Model | Reasoning |
|--------|-----------|-----------|
| Planning | Opus | Deep thinking, architecture |
| In Progress | Sonnet/Opus | Implementation work |
| Review | Opus | Quality analysis |

## Key Principles

1. **One task at a time** - No parallel work on the same task
2. **Quality over speed** - Follow the workflow
3. **Document everything** - Comments track progress
4. **Tag on completion** - Always notify when done
5. **Autonomy with accountability** - Free to assign models, responsible for quality

## Comment Format

### Planning Phase
```
## 🎯 Planning Started

### Specification
[Summary of what we're building]

### Plan
[High-level implementation plan]

### Tasks
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3
```

### Implementation Complete
```
## 🔄 Implementation Summary

### Changes
- File 1: [description]
- File 2: [description]

### Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing

### Notes
[Any important notes]
```

### Done
```
## ✅ Complete

### Summary
[What was done]

### Files Changed
- path/to/file1.ts
- path/to/file2.ts

### Verification
- [x] Tests pass
- [x] Lint clean
- [x] Security check passed

@Diego - Task complete! 🎉
```
