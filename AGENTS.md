# Repository Guidelines

## Project Structure & Module Organization
This repository is currently a scaffold with no source files committed yet. Add new code under a top-level directory such as `src/` and place supporting assets under `assets/` or `public/`. If you introduce tests, keep them alongside the module (`src/foo.test.ts`) or in a dedicated `tests/` directory.

## Build, Test, and Development Commands
No build or test tooling is configured yet. When you add one, document the commands here. Example pattern:
- `npm run build` — compiles the project for production.
- `npm test` — runs the test suite.
- `npm run dev` — starts a local development server.

## Coding Style & Naming Conventions
No formatter or linter is enforced. Prefer 2-space indentation for JSON/YAML and 4-space indentation for code unless the chosen tooling dictates otherwise. Use descriptive, kebab-case names for directories (`data-import/`) and lowerCamelCase for variables and functions in code.

## Testing Guidelines
No testing framework is configured. If you add one, state the framework (for example, `pytest`, `jest`, or `go test`) and the conventions for naming tests. Keep test names explicit about behavior (e.g., `parses_empty_file` or `handlesEmptyFile`).

## Commit & Pull Request Guidelines
No existing commit history defines a convention. Use clear, imperative commit messages such as "Add data ingestion pipeline". For pull requests, include:
- a brief description of the change,
- any linked issues,
- and screenshots or sample output when user-facing changes occur.

## Security & Configuration Tips
Do not commit secrets. If you add configuration, prefer environment variables and document required keys in a `README.md` or `.env.example`.
