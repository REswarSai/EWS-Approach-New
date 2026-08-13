Now I have a thorough understanding. Here's a complete detailed explanation of how the
  project works:
     
  ---
  Complete Working of EWS-DDoSNet

  System Architecture

  ┌──────────────────────────────────────────────────────────┐
  │                    User's Browser                        │
  │  ┌─────────────────────┐   ┌─────────────────────────┐  │
  │  │   React Frontend     │   │   API Calls (axios)     │  │
  │  │  (Vite dev server    │◄──┤   http://127.0.0.1:5000  │  │
  │  │   port 5173)         │   │   /api/* routes         │  │
  │  └─────────────────────┘   └─────────────────────────┘  │
  └────────────────────│──────────────│─────────────────────┘
                       │ Vite Proxy  │ /api/* → localhost:5000
                       ▼
  ┌──────────────────────────────────────────────────────────┐
  │                    Flask Backend (port 5000)            │
  │                   backend/app.py (~2500 lines)           │
  │                                                          │
  │  ┌──────────────┐  ┌─────────────┐  ┌───────────────┐   │
  │  │   API Routes  │  │  ML Models  │  │  Scapy Sniffer│   │
  │  │  /api/*       │  │  .h5/.pkl   │  │  packet_capture│   │
  │  └──────────────┘  └─────────────┘  └───────────────┘   │
  │                                                          │
  │  └──────────────┬───────────┬────────────┬─────────────┘ │
  │                 │           │            │               │
  │           data│      models│      plots  │               │
  │                 ▼           ▼            ▼               │
  │  ┌─────────────────────────────────────────────────────┐ │
  │  │   cleaned_output/          backend/models/          │ │
  │  │   - generated PNGs         - gradient_boosting_model │ │
  │  │   - stats CSVs             - imputer.pkl            │ │
  │  │   - flow_statistics.csv    - scaler.pkl             │ │
  │  │                            - kurtosis_thresholds    │ │
  │  │                            - skewness_thresholds    │ │
  │  └─────────────────────────────────────────────────────┘ │
  └──────────────────────────────────────────────────────────┘

  ---
  Step 1: Project Setup & Development

  Starting the system (two servers):

  1. Backend (Flask API server):
  cd backend
  pip install -r requirements.txt
  python app.py
    - Flask starts on port 5000
    - On startup: loads 5 pre-trained models from backend/models/, creates
  cleaned_output/ directory, prints model load status
    - Automatically opens browser to http://127.0.0.1:5000/
  2. Frontend (React dev server):
  cd frontend
  npm install
  npm run dev
    - Vite starts on port 5173
    - /api/* requests are proxied to the Flask backend

  Key dependencies:

  - Backend: Flask, pandas, numpy, scikit-learn, scipy, matplotlib, seaborn, h5py,
  joblib, scapy, APScheduler
  - Frontend: React 18, Vite, Tailwind CSS, Chart.js, react-plotly.js, AG Grid,
  react-router-dom, axios, howler (audio), heroicons, react-icons

  ---
  Step 2: User Journey — Landing to Prevention

  Flow 1: Landing Page (/)

  - Renders LandingPage.jsx
  - Full-screen cyber-themed hero with animated gradient background
  - Features a large CTA button: "Prevention"
  - No navbar — clean, focused entry point

  Flow 2: Prevention Selection (/prevention)

  - Renders Prevention.jsx
  - Shows two large interactive cards:
    a. "Dataset Upload" → navigates to /flow-analysis (CSV file analysis)
    b. "Real-time Monitoring" → navigates to /live-capture (live packet capture)

  ---
  Step 3: CSV Upload & Analysis Workflow

  Step 3a: Frontend — CSVUpload page (/flow-analysis)

  The CSVUpload.jsx component:
  1. Shows a drag-and-drop file selector (accepts .csv files)
  2. On file selection, reads the CSV client-side using FileReader
  3. Parses CSV manually (split by newlines, then commas)
  4. On clicking "Analyze Data":
    - Parses rows into objects with headers as keys
    - Displays the data in an AG Grid table (sortable, filterable, paginated)
    - Renders a Chart.js line chart showing "Traffic Patterns" (packet_size over time)
    - Shows summary stats: total packets, avg packet size, time range

  Note: This frontend component does not upload the file to the backend — it parses and
  visualizes client-side only. This is a separate, simpler analysis path.

  Step 3b: Detailed EWS Analysis — DetectionCSVUpload

  (Same pattern as above — I'd need to check DetectionCSVUpload.jsx for the full path,
  but based on the architecture, it likely calls /api/upload)

  The full EWS pipeline is triggered when a CSV is uploaded to the backend API:

  1. User uploads CSV via frontend (POST to /api/upload with FormData containing file
  and chunk_size)

  ---
  Step 4: Backend EWS Pipeline (the core)

  When backend/app.py receives a CSV at /api/upload, it runs the complete 7-step Early
  Warning System pipeline:

  Step 4a: Extract Required Columns

  - From the uploaded CSV, extracts only: Timestamp, Flow Packets/s, Label
  - Validates these columns exist (returns 400 error if missing)

  Step 4b: Clean Data (in chunks)

  - clean_dataframe_in_chunks(df, chunk_size):
    - Processes the data in user-specified chunk sizes
    - For each chunk: replaces inf/-inf with NaN, then drops rows with any NaN
    - Concatenates cleaned chunks back together
    - This handles large CSVs without loading everything into memory at once

  Step 4c: Sort by Timestamp

  - sort_by_timestamp(df):
    - Converts Timestamp column to datetime (via pd.to_datetime with error handling)
    - Drops rows where timestamp conversion failed
    - Sorts ascending by timestamp, resets index

  Step 4d: Group by Timestamp & Assign Seconds

  - group_by_timestamp_and_assign_seconds_df(input_df):
    - Standardizes timestamp format (handles %Y-%m-%d %H:%M:%S.%f or %M:%S.%f)
    - Groups rows by Timestamp:
        - Sums Flow Packets/s per group
      - Resolves Label via majority vote (resolve_label function — picks mode, breaks
  ties alphabetically)
    - Assigns a sequential Seconds column (1, 2, 3, ...) representing elapsed time

  Step 4e: Flow Transformation (differential equations)

  - process_flow_df(df, alpha=0.5, beta=0.1, p0=1):
    - Computes the flow function: T(t) = (α/β) × (Flow Packets/s - p0 × e^(-β×Seconds))
    - This is a differential model of network flow that smooths traffic into a
  continuous-time representation
    - Computes first derivative: dT/dt = np.gradient(T(t), Seconds)
    - Computes second derivative: d²T/dt² = np.gradient(dT/dt, Seconds)
    - These derivatives are key signals for anomaly detection — attacks cause sharp
  changes in these curves

  Step 4f: Compute Statistics & Early Warning Signals

  - compute_statistics_with_warning(df, window_size=100, kurtosis_thresholds,
  skewness_thresholds, features):
    - For each of 4 features (Flow Packets/s, T(t), dT/dt, d²T/dt²):
        - Computes rolling kurtosis (window=100, Fisher's definition, bias-corrected)
      - Computes rolling skewness (window=100, bias-corrected)
      - Compares against pre-loaded thresholds:
            - kurtosis_thresholds[key] — if the feature's kurtosis exceeds this, it's
  suspicious
        - skewness_thresholds[key] — same for skewness
        - If no threshold exists for a feature, falls back to mean + std of the rolling
  values
      - Computes alert levels (0=none, 1=low, 2=medium, 3=high) based on how far
  kurtosis/skewness deviate from thresholds:
  combined = max(kurtosis_deviation / std_kurt, skewness_deviation / std_skew)
  if combined > 2: level=3 (high)
  elif combined > 1: level=2 (medium)
  elif combined > 0: level=1 (low)
      - Adds alert_level_<feature> columns to the DataFrame
    - Computes a combined alert_level column (maximum across all features)
    - Identifies warning indices (alert_level > 0)
    - Identifies first attack index (where Label ≠ mode/benign)
    - Computes "time before attack" = first_attack_index - first_warning_index

  Step 4g: ML Model Prediction

  - The pre-loaded gradient_model (GradientBoostingClassifier) predicts on a 10-feature
  set:
    - Features: T(t), Label, alert_level, alert_level_dT/dt, alert_level_Flow Packets/s,
  Flow Packets/s, d²T/dt², alert_level_T(t), dT/dt, alert_level_d²T/dt²
    - Preprocessing: imputer.transform() then scaler.transform() (fit, not just
  transform — note: this refits on each request)
  - If the model fails to load, falls back to zero predictions

  Step 4h: Generate Plots (11+ visualizations)

  All plots are saved as PNGs to cleaned_output/ using matplotlib (Agg backend):

  1. plot_benign_attack — Benign (green) vs Attack (red) traffic, smoothed with
  interpolation
  2. plot_test_peak_region — Marks attack start and peak with vertical lines
  3. plot_T_t — T(t) transformation over time
  4. plot_dT_dt — First derivative over time (smoothed with moving average)
  5. plot_d2T_dt2 — Second derivative over time (double-smoothed)
  6. plot_early_warnings — Traffic flow with early warning points highlighted in red
  7. plot_alert_levels_separately — 4 separate plots (none/low/medium/high alert levels)
  8. plot_kurtosis_with_ews — Kurtosis values with EWS markers and attack start/stop
  lines
  9. plot_stat_with_ews × 3 — Kurtosis, skewness, and flow rate plots each with EWS
  1/2/3 markers, peak, attack start/stop, and annotations
  10. generate_emergency_alerts / plot_emergency_alerts — Emergency-level alerts, top 3
  high alerts, peak attack point

  Step 4i: Return Response

  The /api/upload endpoint returns a JSON object with:
  - df_level_0/1/2/3 — rows grouped by alert level
  - test_kurtosis_df / test_skewness_df — statistical dataframes
  - test_kurtosis / test_skewness — raw statistical values
  - uploaded_csv, selected_columns, cleaned_df, grouped_df — intermediate dataframes
  - kurtosis_thresholds, skewness_thresholds — the thresholds used
  - transformed_df — the flow-transformed data (T(t), dT/dt, d²T/dt²)
  - data — the full processed dataframe
  - warning_indices — anomaly warning indices
  - alert_counts — Source IP alert distribution

  Step 4j: CSV Exports

  The backend also writes intermediate DataFrames to CSV for debugging:
  - df_cleaned.csv, df_sorted_timestamp.csv, df_grouped_by_timestamp.csv
  - df_flow_transformed.csv, df_test.csv, merged_df.csv, alert_counts.csv
  - sourceip_df.csv, cleaned_sourceip_df.csv, sorted_sourceip_df.csv
  - Alert-level-specific CSVs (df_test_alert_level_0/1/2/3.csv)

  ---
  Step 5: Live Traffic Capture Workflow

  Step 5a: Frontend — LiveCapture page (/live-capture)

  LiveCapture.jsx is the most complex component:

  1. Two modes:
    - Single capture: User enters seconds, clicks "Capture" → POST to /api/capture →
  scapy sniffs packets → returns flow data
    - Continuous monitoring: "Start Continuous Monitoring" → POST to
  /api/continuous-capture/start
  2. AG Grid table: Displays captured flow data with 23 columns (Source IP, Destination
  IP, ports, flags, packet sizes, flow bytes, PPS, etc.)
  3. Visualization section (when data is available):
    - FlowChartWithWarnings — animated line chart with early warning markers, sound
  alerts via Howler
    - Emergency — emergency alert plot (React + Plotly)
    - AnimatedBenignAttackPlot — benign vs attack animated chart
    - TestPeakRegionPlot — peak region analysis
    - Test_T_t, Test_dT_dt, Test_d2T_dt2 — derivative plots
    - KurtosisPlot, SkewnessPlot — statistical distribution plots
    - HighLevelGraph — alert level graphs
  4. ContinuousCapture sub-component:
    - Start/Stop buttons with loading spinners
    - Polls /api/continuous-capture/status every 1 second
    - Displays live images from /api/images/live_*.png with cache-busting timestamps
    - Shows monitoring status (running/inactive, last update, emergency alerts count)

  Step 5b: Backend — Packet Capture

  /api/capture (single capture):
  1. Clears the flow_statistics.csv file
  2. Resets all capture counters
  3. Calls sniff(prn=packet_callback, store=0, timeout=seconds) — this is blocking and
  requires admin/root
  4. packet_callback(packet) extracts features from each packet:
    - Source/Destination IP and port
    - TCP flags (URG, CWE, PSH, RST)
    - Packet length, flow bytes, PPS (packets per second)
    - Down/Up ratio, inbound count, BWD IAT
    - Average packet size, segment sizes
  5. Returns captured flow data as JSON

  /api/continuous-capture/start (continuous mode):
  1. Stops any existing capture thread
  2. Clears old output images and flow_statistics.csv
  3. Starts a daemon thread running continuous_capture_worker():
  while not capture_stop_event.is_set():
      sniff(prn=packet_callback, store=0, timeout=1)  # Capture for 1 second
      process_captured_data_internal()  # Process and generate plots
      cleanup_memory()  # Free matplotlib figures, run gc
  4. The process_captured_data_internal() function runs the full EWS pipeline (same as
  /api/upload but on live-captured data)
  5. Writes live_capture_status.json to cleaned_output/ with:
    - last_update timestamp
    - data_points count
    - emergency_alerts count
    - warning_indices list
    - attack_detected boolean

  /api/continuous-capture/status:
  - Returns whether capture thread is alive
  - Reads live_capture_status.json
  - Returns image URLs for all generated plots
  - Falls back to test-set plot images if live images don't exist

  /api/continuous-capture/stop:
  - Sets the capture_stop_event to signal the worker thread to stop
  - Joins the thread (waits up to 3 seconds)

  Step 5c: Live Processing Pipeline

  The process_captured_data_internal() function runs the same EWS pipeline on live data
  but:
  - Reads from flow_statistics.csv instead of an uploaded file
  - Runs every 1-second capture cycle
  - Generates live-named plot files (live_benign_attack.png, live_t_t.png,
  live_dt_dt.png, live_d2t_dt2.png, live_early_warnings.png, live_emergency_alerts.png)
  - Uses the same kurtosis/skewness thresholds, model, and scaler
  - Saves alert-level CSVs with "Live" dataset name

  ---
  Step 6: Frontend Visualization Layer

  Chart.js Visualizations (in LiveCapture.jsx after processing):

  - FlowChartWithWarnings: Animated line chart that draws the traffic flow
  second-by-second, with vertical lines at warning indices and beep sound alerts (Howler
  audio at first warnings)
  - AnimatedBenignAttackPlot: Animated scatter/line chart distinguishing benign (green)
  vs attack (red) traffic

  Plotly Visualizations:

  - EmergencyAlertsPlot: Full-spectrum plotly chart with traffic flow line, class
  scatter, emergency alert stars, and first-alert crosshairs, on a dark background
  matching the app theme

  Image-Based Visualizations:

  - During continuous monitoring, images are generated server-side and served via
  /api/images/<filename>
  - The frontend polls the status endpoint and refreshes image URLs with ?t=timestamp
  cache-busting
  - Images displayed with loading spinners and error fallbacks (if an image fails to
  load, shows an error message)

  AG Grid Data Table:

  - Sortable, filterable, paginated table with 25+ columns
  - Dark theme with custom CSS variables
  - Shows all captured flow statistics

  ---
  Step 7: The ML Model Pipeline

  Model Loading (load_sklearn_model_h5):

  - Loads the GradientBoostingClassifier from .h5 file using h5py
  - The H5 file contains a binary-pickled sklearn model in sklearn_model dataset
  - Falls back through .pkl, .joblib, .sav formats if H5 fails
  - If all loading fails, attempts to run fix_model.py or check_models.py (though these
  don't exist in the repo)
  - Verifies model is fitted by running a dummy predict call

  Feature Engineering (10 features):

  feature_cols = [
      'T(t)',
      'Label',                    # encoded: BENIGN=1, ATTACK=0
      'alert_level',              # combined 0-3
      'alert_level_dT/dt',        # per-feature alert
      'alert_level_Flow Packets/s',
      'Flow Packets/s',           # raw value
      'd²T/dt²',
      'alert_level_T(t)',
      'dT/dt',
      'alert_level_d²T/dt²'
  ]
  - imputer.fit_transform() — fills NaN with the column mean (or configured strategy)
  - scaler.fit_transform() — standardizes to 0 mean, 1 std (refit on each request)

  Threshold-Based Early Warning:

  - Pre-computed kurtosis and skewness thresholds are loaded from .pkl files
  - For new data, rolling kurtosis/skewness is computed over a 100-window
  - Alert levels are assigned based on deviation from thresholds
  - The key insight: statistical anomalies (unusual kurtosis/skewness) appear BEFORE the
  actual attack, creating the "early warning" that gives EWS-DDoSNet its name

  ---
  Step 8: Alert Level System

  The system uses a 4-tier alert system:

  ┌───────┬────────┬──────────────────────────────────────────┬────────┐
  │ Level │  Name  │               Description                │ Color  │
  ├───────┼────────┼──────────────────────────────────────────┼────────┤
  │ 0     │ None   │ Normal traffic, no anomaly detected      │ Gray   │
  ├───────┼────────┼──────────────────────────────────────────┼────────┤
  │ 1     │ Low    │ Mild deviation in kurtosis/skewness      │ Yellow │
  ├───────┼────────┼──────────────────────────────────────────┼────────┤
  │ 2     │ Medium │ Moderate deviation, warrants attention   │ Orange │
  ├───────┼────────┼──────────────────────────────────────────┼────────┤
  │ 3     │ High   │ Strong deviation, likely attack imminent │ Red    │
  └───────┴────────┴──────────────────────────────────────────┴────────┘

  The combined alert level per row is the maximum across all 4 features. This is stored
  in df['alert_level'].

  Emergency alerts are generated when alert_level == 3. The generate_emergency_alerts
  function:
  1. Identifies all high-level alerts
  2. Takes the first 3 as priority alerts (with timestamps and time-to-peak)
  3. Marks the remaining as general emergency alerts
  4. Identifies the peak attack (maximum Flow Packets/s)
  5. Prints a summary table and generates a plot marking all these events

  ---
  Key Technical Details

  Data Model (CSV input format):

  The system expects CSV files with at minimum these columns:
  - Timestamp — timestamp of the flow record
  - Flow Packets/s — packet rate (primary signal)
  - Label — either BENIGN or ATTACK (for analysis/grading)
  - Source IP — needed for source IP stats

  Threading Model:

  - Main thread: Flask app handles HTTP requests
  - Background daemon thread: Continuous capture loop (sniff → process → generate plots
  → cleanup)
  - Uses threading.Event (capture_stop_event) for clean shutdown signaling
  - The capture thread is marked as daemon=True so it doesn't block app shutdown

  Memory Management:

  - After each continuous capture cycle, cleanup_memory() is called:
    - plt.close('all') — closes all matplotlib figures
    - gc.collect() — forces garbage collection
  - Intermediate DataFrames are converted to dicts for JSON responses
  - Large intermediate CSV files are written to disk during /api/upload processing

  Production Build:

  The Flask app can serve the built React frontend. When using PyInstaller (frozen):
  - It looks for frontend_detection/dist/ as the static folder
  - When running as a normal script, looks for ../frontend_detection/dist/
  - Serves index.html for all routes (/, /prevention, /flow-analysis, /live-capture)

  LiveCapture Component Architecture:

  LiveCapture.jsx (main page)
  ├── ContinuousCapture.jsx (start/stop + status + live image display)
  ├── FlowChartWithWarnings.jsx (animated Chart.js flow chart)
  ├── EmergencyAlertsPlot.jsx (Plotly emergency alerts)
  ├── AnimatedBenignAttackPlot.jsx (animated benign/attack chart)
  ├── TestPeakRegionPlot.jsx (peak analysis)
  ├── Test_T_t.jsx / Test_dT_dt.jsx / Test_d2T_dt2.jsx (derivative plots)
  ├── KurtosisPlot.jsx / SkewnessPlot.jsx (statistical distribution plots)
  └── HighLevelGraph.jsx (alert level graphs)

  ---
  Complete User Workflow Summary

  1. Start both servers (backend Flask on :5000, frontend Vite on :5173)
  2. Open http://localhost:5173 — loads the LandingPage
  3. Click "Prevention" — shows CSV upload vs Live capture
  4. Option A — CSV Analysis:
    - Click "Dataset Upload" → go to /flow-analysis → upload CSV → parse + chart
  client-side
    - The full EWS pipeline runs server-side via /api/upload → returns processed data +
  11+ plot images → all served via /api/images/
  5. Option B — Live Capture:
    - Click "Real-time Monitoring" → go to /live-capture
    - Set capture duration → click "Capture" → scapy captures packets → backend

  ---
  Complete User Workflow Summary

  1. Start both servers (backend Flask on :5000, frontend Vite on :5173)
  2. Open http://localhost:5173 — loads the LandingPage
  3. Click "Prevention" — shows CSV upload vs Live capture
  4. Option A — CSV Analysis:
    - Click "Dataset Upload" → go to /flow-analysis → upload CSV → parse + chart client-side
    - The full EWS pipeline runs server-side via /api/upload → returns processed data + 11+ plot images → all served via /api/images/
  5. Option B — Live Capture:
    - Click "Real-time Monitoring" → go to /live-capture
    - Set capture duration → click "Capture" → scapy captures packets → backend processes → renders AG Grid + animated charts
    - For continuous monitoring: click "Start Continuous Monitoring" → background thread captures 1-second intervals → runs full EWS pipeline each cycle → frontend polls status every
  second → refreshes 9+ live plot images → shows real-time charts with sound alerts
  6. Stop monitoring → click "Stop Monitoring" → thread stops cleanly → final status check

  This is essentially a real-time DDoS detection system that uses statistical early warning signals (kurtosis and skewness deviations in network flow derivatives) combined with a gradient
  boosting classifier, presented through a polished dark-themed dashboard with 11+ types of visualizations.

✻ Sautéed for 1m 55s