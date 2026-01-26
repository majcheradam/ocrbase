# TypeScript Conventions

Ultracite (Oxlint) handles most enforcement. These are additional guidelines:

## Linter Rules

Never use inline disable comments (`eslint-disable`, `@ts-ignore`, `@ts-nocheck`, etc.).
If a rule needs adjustment, configure it in `oxlintrc` or `oxfmtrc`.

## Beyond the Linter

- Prefer `unknown` over `any` when type is genuinely unknown
- Use const assertions (`as const`) for immutable values
- Leverage type narrowing instead of type assertions
- Extract magic numbers into named constants
