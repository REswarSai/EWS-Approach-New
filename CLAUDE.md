# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**EWS-DDoSNet** is a network security dashboard for Early Warning System (EWS) based DDoS attack detection. It combines a Flask backend (Python) that performs packet capture, statistical analysis, and machine learning-based threat detection with a React frontend that visualizes the results in real time.

The application has two main parts:
- **Backend** (`backend/`): Flask API server on port 5000 — handles CSV upload, live packet capture, data processing, ML inference, and plot generation
- **Frontend** (`frontend/`): React 18 + Vite dev server on port 5173 — provides the UI, visualizations, and AG Grid data tables

## Running the Application

### Backend (Flask API + static file server)

```bash
cd backend
pip install -r requirements.txt
python app.py
```

The Flask app serves both the API (`/api/*`) and the pre-built React frontend. In development, the frontend is served separately via Vite (see below). When bundled (e.g., with PyInstaller), the app looks for the built frontend in `frontend_detection/dist`.

### Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api/*` requests to `http://localhost:5000`. In production, build with `npm run build` to output static files to `frontend/dist`.

### Full Development Workflow

Both servers must be running simultaneously:
1. Start the backend: `cd backend && python app.py`
2. Start the frontend: `cd frontend && npm run dev`
3. Open `http://localhost:5173` in the browser (Vite proxy forwards API calls to Flask)

### Frontend Commands

```bash
npm run dev        # Start Vite dev server (port 5173)
npm run build      # Build for production (outputs to dist/)
npm run preview    # Preview production build locally
npm run lint       # Run ESLint
```

### Backend Dependencies

Key Python packages (from `backend/requirements.txt`):
- `Flask` / `flask-cors` — web framework and CORS
- `pandas` / `numpy` / `scipy` — data processing and statistics
- `scikit-learn` — machine learning (GradientBoostingClassifier, StandardScaler, SimpleImputer)
- `h5py` / `joblib` — model loading
- `scapy` — live packet capture
- `matplotlib` / `seaborn` — plot generation
- `APScheduler` — background scheduling

## Architecture

### Backend (`backend/app.py`)

The Flask app is a single-file application (`backend/app.py`, ~2500 lines) that contains:

**ML Model Loading** — At startup, loads pre-trained models from `backend/models/`:
- `gradient_boosting_model.h5` — primary ML classifier (loaded via a custom `load_sklearn_model_h5` function that tries `.h5`, `.pkl`, `.joblib` fallback formats)
- `imputer.pkl` — sklearn `SimpleImputer` for filling missing values
- `scaler.pkl` — sklearn `StandardScaler` for feature scaling
- `kurtosis_thresholds.pkl` / `skewness_thresholds.pkl` — statistical anomaly thresholds

**API Routes** — All under `/api/*`:
- `GET /api` — health/welcome route
- `POST /api/upload` — Upload a CSV file (network flow data), run the full EWS pipeline (clean → sort → group → transform → statistics → ML → plots), return JSON with data and alert level groupings
- `POST /api/capture` — Capture live packets for N seconds using scapy, return flow data
- `POST /api/process-captured-data` — Process previously captured CSV data through the analysis pipeline
- `GET/POST /api/continuous-capture/start` — Start continuous background packet capture (runs in a daemon thread, 1-second intervals)
- `GET/POST /api/continuous-capture/stop` — Stop the continuous capture thread
- `GET /api/continuous-capture/status` — Check capture status, returns running state, last update time, data point count, and image URLs
- `GET /api/images/<filename>` — Serve generated plot images from the `cleaned_output/` directory
- `POST /api/debug-upload` — Debug endpoint for uploading CSV with basic validation and visualization

**EWS Data Pipeline** (the core processing logic):
1. **Clean** — `clean_dataframe` / `clean_dataframe_in_chunks` replace inf/NaN values
2. **Sort** — `sort_by_timestamp` sorts by Timestamp column
3. **Group** — `group_by_timestamp_and_assign_seconds_df` groups rows by Timestamp, assigns a Seconds counter, and resolves labels via majority vote
4. **Flow Transform** — `process_flow_df` computes the differential model: `T(t)`, `dT/dt` (first derivative), and `d²T/dt²` (second derivative) from Flow Packets/s
5. **Statistics** — `compute_statistics_with_warning` computes rolling window (size 100) kurtosis and skewness for 4 features (`Flow Packets/s`, `T(t)`, `dT/dt`, `d²T/dt²`), compares against thresholds, and assigns alert levels (0=none, 1=low, 2=medium, 3=high)
6. **ML Prediction** — The gradient boosting model predicts on the scaled feature columns
7. **Plotting** — Multiple plot functions generate PNG visualizations (benign vs attack, early warnings, emergency alerts, kurtosis, skewness, derivatives) saved to `cleaned_output/`

**Live Packet Capture** — scapy-based capture (`sniff` with `packet_callback`) extracts flow-level features (flag counts, packet lengths, bytes, PPS, Down/Up ratio, etc.) and writes to `flow_statistics.csv`. The continuous capture worker runs on a background thread.

