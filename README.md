# Demographics: Population Flow Map

## Overview
- Web infographic for Korea migration flows using KOSIS yearly/monthly datasets.
- Single combined map shows flow lines plus net inflow/outflow fill on the same SVG.
- UI includes controls, summary stats, top flows, and legends in a no-scroll layout.

<img src="assets/demo.gif" alt="Demo" width="360" />

[Live Demo](https://dobuzi.github.io/demographics/)

## Architecture

### System Overview
```mermaid
flowchart TB
    subgraph Client["Browser Client"]
        UI["UI Layer<br/>index.html + styles.css"]
        App["App Controller<br/>app.js"]
        SW["Service Worker<br/>sw.js"]

        subgraph Modules["UMD Modules (geo/)"]
            RM["region_mapping.js<br/>Name normalization"]
            FS["flow_style.js<br/>Colors, widths, labels"]
            GU["geo_utils.js<br/>Projection, paths"]
            DU["data_utils.js<br/>Validation, timeline"]
            DP["data_processing.js<br/>buildFlows, buildNet"]
            I18N["i18n.js<br/>Translations"]
            CR["canvas_renderer.js<br/>High-perf rendering"]
        end
    end

    subgraph Data["Data Sources"]
        GH["GitHub Raw<br/>demographics-data repo"]
        GEO["Local Assets<br/>assets/geo/"]
    end

    UI --> App
    App --> Modules
    App --> SW
    SW --> GH
    App --> GEO
    GH --> |kosis_all.json.gz| App
    GEO --> |GeoJSON + centers| App
```

### Data Flow Sequence
```mermaid
sequenceDiagram
    participant User
    participant UI as UI (index.html/styles.css)
    participant App as App Controller (app.js)
    participant Cache as In-memory Cache
    participant Host as Data Host (raw.githubusercontent.com)
    participant Geo as Geo Assets (assets/geo)
    participant Helpers as Helpers (geo/*.js)

    User->>UI: Interact (year/age/sex/play)
    UI->>App: DOM events
    App->>Cache: Check cache for period
    alt Cache hit
        Cache-->>App: Return rows
    else Cache miss
        App->>Host: GET kosis_all.json.gz (merged)
        Host-->>App: gzip JSON
        App->>App: Decompress + parse
        App->>Cache: Store period rows
    end
    App->>Geo: GET GeoJSON/centers
    Geo-->>App: Region shapes + centers
    App->>Helpers: Normalize names + styling rules
    Helpers-->>App: Mapping + color/width rules
    App->>UI: Render SVG flows + net fill + labels
```

### Module Dependencies
```mermaid
flowchart LR
    subgraph Core
        APP[app.js]
    end

    subgraph Processing
        DP[data_processing.js]
        DU[data_utils.js]
        FS[flow_style.js]
    end

    subgraph Rendering
        GU[geo_utils.js]
        CR[canvas_renderer.js]
    end

    subgraph Utilities
        RM[region_mapping.js]
        I18N[i18n.js]
    end

    APP --> DP
    APP --> DU
    APP --> FS
    APP --> GU
    APP --> RM
    APP --> I18N
    APP -.-> CR

    DP --> FS
    DP --> DU
```

### UI Component Structure
```mermaid
flowchart TB
    subgraph Page["page (body)"]
        subgraph Main["main.content"]
            subgraph MapShell["map-shell"]
                TopRow["top-row<br/>header + summary panel"]
                MapCard["map-card<br/>SVG container"]
                Sidebar["sidebar<br/>top flows + controls"]
                Settings["settings-panel<br/>sex, item, speed, theme"]
            end
        end
        Footer["footer"]
    end

    subgraph MapCard
        SVG["#flow-map SVG"]
        Zoom["zoom-controls"]
        Minimap["minimap"]
        Tooltip["flow-tooltip"]
        Legend["net-legend"]
    end

    subgraph SVG
        Regions["region-shape paths"]
        FlowLines["flow-line paths"]
        Gradients["defs: gradients"]
        Particles["flow-particle circles"]
    end

    subgraph Overlays["Modal Overlays"]
        FlowModal["flow-modal"]
        ErrorBanner["error-banner"]
    end
```

### State Management
```mermaid
stateDiagram-v2
    [*] --> Idle

    Idle --> Loading: User changes year/age/sex
    Loading --> Rendering: Data loaded
    Rendering --> Idle: SVG updated

    Idle --> Playing: Click play
    Playing --> Loading: Next period
    Playing --> Idle: Click pause

    Loading --> Error: Fetch failed
    Error --> Loading: Retry clicked
    Error --> Idle: Dismiss

    state Playing {
        [*] --> WaitInterval
        WaitInterval --> FetchNext: Timer fires
        FetchNext --> WaitInterval: Render complete
    }
```

### Render Pipeline
```mermaid
flowchart LR
    subgraph Input
        RAW[Raw KOSIS Data]
        OPTS[Options<br/>sex, age, item]
        GEO[GeoJSON + Centers]
    end

    subgraph Processing
        BF[buildFlows]
        BN[buildNet]
    end

    subgraph Output
        FLOWS[Flow Objects<br/>from, to, value, label]
        NET[Net Values<br/>code → value Map]
    end

    subgraph Rendering
        DBM[drawBaseMap<br/>region fills]
        DF[drawFlows<br/>flow lines + gradients]
        UL[updateTopList<br/>sidebar]
        SL[syncLabels<br/>stats]
    end

    RAW --> BF
    RAW --> BN
    OPTS --> BF
    OPTS --> BN
    GEO --> BF
    GEO --> BN

    BF --> FLOWS
    BN --> NET

    FLOWS --> DF
    FLOWS --> UL
    NET --> DBM
    FLOWS --> SL
```

## Project Structure
- `index.html`, `styles.css`, `app.js` — main web app.
- `assets/geo/` — GeoJSON boundaries and office center coordinates.
- `geo/` — mapping utilities and styling helpers.
- `data/` — local KOSIS downloads and merged output (gitignored).
- `tests/` — Node-based tests (`*.test.js`).

## Development
### Run locally
- `python3 -m http.server 8000`

### Tests
- `node tests/layout.test.js` (or any file in `tests/`)

## Data Notes
- GeoJSON: `assets/geo/korea_sido.geojson`
- Office centers: `assets/geo/sido_office_centers.json`
- Yearly downloads: `data/kosis_yearly/`
- Hosted data: upload `kosis_all.json.gz` to a separate public data repo (e.g.,
  `Dobuzi/demographics-data`) and keep `window.KOSIS_DATA_BASE_URL` pointing to
  `https://raw.githubusercontent.com/<owner>/<repo>/main`.

## Roadmap
1. Verify hover interactions and line/tooltips across datasets.
2. Validate data loader against yearly and merged datasets.

## License
MIT License. See `LICENSE`.

# Development Guidelines

## Test-First Policy
- When code changes are required, write or update tests first.
- Modify implementation only after tests are in place.
- Run the relevant test suite after every change and confirm it passes.
