# EWS-DDoSNet

A modern web application for network security monitoring and analysis, built with React, Flask, and Tailwind CSS.

## Features

- Landing page with modern UI
- Dashboard with detection and prevention options
- CSV file upload and analysis
- Live network traffic capture
- Data visualization using Chart.js
- Interactive tables using AG Grid

## Prerequisites

- Node.js (v14 or higher)
- Python (v3.8 or higher)
- pip (Python package manager)

## Setup

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

### Backend Setup

1. Create a virtual environment (optional but recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Start the Flask server:
```bash
cd backend
python app.py
```

## Project Structure

```
.
├── src/
│   ├── components/
│   │   └── Navbar.jsx
│   ├── pages/
│   │   ├── LandingPage.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Prevention.jsx
│   │   ├── CSVUpload.jsx
│   │   └── LiveCapture.jsx
│   └── App.jsx
├── backend/
│   └── app.py
├── package.json
├── requirements.txt
└── README.md
```

## Usage

1. Access the application at `http://localhost:5173`
2. The landing page will show the main dashboard
3. Navigate through the different sections using the navigation bar
4. For CSV analysis:
   - Click on "Prevention"
   - Select "Upload CSV"
   - Upload a CSV file with network traffic data
   - View the analysis results
5. For live traffic capture:
   - Click on "Prevention"
   - Select "Live Traffic Capture"
   - Enter the capture duration
   - Click "Start Capture"

## Note

The live traffic capture feature requires administrative privileges to capture network packets. Make sure to run the Flask server with appropriate permissions. 