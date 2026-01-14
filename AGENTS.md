# Repository Guidelines

## Project Structure & Module Organization
- `index.html`, `styles.css`, `app.js` — static web app for the migration map/infographic.
- `geo/` — mapping helpers (region normalization, flow styling).
- `assets/geo/` — GeoJSON boundaries and office center coordinates.
- `data/` — local KOSIS downloads and merged output (gitignored).
- `scripts/` — Python utilities for fetching and merging KOSIS data.
- `tests/` — Node-based test scripts (`*.test.js`).

## Build, Test, and Development Commands
- `python3 -m http.server 8000` — serve the app from repo root so `assets/` and `data/` resolve.
- `python3 scripts/kosis_download.py --env-file .env --user-stats-id <ID> --prd-se Y --start 1990 --end 2025 --out data/kosis_yearly/kosis_1990_2025.json` — yearly KOSIS pull.
- `python3 scripts/kosis_param_download.py --env-file .env --out data/kosis_yearly/` — parameterized pulls by item/age/sex (see script flags).
- `python3 scripts/merge_kosis_data.py --input-dir data/kosis_yearly --output data/kosis_all.json` — build merged cache.
- `node tests/layout.test.js` (or any file in `tests/`) — run a single test file.

## Coding Style & Naming Conventions
- Use 2-space indentation for HTML/CSS/JS.
- Prefer `const`/`let`, small pure helpers in `geo/`, and descriptive DOM ids (`flow-map`, `net-legend`).
- Data files follow `data/kosis_yearly/kosis_<period>.json`.

## Testing Guidelines
- No test runner yet; execute test files directly with `node`.
- Keep tests in `tests/` with `*.test.js` names and focus on a single behavior.

## Commit & Pull Request Guidelines
- No established convention; use short, imperative messages (e.g., "Refine flow legend").
- PRs should include: summary, data/source changes, and screenshots for UI updates.

## Security & Configuration Tips
- Store secrets in `.env` (e.g., `API_KEY`, `KOSIS_USER_STATS_ID`); never commit them.
- Keep `data/` and `openApi_manual_v1.0.pdf` untracked.

## Agent-Specific Instructions
- Follow README’s test-first policy: add/update tests before code edits and run them after.
- Keep `README.md` structured and updated with current context and next steps.