**Frontend Serving** — The Flask app serves the React build from the `frontend_detection/dist` directory (or the bundled executable path). Routes `/`, `/prevention`, `/flow-analysis`, `/live-capture` (and others) all fall through to `index.html`.

### Frontend (`frontend/src/`)

**Routing** (`src/App.jsx`) — Uses React Router v6 `BrowserRouter`:
- `/` — LandingPage (full-screen hero, no navbar)
- `/prevention` — Prevention (two cards: CSV Upload → `/flow-analysis`, Live Capture → `/live-capture`)
- `/dashboard` — Dashboard (links to Detection and Prevention)
- `/flow-analysis` — CSVUpload (client-side CSV parsing with Chart.js line chart + AG Grid table)
- `/live-capture` — LiveCapture (full-featured page: capture/start/stop, continuous capture, AG Grid table, and 10+ Chart.js/Plotly visualization components)
- `/detection`, `/detection-upload-csv`, `/detection-live-traffic` — Detection routes
- `/source-ip-stats`, `/start-stop`, `/example-chart-page` — Additional pages

**Components** (`src/components/`) — Reusable visualization and UI components:
- `Navbar.jsx` — Top navigation bar (appears on all routes except LandingPage)
- `Button.jsx` — Shared button component
- `ContinuousCapture.jsx` — Start/stop controls for continuous packet capture
- `FlowChartWithWarnings.jsx` / `FlowChartWithWarningsNew.jsx` — Traffic flow charts with early warning overlays
- `AnimatedBenignAttackPlot.jsx` / `AnimatedChart.jsx` — Animated Chart.js visualizations
- `BenignAttackPlot.jsx` — Benign vs attack scatter plot
- `TestPeakRegionPlot.jsx` — Peak region analysis around the attack
- `Test_T_t.jsx`, `Test_dT_dt.jsx`, `Test_d2T_dt2.jsx` — Derivative plots
- `Emergency.jsx` — Emergency alert visualization
- `EmergencyAlertsPlot.jsx` — Emergency alerts plot
- `HighLevelGraph.jsx` — Alert level graphs
- `KurtosisPlot.jsx` / `SkewnessPlot.jsx` — Statistical distribution plots
- `StartStopComponent.jsx` — Generic start/stop controls
- `ThreeSeperated.jsx` — Layout component

**Styling** — Tailwind CSS with a dark cyber theme (custom color palette in `tailwind.config.js`: `background`, `surface`, `primary` `#00B8D9`, `secondary`, `accent` `#FFAB00`, `danger`, etc.). AG Grid custom styles defined in `src/index.css`.

## API Communication Patterns

The frontend communicates with the backend via axios. All API calls go to `http://127.0.0.1:5000/api/*`:

- CSV upload: `POST /api/upload` with `FormData` (file + chunk_size)
- Live capture: `POST /api/capture` with `{ seconds: N }`
- Continuous capture: `POST /api/continuous-capture/start|stop`
- Status polling: `GET /api/continuous-capture/status` (polled every 1 second in `LiveCapture.jsx`)
- Image serving: `GET /api/images/<filename>` (images refreshed with `?t=timestamp` cache-busting)

The Vite dev server config (`vite.config.js`) proxies `/api` to `http://localhost:5000`, so in development the frontend doesn't need to hardcode the backend URL (though some components reference `http://127.0.0.1:5000` directly).

## Key Data Model

CSV input for analysis must have at minimum these columns: `Timestamp`, `Flow Packets/s`, `Label`. The `Label` column maps `BENIGN` → 1 and `ATTACK` → 0. The required columns and the 10-feature set used for ML prediction are defined in `backend/app.py`.

## Pre-trained Models

Located in `backend/models/`:
- `gradient_boosting_model.h5` — primary GradientBoostingClassifier
- `imputer.pkl` — SimpleImputer for missing value handling
- `scaler.pkl` — StandardScaler for feature normalization
- `kurtosis_thresholds.pkl` / `skewness_thresholds.json` — anomaly detection thresholds
- `skewness_thresholds.pkl` — skewness thresholds
- `binary_mm.h5` / `multi.h5` — additional models (for the 144-feature detection pipeline)

## Development Notes

- The backend uses a thread-based architecture: the continuous capture worker runs on a daemon thread, while the Flask app handles HTTP requests on the main thread.
- Plot generation uses matplotlib with the `Agg` backend (non-interactive).
- The `cleaned_output/` directory stores generated plots and CSV exports — it's created at startup if missing.
- Live capture requires administrative privileges (scapy packet sniffing).
- The frontend's `LiveCapture.jsx` is the most complex component — it manages capture state, polls the status endpoint, and renders multiple visualization sub-components with loading states and error handling.
- ESLint is configured with React, React Hooks, and React Refresh plugins but has no TypeScript support configured.
- There's no test suite in the project — the project relies on manual testing via the browser.