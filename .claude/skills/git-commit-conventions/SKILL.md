---
name: git-commit-conventions
description: >
  Enforces disciplined Git commit practices using Conventional Commits during any coding task.
  Use this skill whenever working on a project with a Git repository — including writing new features,
  fixing bugs, refactoring, updating docs, or any code change. This skill governs WHEN to commit
  (after every atomic change), HOW to write the commit message (Conventional Commits format),
  and how to keep commits clean and reviewable. Trigger this skill for any development work
  in a Git repo, even if the user doesn't explicitly mention "git" or "commit" — if code is
  being changed in a Git project, these rules apply.
---

# Git Commit Conventions

This skill defines a strict, professional Git workflow. The goal: every commit in the history
should be atomic, self-describing, and independently reviewable. Follow these rules for all
code changes in any Git repository.

## Core Principle: Commit Early, Commit Often

After completing each independent, logically coherent change, **commit immediately** — do not
wait for the user to ask. Each commit is a checkpoint. If the next change breaks something,
a clean history makes rollback trivial.

A good rule of thumb: if you can describe the change in a single short sentence, it's one commit.
If you need "and" to describe it, it's probably two.

## Pre-Commit Checklist

Before every commit, verify:

1. **The change is complete** — no half-finished logic, no placeholder TODOs introduced in this diff
2. **Existing tests pass** — run the project's test suite (or relevant subset) if available; do not commit if tests fail unless the commit is explicitly a `test:` commit that adds/modifies tests
3. **No unrelated changes are staged** — use `git diff --cached` to review; if unrelated hunks snuck in, unstage them and commit separately
4. **No secrets or credentials** are included in the diff
5. **Linting passes** — if the project has a linter configured, run it

If any check fails, fix the issue before committing. Never use `--no-verify` to skip hooks
unless explicitly told to by the user.

## Conventional Commits Format

Every commit message follows this structure:

```
<type>(<scope>): <short description>

[optional body]

[optional footer(s)]
```

### Rules for the subject line

- **type** is required (see table below)
- **scope** is optional but encouraged — it names the module, feature, or area affected (e.g., `auth`, `api`, `ui`, `db`)
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

### When to include a body

Add a body (separated by a blank line) when:

- The "why" behind the change isn't obvious from the subject line
- There's important context (trade-offs, alternatives considered, migration notes)
- The change is large and benefits from a brief summary of what changed

Keep body lines at 72 characters or fewer. Explain *why*, not *what* — the diff already shows what changed.

### When to include a footer

Use footers for:

- **Breaking changes**: start with `BREAKING CHANGE:` and describe the impact
- **Issue references**: `Closes #123` or `Refs #456`

**Example with body and footer:**
```
feat(auth): add OAuth2 login via Google

Replace the custom email/password flow with Google OAuth2.
This reduces onboarding friction and eliminates the need to
store hashed passwords.

BREAKING CHANGE: /api/login endpoint removed; use /api/auth/google
Closes #42
```

## Type Isolation Rules

These boundaries keep the history clean and reviewable:

- **`fix`** must not change any public API surface (no new endpoints, no changed signatures).
  If a fix requires an API change, split it: one `fix` commit for the internal logic, one
  `feat` or `refactor` commit for the API change.
- **`feat`** has a clear boundary — one commit per user-facing capability. If a feature
  requires backend + frontend work, split by layer or by independently deployable unit.
- **`refactor`** must not change externally observable behavior. If tests break after a
  refactor, either the refactor changed behavior (wrong type) or the tests were too
  tightly coupled (update the tests in the same commit only if trivial; otherwise separate).
- **`docs`** is independent of code changes. If a code change requires a docs update,
  make two commits: one for code, one for docs. Exception: inline code comments that
  travel with the code can be part of the code commit.
- **`style`** must not touch logic. If a formatter reformats a file and you also fix a
  bug in it, those are two commits.
- **`test`** for adding/updating tests. If a bug fix includes a regression test, the test
  can live in the `fix` commit — but if you're adding broader test coverage unrelated to a
  fix, use `test`.

## Atomic Commit Strategy

### What counts as "one thing"

Each commit should represent exactly one of these:

- Add a single endpoint / route / API method
- Fix a single bug (identified by one root cause)
- Refactor a single function, class, or module
- Update a single config or dependency
- Add/update tests for a single unit
- Update a single section of documentation

### Splitting strategy

When a task involves multiple changes, follow this order:

1. **Infrastructure first** — dependencies, configs, build changes (`build`, `chore`)
2. **Refactors** — restructure existing code to prepare for the new feature (`refactor`)
3. **Feature implementation** — the actual new capability (`feat`)
4. **Tests** — if not included in the feat commit (`test`)
5. **Documentation** — update docs to reflect changes (`docs`)

This ordering ensures each commit builds on a stable foundation and the history reads
like a narrative of the work.

### Example: adding a new API endpoint

Instead of one giant commit, split it:

```
chore: add pydantic model for industry response        # data model
feat(api): add GET /industries endpoint                # the endpoint
test(api): add tests for industries endpoint           # tests
docs(api): document industries endpoint in README      # docs
```

## Edge Cases and Judgment Calls

**Tiny fixes during feature work** — if you spot a typo or minor style issue while building
a feature, resist the urge to include it in the feature commit. Commit the fix separately
first (even if it's one line), then continue with the feature.

**Generated files** — if a commit regenerates lock files, migration files, or compiled
assets as a side effect, include them in the same commit that caused the regeneration.
Don't make a separate commit for `package-lock.json` changes that result from a dependency
update.

**Initial project setup** — the first commit can be broader (e.g., `chore: initial project setup`)
since there's no history to stay clean against. But once the first commit is done, all
subsequent commits follow these rules.

**Merge conflicts** — when resolving merge conflicts, the merge commit message should
follow the default Git format. Don't force Conventional Commits syntax onto merge commits.

**Amending vs. new commit** — if you realize the previous commit has a mistake and it
hasn't been pushed yet, prefer `git commit --amend` over a separate `fix` commit. Only
amend unpushed commits.

## Working with Branches

When the project uses branches:

- Branch names should be descriptive: `feat/add-industries-endpoint`, `fix/allocation-mapping`
- Use the pattern `<type>/<short-kebab-description>`
- Keep branch-specific commits clean — they'll become the PR/MR history

## Quick Reference

```
✓  feat(auth): add JWT refresh token endpoint
✓  fix(db): prevent duplicate entries on concurrent insert
✓  refactor(api): consolidate error handling middleware
✓  docs: add contributing guidelines
✓  test(auth): cover token expiration edge case
✓  style: apply prettier formatting to src/
✓  perf(search): cache frequent queries in redis
✓  build: upgrade typescript to 5.4
✓  ci: add staging deployment workflow
✓  chore: remove unused dev dependencies

✗  update code                          ← vague, no type
✗  Fix stuff                            ← vague, capitalized
✗  feat: add auth and update docs.      ← two things, has period
✗  FEAT: ADD LOGIN                      ← wrong case
✗  fix: refactor the validation logic   ← wrong type (refactor, not fix)
```
