---
name: git-commit-conventions
description: >
  Defines Git commit conventions using Conventional Commits for any coding project.
  This skill is a REFERENCE ONLY — it tells Claude how to write good commits,
  but does NOT instruct Claude to commit automatically during development.
  Commits should only happen when the user explicitly triggers them
  (e.g., via /git-commit command or by asking Claude to commit).
  Use this skill whenever the user asks to commit, review staged changes,
  or organize uncommitted work into clean commits.
---

# Git Commit Conventions

This skill defines commit message format and organization rules. It is a **reference
specification** — Claude should never commit code on its own initiative during development.
Commits happen only when the user explicitly asks.

## Workflow

1. **During development** — focus entirely on writing code. Do not run any git commands.
   All changes stay in the working directory.
2. **When the user triggers a commit** — analyze all uncommitted changes, group them by
   logical unit, and create clean atomic commits following the rules below.

## Conventional Commits Format

Every commit message follows this structure:

```
<type>(<scope>): <short description>

[optional body]

[optional footer(s)]
```

### Subject line rules

- **type** is required (see table below)
- **scope** is optional but encouraged — names the module, feature, or area affected (e.g., `auth`, `api`, `ui`, `db`)
- **description** starts with a lowercase verb in the imperative mood ("add", not "added" or "adds")
- No period at the end
- Keep it under 50 characters when possible; hard limit at 72 characters
- Write in English

### Commit types

| Type       | When to use                                          | Example                                             |
|------------|------------------------------------------------------|-----------------------------------------------------|
| `feat`     | A new feature or user-facing capability               | `feat(api): add industries endpoint`                |
| `fix`      | A bug fix                                            | `fix(api): correct field mapping in allocation`     |
| `refactor` | Code restructuring that does not change behavior      | `refactor(utils): extract status computation`       |
| `docs`     | Documentation only (README, comments, API docs)       | `docs(api): update endpoint reference`              |
| `test`     | Adding or updating tests                             | `test(allocation): add result validation tests`     |
| `style`    | Formatting, whitespace, linting — no logic change     | `style: fix indentation in config module`           |
| `perf`     | Performance improvement with no functional change     | `perf(query): add index for allocation lookup`      |
| `build`    | Build system or dependency changes                   | `build: upgrade vite to v6`                         |
| `ci`       | CI/CD configuration changes                          | `ci: add eslint step to GitHub Actions`             |
| `chore`    | Other maintenance (tooling, configs, non-src changes) | `chore: update .gitignore for IDE files`            |
| `revert`   | Reverting a previous commit                          | `revert: revert feat(api): add industries endpoint` |

## Atomic Commit Rules

### What counts as "one commit"

Each commit represents exactly one logical change:

- Add a single endpoint / route / API method
- Fix a single bug (one root cause)
- Refactor a single function, class, or module
- Update a single config or dependency
- Add/update tests for a single unit
- Update a single section of documentation

If you need "and" to describe the change, it's probably two commits.

### Type isolation

- **`fix`** must not change any public API surface. If a fix requires an API change,
  split into separate commits.
- **`feat`** has a clear boundary — one commit per user-facing capability.
- **`refactor`** must not change externally observable behavior.
- **`docs`** is independent of code changes. If code and docs both changed, two commits.
- **`style`** must not touch logic.

### Commit ordering

When multiple commits are needed, follow this order:

1. `build` / `chore` — dependencies, configs
2. `refactor` — restructure existing code
3. `feat` / `fix` — the actual changes
4. `test` — test coverage
5. `docs` — documentation updates

## When to include a body

Add a body (blank line after subject) when:

- The "why" isn't obvious from the subject line
- There's important context (trade-offs, alternatives, migration notes)
- The change is large

Keep body lines at 72 characters or fewer. Explain *why*, not *what*.

## When to include a footer

- **Breaking changes**: `BREAKING CHANGE: <description>`
- **Issue references**: `Closes #123` or `Refs #456`

**Full example:**
```
feat(auth): add OAuth2 login via Google

Replace custom email/password flow with Google OAuth2.
Reduces onboarding friction and eliminates password storage.

BREAKING CHANGE: /api/login endpoint removed; use /api/auth/google
Closes #42
```

## Staging Strategy

When the user triggers a commit and there are mixed changes in the working directory:

1. Run `git diff` and `git status` to see all uncommitted changes
2. Group changes by logical unit (not by file — one file may contain multiple logical changes)
3. Use `git add -p` (patch mode) when a single file contains changes belonging to different commits
4. Stage one logical group at a time, commit, then move to the next
5. After all commits, show the user a summary: `git log --oneline -n <count>`

## Pre-Commit Checks

Before each commit, verify:

1. No unrelated changes are staged (`git diff --cached`)
2. No secrets or credentials in the diff
3. Run linter if configured
4. Run tests if available (skip only if user explicitly says so)

## Edge Cases

- **Generated files** (lock files, migrations) — include in the commit that caused them
- **Merge conflicts** — keep default Git merge commit format
- **Amending** — prefer `git commit --amend` for unpushed mistakes instead of a new fix commit

## Branch Naming

When creating branches, use: `<type>/<short-kebab-description>`

Examples: `feat/add-industries-endpoint`, `fix/allocation-mapping`

## Quick Reference

```
✓  feat(auth): add JWT refresh token endpoint
✓  fix(db): prevent duplicate entries on concurrent insert
✓  refactor(api): consolidate error handling middleware
✓  docs: add contributing guidelines
✓  test(auth): cover token expiration edge case

✗  update code                          ← vague, no type
✗  Fix stuff                            ← vague, capitalized
✗  feat: add auth and update docs.      ← two things, has period
✗  FEAT: ADD LOGIN                      ← wrong case
```