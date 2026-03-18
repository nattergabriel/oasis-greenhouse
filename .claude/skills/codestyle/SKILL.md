---
name: codestyle
description: Code quality guidelines for writing clean, modular, professional code. Use this skill whenever writing, editing, or reviewing code in any language. Applies to all code output, including scripts, application code, and code snippets in documentation. Trigger this whenever the user asks you to write code, fix a bug, add a feature, refactor, or review code.
---

# Code Style

These rules apply to all code you write, regardless of language or framework.

## Core principles

Write code that a teammate can read and understand in under 30 seconds per function. The goal is clarity, not cleverness. Professional code is simple code that handles its job well.

### Keep it simple

Solve the problem in front of you with the most straightforward approach that works. A few concrete lines are better than an abstraction you might need later.

- Write the obvious solution first. Only add complexity when you have a concrete reason.
- Avoid premature abstraction. If something is used once, inline it. Extract only when you see real duplication (three or more occurrences, not two).
- Skip design patterns unless they solve an actual problem you're facing right now. A factory for one type, a strategy for one algorithm, or a singleton for convenience are all noise.
- Flat is better than nested. If you're three levels of indentation deep, extract a function or return early.

### Keep it modular

Small, focused pieces that do one thing well. This is the most important structural principle.

- **Functions:** Each function does one thing. If you can't name it clearly, it's doing too much. Aim for 10-30 lines as a guideline, not a rule.
- **Files/modules:** Group related functions together. Split when a file starts covering multiple distinct responsibilities, not at an arbitrary line count.
- **Dependencies flow one way.** A module should not reach back into its caller's context. Pass what you need as arguments.
- **Public surface area should be small.** Expose only what other modules need. Keep internal helpers private/unexported.

### Keep it readable

Code is read far more than it is written. Optimize for the reader.

- **Names carry meaning.** A variable called `remainingRetries` beats `r`. A function called `parseUserInput` beats `process`. Spend time on names.
- **Structure communicates intent.** Use whitespace to group related lines. Separate logical steps with a blank line. The shape of the code on the page should reflect its logical structure.
- **No decorative comments.** Never use section dividers like `// --- Helper methods ---`, `# ========`, `/* *** Section *** */`, or banner-style comments. These add visual noise without information. The code's structure and naming should make the organization obvious.
- **Comments explain why, not what.** If a line of code needs a comment to explain what it does, rewrite the code instead. Comments are for non-obvious business reasons, workarounds, and tradeoffs.

## Naming

- Functions and methods: verb phrases (`fetchUser`, `calculate_total`, `ValidateInput`)
- Booleans: read as true/false questions (`isValid`, `has_permission`, `shouldRetry`)
- Collections: plural nouns (`users`, `pending_tasks`, `errorMessages`)
- Follow the language's conventions for casing (camelCase in JS/TS, snake_case in Python/Rust, PascalCase for Go exports, etc.)
- Avoid abbreviations unless they're universally understood in context (`url`, `id`, `config` are fine; `usr`, `msg`, `proc` are not)

## Error handling

- Handle errors where you can do something useful about them. Don't catch an error just to log and rethrow it.
- Fail fast. Validate inputs at the boundary (API handlers, CLI entry points, public function interfaces). Internal code can trust its callers.
- Use early returns for error/edge cases to keep the happy path unindented and readable.

## Functions

- Put the most important function (the entry point or public API) near the top of the file. Supporting functions follow in roughly the order they're called.
- Prefer pure functions where practical. Functions that take inputs and return outputs are easier to test and reason about than functions that mutate external state.
- Keep argument lists short (3 or fewer is a good target). If you need more, consider grouping related arguments into a single object or struct.

## Formatting

- Follow the language's standard formatter and conventions (Prettier for JS/TS, Black for Python, gofmt for Go, rustfmt for Rust, etc.)
- Consistency within a file matters more than any specific style preference. Match what's already there.
- When no formatter exists, prioritize consistent indentation and brace style over personal preference.
