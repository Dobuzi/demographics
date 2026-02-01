# CLAUDE.md

Guide for AI assistants working on this repository.

## Project Overview

**Demographics** is a static web application that visualizes Korea's internal population migration flows. It renders an interactive SVG map showing migration between 17 administrative regions (Sido) using data from the Korean Statistical Information Service (KOSIS).

- **Live site**: https://dobuzi.github.io/demographics/
- **Tech stack**: Vanilla HTML/CSS/JS — no frameworks, no bundler, no npm
- **Language**: UI text is in Korean
- **Data**: KOSIS API (1995-2025), hosted as gzip-compressed JSON in a separate repo (`Dobuzi/demographics-data`)

## Repository Structure

```
index.html          Main HTML entry point
app.js              Application controller (~1,000 lines) — data loading, SVG rendering, controls, playback
styles.css          All styles (~1,200 lines) — CSS variables, dark theme, responsive layout

geo/
  region_mapping.js   UMD module: region name normalization and Sido code mapping (17 regions)
  flow_style.js       UMD module: flow colors, width scaling, display counts, label formatting
  data_utils.js       UMD module: data validation, timeline, cache keys, formatting helpers
  data_processing.js  UMD module: buildFlows() and buildNet() — extracted from app.js

assets/geo/
  korea_sido.geojson    GeoJSON boundaries for 17 regions
  sido_office_centers.json  Region centroid coordinates

scripts/
  kosis_download.py         Download yearly KOSIS data
  kosis_param_download.py   Download parameterized KOSIS data
  merge_kosis_data.py       Merge yearly files into single JSON

tests/
  *.test.js           43 test files using Node.js assert module (no test runner)

.github/workflows/
  pages.yml           GitHub Actions: deploy to GitHub Pages on push to main
  test.yml            GitHub Actions: run all tests on push/PR to main
```

### Gitignored paths

`.env`, `data/`, `kosis_all.json`, `kosis_all.json.gz`, `openApi_manual_v1.0.pdf`, `Demographics.mov`

## Development Commands

### Serve locally
```bash
python3 -m http.server 8000
```
Serve from the repo root so `assets/` and `data/` resolve correctly.

### Run a single test
```bash
node tests/<name>.test.js
```
There is no test runner. Each file is self-contained and uses `require("assert")`. Run files directly with `node`.

### Run all tests
```bash
for f in tests/*.test.js; do node "$f"; done
```

### Data pipeline (Python, requires .env with API_KEY)
```bash
python3 scripts/kosis_download.py --env-file .env --user-stats-id <ID> --prd-se Y --start 1990 --end 2025 --out data/kosis_yearly/kosis_1990_2025.json
python3 scripts/kosis_param_download.py --env-file .env --start-year 1990 --end-year 2025 --out-dir data/kosis_yearly/
python3 scripts/merge_kosis_data.py --input-dir data/kosis_yearly --output data/kosis_all.json
```

## Architecture

### Data flow
```
User interaction -> DOM event -> refresh() -> loadData(year) -> buildFlows() -> drawFlows() (SVG)
                                            -> loadGeoJson()  -> buildNet()   -> drawBaseMap() (SVG fill)
```

### Key app.js concepts
- **LRU cache**: `Map` with `MAX_CACHE_ENTRIES = 12` for loaded period data
- **Merged data mode**: `window.KOSIS_USE_MERGED = true` loads a single gzip file (`kosis_all.json.gz`) via `DecompressionStream`; rows are filtered by period at render time
- **Prefetching**: `prefetchPeriod()` fetches upcoming periods adaptively based on `navigator.connection.downlink`
- **Playback**: `togglePlayback()` / `runPlaybackLoop()` iterate through a timeline (years 1995-2024, then months in 2025)
- **SVG rendering**: Quadratic Bezier curves (`flowPath()`) between region centroids, with gradients and pulse animations
- **Net fill**: Region polygons colored by net inflow (green `#27d17f`) / outflow (red `#f05b4c`)
- **Error handling**: `fetchJson()` retries with exponential backoff (`FETCH_MAX_RETRIES = 3`); errors shown via `#error-banner` with retry button
- **Abort on rapid changes**: Each `refresh()` call creates a new `AbortController`, aborting any in-flight fetch from the previous call

### Module pattern
All `geo/*.js` modules use UMD wrappers:
- In Node.js (tests): accessed via `require("../geo/flow_style")`
- In browser: exposed as `window.regionMapping`, `window.flowStyle`, `window.dataUtils`, `window.dataProcessing`

