---
name: commit-message
description: Write concise Conventional Commit messages from code changes. Use when drafting commit messages for git commits, pull request squash messages, or release-ready history.
---

# Commit Message

Use this format:

```text
<type>: <subject>
```

Rules:
- Pick one type from: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`.
- Start `<subject>` with a lowercase letter.
- Keep `<subject>` short, imperative, and specific.
- Avoid trailing punctuation.
- Use the imperative mood: write "add button", not "added button"
- Keep the subject line <= 72 characters.

Type guide:
- `feat`: add user-facing functionality
- `fix`: correct a bug or regression
- `docs`: update docs only
- `style`: formatting only, no behavior change
- `refactor`: internal code improvement without behavior change
- `test`: add or update tests
- `chore`: tooling, deps, config, or maintenance

Examples:
- `feat: add keyboard shortcut help modal`
- `fix: handle null branch in repo picker`
- `docs: document local oauth setup`
- `refactor: split markdown sanitizer into pure helpers`

Before finalizing, verify:
1. The type matches the change.
2. The first character after `: ` is lowercase.
3. The summary is understandable without extra context.
