# Contributing to IssueScope

Thank you for your interest in contributing to IssueScope! We welcome contributions from everyone. By participating in this project, you help make it better for the community.

## Pull Request Format and Description Requirements

When creating a Pull Request (PR), please follow these guidelines:

- Use a clear and descriptive title for your PR.
- Provide a summary of the changes you made in the PR description.
- Explain **why** the change was made, not just what was changed.
- If your PR fixes an open issue, include `Fixes #ISSUE_NUMBER` in the description.
- Include before/after screenshots if your changes affect the UI.

## Commit Message Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/). Your commit messages should be structured as follows:

```
<type>(<scope>): <subject>
```

**Types:**

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools and libraries

**Example:** `feat(ui): add dark mode toggle`

## Test Expectations

Before submitting a PR, ensure that your code passes all automated checks:

- **Type Checking:** Run `bun run typecheck` to ensure there are no TypeScript errors.
- **Build:** Run `bun run build` to ensure the project builds successfully.
- **Tests:** Add unit tests for any new complex logic or utility functions. Existing tests must pass before the PR can be merged.

## Code Style

- **Formatting:** We use Prettier for code formatting. Run `bun run format` before committing.
- **Linting:** We use ESLint to catch bugs and enforce style. Run `bun run lint` to check for issues.
- Use meaningful variable and function names.
- Keep components small and focused on a single responsibility.
- Write comments explaining complex or non-obvious logic.

### Pre-commit Hooks

This project uses **Husky** and **lint-staged** to automatically lint and format your code before every commit. When you run `git commit`, it will automatically:

1. Run `eslint --fix` on all staged `.ts` and `.tsx` files.
2. Run `prettier --write` on all staged code, markup, and stylesheet files.

You don't have to worry about formatting manually—just ensure you don't bypass the hooks (e.g., avoid using the `--no-verify` flag).

## Typical Review Timeline

We aim to review Pull Requests within **3-5 business days**.

- If we require changes, the timeline resets after you push the requested updates.
- Please be patient! We will get to your PR as soon as possible.
- If a week goes by without any activity, feel free to politely ping the maintainers in the PR comments.
