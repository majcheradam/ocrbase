# Git Workflow

## Conventional Commits (Strict)

Follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`

## Branching

- Only `feat/*` branches allowed
- PRs are squash-merged

## GitHub CLI

Use `gh` for issues and PRs.

## Commit Guidelines

- Keep commits atomic
- Always run `git status` before committing

## Safety Rules

- Never amend commits unless explicitly approved
- Never run destructive operations (`reset --hard`, `rm`, checkout to older commits) without explicit approval