`geo/data_processing.js` depends on `geo/flow_style.js` and `geo/data_utils.js` (loaded via `require` in Node, `window` in browser).

`app.js` is browser-only and reads DOM elements directly via `document.getElementById`. It imports from the UMD modules via `window.dataUtils` and `window.dataProcessing`.

## Code Conventions

### Formatting
- **2-space indentation** for HTML, CSS, and JS
- `const` / `let` only (no `var`)
- No semicolons are omitted — always use semicolons

### Naming
| Context | Convention | Examples |
|---------|-----------|----------|
| DOM IDs | kebab-case | `flow-map`, `year-range`, `settings-toggle` |
| CSS classes | BEM-like | `region-shape`, `flow-line--pulse`, `is-active` |
| JS functions | camelCase | `buildFlows`, `formatNumber`, `togglePlayback` |
| JS constants | UPPER_SNAKE_CASE | `MAX_CACHE_ENTRIES`, `PLAY_INTERVAL_YEAR_MS` |
| Data files | snake_case | `kosis_all.json`, `korea_sido.geojson` |

### Console logging
Use bracket-prefixed format: `console.log("[functionName] message", data)`

### CSS design system
CSS variables defined at the root level: `--bg`, `--ink`, `--muted`, `--accent`, `--panel`. Dark theme only. Glass-panel effect via `backdrop-filter: blur()`.

### Accessibility
- Semantic HTML (`<button>`, `<label>`, `<main>`, `<footer>`)
- ARIA attributes (`aria-label`, `aria-expanded`, `aria-controls`, `role="status"`, `role="alert"`)
- Keyboard support: Escape closes settings, Tab navigation works
- `:focus-visible` outline styles for keyboard navigation
- `prefers-reduced-motion` media query disables animations/transitions

## Testing Policy

**Test-first**: Write or update tests BEFORE modifying implementation code.

### Test structure
- Each test file covers one behavior or module
- Tests use `require("assert")` with `assert.strictEqual`, `assert.ok`, `assert.deepStrictEqual`
- Tests may read source files with `fs.readFileSync` to validate HTML structure or CSS rules
- Tests import UMD modules via `require("../geo/flow_style")`, `require("../geo/region_mapping")`, `require("../geo/data_utils")`, or `require("../geo/data_processing")`

### After every change
Run affected test files to verify nothing is broken:
```bash
node tests/<relevant>.test.js
```

## Commit Guidelines

- Short imperative messages (e.g., "Refine flow legend", "Add age slider test")
- PRs should include: summary, data/source changes, and screenshots for UI updates

## Deployment

GitHub Pages deploys automatically on push to `main` via `.github/workflows/pages.yml`. The entire repo is served as a static site. No build step.

### Data hosting
Merged KOSIS data (`kosis_all.json.gz`) is hosted in a separate repo (`Dobuzi/demographics-data`). The base URL is set in `index.html`:
```javascript
window.KOSIS_DATA_BASE_URL = "https://raw.githubusercontent.com/Dobuzi/demographics-data/main";
```

## Security

- **Never commit secrets**. API keys go in `.env` (gitignored)
- `data/` is gitignored — downloaded KOSIS data stays local
- No server-side code; the app is entirely client-side

## Common Tasks

### Adding a new control or UI element
1. Add HTML markup in `index.html` with a kebab-case `id`
2. Add a `const` reference at the top of `app.js`
3. Bind event listener in `bindControls()`
4. Add or update CSS in `styles.css`
5. Write a test in `tests/` before implementing logic

### Modifying flow rendering
- Flow colors: `FLOW_COLORS` in `geo/flow_style.js`
- Flow width: `flowWidthScale()` in `geo/flow_style.js`
- Number of flows shown: `flowDisplayCount()` and `flowPulseCount()` in `geo/flow_style.js`
- SVG path generation: `flowPath()` in `app.js` (includes NaN guard for overlapping centroids)
- Data aggregation: `buildFlows()` and `buildNet()` in `geo/data_processing.js`
- Gradient stops: `buildGradientStops()` in `geo/flow_style.js`

### Adding a new region alias
Add the alias to the `ALIASES` object in `geo/region_mapping.js` and add a corresponding test in `tests/geojson_mapping.test.js`.

### Modifying the data pipeline
Python scripts in `scripts/` use only the stdlib (`urllib`, `json`, `csv`, `pathlib`, `argparse`). No pip dependencies.
