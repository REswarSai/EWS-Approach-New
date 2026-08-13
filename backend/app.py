from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import pandas as pd
import imageio
import webbrowser
import os
import numpy as np
from scapy.all import sniff, TCP, UDP, IP
import time
import statistics
import csv
import matplotlib.pyplot as plt
from sklearn.preprocessing import LabelEncoder
from scipy.stats import kurtosis, skew
from matplotlib.animation import FuncAnimation, FFMpegWriter
import matplotlib   
import h5py
import matplotlib.animation as animation 
import joblib
import io
import warnings
import time
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, ConfusionMatrixDisplay
from joblib import load
import h5py
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.impute import SimpleImputer
warnings.filterwarnings("ignore")
matplotlib.use('Agg')
import pickle
import winsound
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, ConfusionMatrixDisplay
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import joblib, h5py, io, os
from scipy.stats import kurtosis, skew
import warnings
import seaborn as sns
warnings.filterwarnings("ignore")
import json
import traceback
import numpy as np
import pandas as pd
from scipy.stats import kurtosis, skew
from sklearn.preprocessing import LabelEncoder
import os
import json
from apscheduler.schedulers.background import BackgroundScheduler
import threading
from flask import render_template
import sys
from threading import Thread, Event
import gc
from sklearn.preprocessing import MinMaxScaler
import re
from sklearn.linear_model import LogisticRegression  # Add fallback model

def get_base_path():
    if getattr(sys, 'frozen', False):  # If bundled with PyInstaller
        base_path = sys._MEIPASS if hasattr(sys, '_MEIPASS') else os.path.dirname(sys.executable)
        # Look for frontend_detection/dist in the same directory as the executable
        frontend_path = os.path.join(os.path.dirname(sys.executable), "frontend_detection", "dist")
        if os.path.exists(frontend_path):
            return base_path, frontend_path
        # If not found, try one level up
        frontend_path = os.path.join(os.path.dirname(os.path.dirname(sys.executable)), "frontend_detection", "dist")
        if os.path.exists(frontend_path):
            return base_path, frontend_path
        # If still not found, try in the MEIPASS directory
        frontend_path = os.path.join(base_path, "frontend_detection", "dist")
        return base_path, frontend_path
    else:  # If running as a normal Python script
        base_path = os.path.dirname(os.path.abspath(__file__))
        frontend_path = os.path.join(os.path.dirname(base_path), "frontend_detection", "dist")
        return base_path, frontend_path

base_path, frontend_dist = get_base_path()

print("Serving frontend from:", frontend_dist)
print("Frontend directory exists:", os.path.exists(frontend_dist))
if os.path.exists(frontend_dist):
    print("Frontend files:", os.listdir(frontend_dist))

app = Flask(__name__, static_folder=frontend_dist, static_url_path='')
CORS(app, resources={r"/api/*": {"origins": "*"}})  # Enable CORS for all /api routes

# Enable CORS for all routes

# Add route to serve the frontend
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    try:
        if path != "" and os.path.exists(os.path.join(frontend_dist, path)):
            return send_from_directory(frontend_dist, path)
        else:
            # Check if index.html exists
            index_path = os.path.join(frontend_dist, 'index.html')
            if os.path.exists(index_path):
                return send_from_directory(frontend_dist, 'index.html')
            else:
                return jsonify({'error': 'Frontend files not found'}), 404
    except Exception as e:
        print(f"Error serving frontend: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500

#1. Clean the data
#2. Divide into chunks
#3. sort the chunks by timestamp
#4. convert the timestamp to seconds
#5. solve the differential equation
#6. EWS detection and classification

#upload the data
# Globals
new_capture_data = ""

# CSV file for packet capture
csv_file = os.path.join(base_path, 'flow_statistics.csv')

# Setup output directory
output_dir = os.path.join(base_path, 'cleaned_output')
os.makedirs(output_dir, exist_ok=True)

# model is loaded from the models folder
def load_sklearn_model_h5(filename):
    import h5py
    import io
    import joblib
    from sklearn.ensemble import GradientBoostingClassifier
    from sklearn.linear_model import LogisticRegression  # Add fallback model

    # Try multiple model formats if the primary one fails
    fallback_formats = [
        filename,  # Original h5 format
        filename.replace('.h5', '.pkl'),     # Pickle format
        filename.replace('.h5', '.joblib'),  # Joblib format
        filename.replace('.h5', '.sav')      # Standard model format
    ]

    for model_path in fallback_formats:
        try:
            print(f"Attempting to load model from: {model_path}")

            # Handle different file formats
            if model_path.endswith('.h5'):
                with h5py.File(model_path, 'r') as h5f:
                    binary_data = h5f['sklearn_model'][()]
                    buffer = io.BytesIO(binary_data.tobytes())
                    model = joblib.load(buffer)
            elif model_path.endswith(('.pkl', '.joblib', '.sav')):
                model = joblib.load(model_path)
            else:
                continue  # Skip unsupported formats

            # Verify the model is fitted
            if hasattr(model, 'predict') and hasattr(model, 'fit'):
                try:
                    # Try a simple prediction to check if model is fitted
                    model.predict([[0] * 10])  # Try with dummy data
                    print(f"✅ Model successfully loaded and verified from: {model_path}")
                    return model
                except Exception as e:
                    print(f"⚠️ Model loaded but not fitted: {str(e)}")
                    continue
            else:
                print(f"⚠️ Loaded object is not a valid scikit-learn model")
                continue

        except Exception as e:
            print(f"⚠️ Error loading model from {model_path}: {str(e)}")
            continue  # Try next format

    # If we've tried all formats and failed, create a new model
    print("❌ Failed to load model from any available format. Creating new model...")




# Load models
if getattr(sys, 'frozen', False):
    # Running as executable
    model_path = os.path.join(base_path, 'models', 'gradient_boosting_model.h5')
    imputer_path = os.path.join(base_path, 'models', 'imputer.pkl')
    scaler_path = os.path.join(base_path, 'models', 'scaler.pkl')
    kurtosis_thresholds_path = os.path.join(base_path, 'models', 'kurtosis_thresholds.pkl')
    skewness_thresholds_path = os.path.join(base_path, 'models', 'skewness_thresholds.pkl')
    # binary_mm_path=os.path.join(base_path, 'models','binary_mm.h5')
else:
    # Running as script
    model_path = os.path.join(base_path, 'models', 'gradient_boosting_model.h5')
    imputer_path = os.path.join(base_path, 'models', 'imputer.pkl')
    scaler_path = os.path.join(base_path, 'models', 'scaler.pkl')
    kurtosis_thresholds_path = os.path.join(base_path, 'models', 'kurtosis_thresholds.pkl')
    skewness_thresholds_path = os.path.join(base_path, 'models', 'skewness_thresholds.pkl')
    # binary_mm_path=os.path.join(base_path, 'models','multi.h5')
try:
    gradient_model = load_sklearn_model_h5(model_path)
    imputer = joblib.load(imputer_path)
    scaler = joblib.load(scaler_path)
    kurtosis_thresholds = joblib.load(kurtosis_thresholds_path)
    skewness_thresholds = joblib.load(skewness_thresholds_path)
    # binary_mm=load(binary_mm_path)
    # If gradient model failed to load, try to fix it with our custom script
    if gradient_model is None:
        print("⚠️ Gradient model failed to load. Attempting to repair or recreate it...")
        try:
            # First try our custom fix script
            import subprocess
            result = subprocess.run(['python', os.path.join(base_path, 'fix_model.py')], 
                                    cwd=base_path, 
                                    capture_output=True, 
                                    text=True,
                                    timeout=60)
            print(f"Model repair output: {result.stdout}")
            if result.returncode != 0:
                print(f"Model repair error: {result.stderr}")
                # If that fails, try the check_models script
                result = subprocess.run(['python', os.path.join(base_path, 'check_models.py')], 
                                        cwd=base_path, 
                                        capture_output=True, 
                                        text=True,
                                        timeout=60)
                print(f"Model check output: {result.stdout}")
            
            # Try loading the model again
            gradient_model = load_sklearn_model_h5(model_path)
            print(f"After repair, model is {'loaded successfully' if gradient_model is not None else 'still None'}")
        except Exception as e:
            print(f"Error repairing/regenerating models: {str(e)}")
    
    print("✅ All models loaded successfully")
    print(f"Model paths used:")
    print(f"- Model: {model_path}")
    print(f"- Imputer: {imputer_path}")
    print(f"- Scaler: {scaler_path}")
    print(f"- Kurtosis thresholds: {kurtosis_thresholds_path}")
    print(f"- Skewness thresholds: {skewness_thresholds_path}")
    # print(f"- binary model: {binary_mm_path}")
except Exception as e:
    print(f"⚠️ Error loading models: {str(e)}")
    print(f"Model paths attempted:")
    print(f"- Model: {model_path}")
    print(f"- Imputer: {imputer_path}")
    print(f"- Scaler: {scaler_path}")
    print(f"- Kurtosis thresholds: {kurtosis_thresholds_path}")
    print(f"- Skewness thresholds: {skewness_thresholds_path}")
    # print(f"- binary model: {binary_mm_path}")
    raise e

df_global = pd.DataFrame()
df_sorted_timestamp = pd.DataFrame()
cleaned_df_global = pd.DataFrame()
kurtosis_threshold=None
skewness_threshold=None
first_attack_test_global=None

required_columns = ['Timestamp', 'Flow Packets/s', 'Label']
def clean_dataframe(df):
    """Clean in-memory DataFrame and save to CSV."""
    df = df.replace([np.inf, -np.inf], np.nan).dropna()
    return df
def clean_dataframe_in_chunks(df, chunk_size):
    """
    Clean a DataFrame in chunks:
    - Replaces inf/-inf with NaN
    - Drops rows with NaNs
    - Returns the cleaned DataFrame
    """
    cleaned_chunks = []
    total_rows = len(df)

    for start in range(0, total_rows, chunk_size):
        end = start + chunk_size
        chunk = df.iloc[start:end].copy()
        chunk.replace([np.inf, -np.inf], np.nan, inplace=True)
        chunk.dropna(inplace=True)
        cleaned_chunks.append(chunk)

    cleaned_df = pd.concat(cleaned_chunks, ignore_index=True)
    print(f"✅ Cleaned {len(cleaned_df)} rows out of {total_rows}")
    return cleaned_df

def sort_by_timestamp(df):
    """Sort DataFrame by 'Timestamp' column."""
    if 'Timestamp' not in df.columns:
        raise ValueError("❌ 'Timestamp' column not found.")

    df['Timestamp'] = pd.to_datetime(df['Timestamp'], errors='coerce')
    df = df.dropna(subset=['Timestamp'])
    df = df.sort_values(by='Timestamp', ascending=True).reset_index(drop=True)
    return df

def process_timestamp(ts):
    """Standardize various timestamp formats."""
    try:
        return pd.to_datetime(ts, format="%Y-%m-%d %H:%M:%S.%f").strftime("%Y-%m-%d %H:%M:%S")
    except ValueError:
        try:
            return pd.to_datetime(ts, format="%M:%S.%f").strftime("%M:%S")
        except ValueError:
            return ts

def resolve_label(labels):
    """Return majority label; break ties alphabetically."""
    mode_labels = labels.mode()
    if mode_labels.empty:
        return None
    return sorted(mode_labels)[0] if len(mode_labels) > 1 else mode_labels.iloc[0]

def group_by_timestamp_and_assign_seconds_df(input_df):
    """Group input DataFrame by Timestamp, assign Seconds, and return grouped DataFrame."""
    df = input_df.copy()
    df["Timestamp"] = df["Timestamp"].apply(process_timestamp)

    grouped_df = df.groupby("Timestamp", sort=False).agg({
        "Flow Packets/s": "sum",
        "Label": resolve_label
    }).reset_index()

    grouped_df["Seconds"] = range(1, len(grouped_df) + 1)
    print("✅ Grouping complete. Returning grouped DataFrame.")
    return grouped_df

def process_flow_df(df, alpha=0.5, beta=0.1, p0=1):
    """Applies flow-based transformation logic."""
    df["Seconds"] = pd.to_numeric(df["Seconds"], errors='coerce')
    df["Flow Packets/s"] = pd.to_numeric(df["Flow Packets/s"], errors='coerce')
    df = df.dropna(subset=["Seconds", "Flow Packets/s"]).reset_index(drop=True)

    if df.empty:
        raise ValueError("❌ All rows were dropped during cleanup! Check input data.")

    df["T(t)"] = (alpha / beta) * (df["Flow Packets/s"] - p0 * np.exp(-beta * df["Seconds"]))
    df = df.sort_values("Seconds").reset_index(drop=True)
    df["dT/dt"] = np.gradient(df["T(t)"], df["Seconds"])
    df["d²T/dt²"] = np.gradient(df["dT/dt"], df["Seconds"])
    
    print("✅ Flow transformation complete.")
    return df

def compute_statistics_with_warning(
    df, 
    window_size=100, 
    kurtosis_thresholds=None, 
    skewness_thresholds=None,
    features=['Flow Packets/s', 'T(t)', 'dT/dt', 'd²T/dt²']
):
    # Validate necessary columns
    for col in ['Label'] + features:
        if col not in df.columns:
            raise ValueError(f"Dataset must contain '{col}' column")

    # Create Seconds column if missing
    if 'Seconds' not in df.columns:
        df['Seconds'] = np.arange(len(df))

    # Label encoding
    label_encoder = LabelEncoder()
    df['label'] = label_encoder.fit_transform(df['Label'])
    classes = label_encoder.classes_

    # Store results
    rolling_kurtoses = {}
    rolling_skewnesses = {}
    kurtosis_thresholds_out = {}
    skewness_thresholds_out = {}
    alert_levels_dict = {}

    for feature in features:
        # Rolling stats
        rk = df[feature].rolling(window=window_size).apply(
            lambda x: kurtosis(x, fisher=True, bias=False), raw=True).fillna(0)
        rs = df[feature].rolling(window=window_size).apply(
            lambda x: skew(x, bias=False), raw=True).fillna(0)

        # Thresholds
        if kurtosis_thresholds is None or feature not in kurtosis_thresholds:
            k_mean, k_std = rk.mean(), rk.std()
            kurt_thresh = k_mean + k_std
        else:
            kurt_thresh = kurtosis_thresholds[feature]

        if skewness_thresholds is None or feature not in skewness_thresholds:
            s_mean, s_std = rs.mean(), rs.std()
            skew_thresh = s_mean + s_std
        else:
            skew_thresh = skewness_thresholds[feature]

        # Store stats and thresholds
        rolling_kurtoses[f'{feature}_kurtosis'] = rk
        rolling_skewnesses[f'{feature}_skewness'] = rs
        kurtosis_thresholds_out[f'{feature}_kurtosis'] = kurt_thresh
        skewness_thresholds_out[f'{feature}_skewness'] = skew_thresh

        # Alert levels per feature
        kurt_diff = rk - kurt_thresh
        skew_diff = rs - skew_thresh
        std_kurt = rk.std()
        std_skew = rs.std()

        def alert_level(k, s):
            combined = max(k / std_kurt, s / std_skew)
            if combined > 2:
                return 3
            elif combined > 1:
                return 2
            elif combined > 0:
                return 1
            return 0

        alert_levels = [alert_level(k, s) for k, s in zip(kurt_diff, skew_diff)]
        alert_levels_dict[feature] = alert_levels
        df[f'alert_level_{feature}'] = alert_levels

    # Combine alerts across all features (maximum alert per row)
    df['alert_level'] = df[[f'alert_level_{f}' for f in features]].max(axis=1)
    warning_indices = np.where(df['alert_level'] > 0)[0]

    # Attack and warning info
    majority_label = df['label'].mode()[0]
    attack_indices = np.where(df['label'] != majority_label)[0]
    first_attack_index = attack_indices[0] if len(attack_indices) > 0 else -1
    first_warning_index = warning_indices[0] if len(warning_indices) > 0 else -1
    time_before_attack = (first_attack_index - first_warning_index) if (
        first_warning_index != -1 and first_attack_index != -1) else None

    return (
        df,
        rolling_kurtoses,
        rolling_skewnesses,
        warning_indices,
        first_warning_index,
        first_attack_index,
        time_before_attack,
        kurtosis_thresholds_out,
        skewness_thresholds_out,
        classes
    )

# Print early warning details
def print_warning_details(df, warning_indices, first_attack_index):
    print("\n🔸 Early Warning Signals (Predicted Attacks Only):")
    level_names = {1: "Low", 2: "Medium", 3: "High"}
    
    tag_count = 1

    for i, idx in enumerate(warning_indices, start=1):
        if idx < len(df):
            alert_level = df.loc[idx, 'alert_level']
            if alert_level > 0:
                level = level_names.get(alert_level, "None")
                time_to_attack = first_attack_index - idx if first_attack_index != -1 else None
                tag_label = ['First', 'Second', 'Third'][tag_count - 1] if tag_count <= 3 else f'{tag_count}th'
                print(f"{tag_label} Warning → Seconds: {df.loc[idx, 'Seconds']} | Alert Level: {level} | Time to Attack: {time_to_attack}")
                tag_count += 1

# Plotting functions
def plot_benign_attack(df, dataset_name, save_path=None):
    plt.figure(figsize=(16, 6), dpi=100)  # Wider figure
    plt.clf()
    
    # Ensure we're working with numeric labels
    df = df.copy()
    
    # Check if df['Label'] is numeric already; if not, convert
    if not pd.api.types.is_numeric_dtype(df['Label']):
        print(f"Converting non-numeric labels to numeric. Original labels: {df['Label'].unique()}")
        df['Label'] = df['Label'].map({'BENIGN': 1, 'ATTACK': 0}).fillna(1)
    
    # Filter to make sure we have data
    benign = df[df['Label'] == 1]
    attack = df[df['Label'] != 1]
    
    print(f"Benign samples: {len(benign)}, Attack samples: {len(attack)}")
    
    # Only plot if we have data
    if not benign.empty:
        # Use cubic interpolation for smoother curves
        if len(benign) > 3:  # Need at least 4 points for cubic interpolation
            x = benign['Seconds']
            y = benign['Flow Packets/s']
            
            # Create smoother curve with more points
            if len(x) > 10:
                x_smooth = np.linspace(x.min(), x.max(), 500)
                y_smooth = np.interp(x_smooth, x, y)
                plt.plot(x_smooth, y_smooth, color='green', label='Benign', linewidth=1.5, alpha=0.8)
            else:
                plt.plot(x, y, color='green', label='Benign', linewidth=1.5)
        else:
            plt.plot(benign['Seconds'], benign['Flow Packets/s'], color='green', label='Benign', linewidth=1.5)
    
    if not attack.empty:
        # Use cubic interpolation for smoother curves
        if len(attack) > 3:  # Need at least 4 points for cubic interpolation
            x = attack['Seconds']
            y = attack['Flow Packets/s']
            
            # Create smoother curve with more points
            if len(x) > 10:
                x_smooth = np.linspace(x.min(), x.max(), 500)
                y_smooth = np.interp(x_smooth, x, y)
                plt.plot(x_smooth, y_smooth, color='red', label='Attack', linewidth=1.5, alpha=0.8)
            else:
                plt.plot(x, y, color='red', label='Attack', linewidth=1.5)
        else:
            plt.plot(attack['Seconds'], attack['Flow Packets/s'], color='red', label='Attack', linewidth=1.5)
    
    plt.title(f'{dataset_name} - Benign vs Attack')
    plt.xlabel("Seconds")
    plt.ylabel("Flow Packets/s")
    plt.grid(True, linestyle='--', alpha=0.7)
    plt.legend()
    plt.tight_layout()
    
    # Save the plot with high quality
    if save_path:
        plt.savefig(save_path, bbox_inches='tight', pad_inches=0.1)
    else:
        plt.savefig(os.path.join(output_dir, f"{dataset_name.lower()}_benign_attack.png"), 
                    bbox_inches='tight', pad_inches=0.1)
    
    plt.close()  # Close the figure to free memory

def plot_early_warnings(df, rolling_kurtosis, warning_indices, dataset_name, save_path=None):
    import numpy as np
    import pandas as pd
    import matplotlib.pyplot as plt

    # Ensure the relevant columns are numeric
    df['Seconds'] = pd.to_numeric(df['Seconds'], errors='coerce')
    df['Flow Packets/s'] = pd.to_numeric(df['Flow Packets/s'], errors='coerce')
    df['Label'] = pd.to_numeric(df['Label'], errors='coerce')

    # Drop rows with NaN values in any of the key plotting columns
    df = df.dropna(subset=['Seconds', 'Flow Packets/s', 'Label'])

    plt.figure(figsize=(16, 6), dpi=100)  # Wider figure
    plt.clf()

    # If we have enough data points, create a smoother base plot
    if len(df) > 10:
        x = df['Seconds']
        y = df['Flow Packets/s']
        x_smooth = np.linspace(x.min(), x.max(), 500)
        y_smooth = np.interp(x_smooth, x, y)
        plt.plot(x_smooth, y_smooth, color='gray', linewidth=1, alpha=0.6, label="Traffic Flow (Smoothed)")
    else:
        plt.plot(df['Seconds'], df['Flow Packets/s'], color='gray', linewidth=1, label="Traffic Flow")

    scatter = plt.scatter(
        df['Seconds'], df['Flow Packets/s'], 
        c=df['Label'], cmap='tab10', s=10, alpha=0.7, label="Classes"
    )
    plt.colorbar(scatter, ticks=np.unique(df['Label']))

    # Make warning points more visible
    if len(warning_indices) > 0:
        plt.scatter(
            df['Seconds'].iloc[warning_indices[::10]], 
            df['Flow Packets/s'].iloc[warning_indices[::10]],
            color='red', s=50, alpha=0.7, label='Early Warning (1 per 10)', 
            zorder=5, edgecolors='black', linewidths=0.5
        )

    plt.title(f'Flow Packets/s vs Seconds with Early Warnings ({dataset_name})')
    plt.xlabel('Seconds')
    plt.ylabel('Flow Packets/s')
    plt.grid(True, linestyle='--', alpha=0.7)
    plt.legend()
    plt.tight_layout()

    if save_path:
        plt.savefig(save_path, bbox_inches='tight', pad_inches=0.1)

    plt.close()  # To avoid memory issues if plotting multiple times

  

def handle_infinite_values(df):
    """Efficiently replace infinite values with NaN and return the cleaned DataFrame."""
    df_cleaned = df.copy()
    
    # Use pandas built-in replace which is much faster than column-by-column
    df_cleaned = df_cleaned.replace([np.inf, -np.inf], np.nan)
    
    # Only print a message if infinite values were actually found
    if df_cleaned.isna().any().any():
        print("⚠ Some infinite values were replaced with NaN")
    
    return df_cleaned


def generate_emergency_alerts(df, attack_column='Flow Packets/s', dataset_name="Dataset", output_dir=output_dir):

    # Find all high alerts (alert_level=3)
    high_alerts = df[df['alert_level'] == 3].copy()

    if high_alerts.empty:
        print("No high-level alerts (alert_level=3) found.")
        return

    # Debugging: Check high alerts data
    print("High alerts data:", high_alerts.head())

    # Get first three high alert points
    top_3_high_alerts = high_alerts.iloc[:3]
    emergency_alerts = high_alerts.iloc[3:]

    # Print Emergency Alerts
    print("\n🚨 Emergency Warnings:")
    for i, row in emergency_alerts.iterrows():
        print(f"{i+1}th Emergency Warning → Seconds: {row['Seconds']}")

    # Identify peak of the attack
    peak_idx = df[attack_column].idxmax()
    peak_seconds = df.loc[peak_idx, 'Seconds']
    peak_value = df.loc[peak_idx, attack_column]

    # Summary Table
    print("\n📊 Summary of First 3 High Alerts and Peak:")
    print("{:<10} {:<15} {:<20}".format("Alert #", "Seconds", "Time Before Peak (s)"))
    for i, row in top_3_high_alerts.iterrows():
        alert_time = row['Seconds']
        time_to_peak = peak_seconds - alert_time
        print(f"{(i+1):<10} {alert_time:<15} {time_to_peak:<20}")

    print(f"\n🔥 Peak Attack at Seconds: {peak_seconds} | Peak Value: {peak_value}")

    # Plotting
    plt.figure(figsize=(14, 6))
    
    # Plot the attack signal (e.g., Flow Packets/s)
    plt.plot(df['Seconds'], df[attack_column], label=f"{attack_column} over Time", color='blue', linewidth=1)

    # Plot the high alerts (EWS 3)
    plt.scatter(top_3_high_alerts['Seconds'], top_3_high_alerts[attack_column], color='green', zorder=5, label="High Alert (EWS 3)", s=100, marker='o')
    plt.scatter(emergency_alerts['Seconds'], emergency_alerts[attack_column], color='red', zorder=5, label="Emergency Alerts", s=100, marker='x')

    # Plot peak
    plt.scatter(peak_seconds, peak_value, color='purple', zorder=6, label="Peak Attack", s=150, marker='*')

    # Labels and Title
    plt.title(f"{dataset_name} - Attack Signal with Alerts and Peak")
    plt.xlabel("Seconds")
    plt.ylabel(attack_column)
    plt.legend()
    plt.grid(True)
    plt.tight_layout()

    # Ensure the output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # Save the plot first
    filename = f"{dataset_name.lower().replace(' ', '_')}_emergency_alerts_plot.png"
    save_path = os.path.join(output_dir, filename)
    
    # Print the save path to debug
    print(f"Saving emergency alerts plot to: {save_path}")

    plt.savefig(save_path)
    print(f"Saved plot to: {save_path}")

def plot_emergency_alerts(df, dataset_name, save_path=None):
    plt.figure(figsize=(16, 6), dpi=100)  # Wider figure
    plt.clf()
    # Create smoothed base plot if we have enough data
    if len(df) > 10:
        x = df['Seconds']
        y = df['Flow Packets/s']
        x_smooth = np.linspace(x.min(), x.max(), 500)
        y_smooth = np.interp(x_smooth, x, y)
        plt.plot(x_smooth, y_smooth, color='gray', linewidth=1, alpha=0.6, label="Traffic Flow")
    else:
        plt.plot(df['Seconds'], df['Flow Packets/s'], color='gray', linewidth=1, label="Traffic Flow")
    
    # Create a clean scatter plot for classes
    scatter = plt.scatter(df['Seconds'], df['Flow Packets/s'], c=df['Label'], 
                         cmap='tab10', s=10, alpha=0.7, label="Classes")
    plt.colorbar(scatter, ticks=np.unique(df['Label']))

    # Remove the emergency alerts disabled message
    
    plt.title(f'Flow Packets/s vs Seconds ({dataset_name})')
    plt.xlabel('Seconds')
    plt.ylabel('Flow Packets/s')
    plt.grid(True, linestyle='--', alpha=0.7)
    plt.legend(loc='best')
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path, bbox_inches='tight', pad_inches=0.1)
    plt.close()  # Close to free memory

def plot_test_peak_region(df, first_attack_index):
    import numpy as np
    import pandas as pd
    import matplotlib.pyplot as plt
    import os

    plt.figure(figsize=(16, 6), dpi=100)  # Wider figure
    plt.clf()

    # Ensure we're working with numeric labels
    df = df.copy()

    # Check if df['Label'] is numeric already; if not, convert
    if not pd.api.types.is_numeric_dtype(df['Label']):
        df['Label'] = df['Label'].map({'BENIGN': 1, 'ATTACK': 0}).fillna(1)

    # Filter to make sure we have data
    benign = df[df['Label'] == 1]
    attack = df[df['Label'] != 1]

    # Only plot if we have data with smoothing for better visualization
    if not benign.empty:
        if len(benign) > 10:
            x = benign['Seconds']
            y = benign['Flow Packets/s']
            x_smooth = np.linspace(x.min(), x.max(), 500)
            y_smooth = np.interp(x_smooth, x, y)
            plt.plot(x_smooth, y_smooth, color='green', linewidth=1.5, alpha=0.8, label='Benign')
        else:
            plt.plot(benign['Seconds'], benign['Flow Packets/s'], color='green', linewidth=1.5, label='Benign')

    if not attack.empty:
        if len(attack) > 10:
            x = attack['Seconds']
            y = attack['Flow Packets/s']
            x_smooth = np.linspace(x.min(), x.max(), 500)
            y_smooth = np.interp(x_smooth, x, y)
            plt.plot(x_smooth, y_smooth, color='red', linewidth=1.5, alpha=0.8, label='Attack')
        else:
            plt.plot(attack['Seconds'], attack['Flow Packets/s'], color='red', linewidth=1.5, label='Attack')

        # Only mark peak if attack data exists
        try:
            peak_idx = attack['Flow Packets/s'].idxmax()
            peak_time = df.loc[peak_idx, 'Seconds']

            # Only mark attack start if first_attack_index is valid
            if first_attack_index is not None and 0 <= first_attack_index < len(df):
                attack_time = df.loc[first_attack_index, 'Seconds']
                plt.axvline(x=attack_time, color='purple', linestyle='--', linewidth=1.5, alpha=0.7, label='Attack Start')

            plt.axvline(x=peak_time, color='orange', linestyle='--', linewidth=1.5, alpha=0.7, label='Peak Point')
            plt.scatter(peak_time, df.loc[peak_idx, 'Flow Packets/s'], color='black', marker='x', s=100, zorder=5)
        except (ValueError, KeyError) as e:
            print(f"Warning: Could not mark peak in attack data: {str(e)}")

    plt.title("Test Data with Peak Region and Attack Start")
    plt.xlabel("Seconds")
    plt.ylabel("Flow Packets/s")
    plt.grid(True, linestyle='--', alpha=0.7)
    plt.legend()
    plt.tight_layout()

    # Ensure output_dir is defined or pass it as an argument
    output_dir = os.getcwd()  # or specify a desired path
    plt.savefig(os.path.join(output_dir, "test_peak_region.png"), bbox_inches='tight', pad_inches=0.1)
    plt.close()  # Close the figure to free memory



# Plot T(t), dT/dt, d²T/dt² with BENIGN in green and ATTACK in red

def plot_T_t(df, name, output_dir):
    plt.figure(figsize=(16, 6), dpi=100)  # Wider figure
    plt.clf()
    
    # Ensure we're working with numeric labels
    df = df.copy()
    
    # Check if df['Label'] is numeric already; if not, convert
    if not pd.api.types.is_numeric_dtype(df['Label']):
        df['Label'] = df['Label'].map({'BENIGN': 1, 'ATTACK': 0}).fillna(1)
    
    # Filter to make sure we have data
    benign = df[df['Label'] == 1]
    attack = df[df['Label'] != 1]
    
    # Only plot if we have data with smoothing for better visualization
    if not benign.empty:
        if len(benign) > 10:
            x = benign['Seconds']
            y = benign['T(t)'] if 'T(t)' in benign.columns else benign['Flow Packets/s']
            x_smooth = np.linspace(x.min(), x.max(), 500)
            y_smooth = np.interp(x_smooth, x, y)
            plt.plot(x_smooth, y_smooth, color='green', label='Benign', linewidth=1.5, alpha=0.8)
        else:
            plt.plot(benign['Seconds'], benign['T(t)'] if 'T(t)' in benign.columns else benign['Flow Packets/s'], 
                    color='green', label='Benign', linewidth=1.5)
    
    if not attack.empty:
        if len(attack) > 10:
            x = attack['Seconds']
            y = attack['T(t)'] if 'T(t)' in attack.columns else attack['Flow Packets/s']
            x_smooth = np.linspace(x.min(), x.max(), 500)
            y_smooth = np.interp(x_smooth, x, y)
            plt.plot(x_smooth, y_smooth, color='red', label='Attack', linewidth=1.5, alpha=0.8)
        else:
            plt.plot(attack['Seconds'], attack['T(t)'] if 'T(t)' in attack.columns else attack['Flow Packets/s'], 
                    color='red', label='Attack', linewidth=1.5)
    
    plt.title(f"T(t) - Flow Packets/s vs Seconds ({name})")
    plt.xlabel("Seconds")
    plt.ylabel("T(t) = Flow Packets/s")
    plt.grid(True, linestyle='--', alpha=0.7)
    plt.legend()
    plt.tight_layout()
    
    # Use the correct filename format with higher quality
    if name.lower() == "live":
        plt.savefig(os.path.join(output_dir, "live_t_t.png"), bbox_inches='tight', pad_inches=0.1)
    else:
        plt.savefig(os.path.join(output_dir, f"{name.lower()}_T_t.png"), bbox_inches='tight', pad_inches=0.1)
    plt.close()  # Close the figure to free memory



def plot_dT_dt(df, name, output_dir):
    dT_dt = np.gradient(df['Flow Packets/s'].values, df['Seconds'].values)
    plt.figure(figsize=(16, 6), dpi=100)  # Wider figure
    plt.clf()
    
    # Ensure we're working with numeric labels
    df = df.copy()
    
    # Check if df['Label'] is numeric already; if not, convert
    if not pd.api.types.is_numeric_dtype(df['Label']):
        df['Label'] = df['Label'].map({'BENIGN': 1, 'ATTACK': 0}).fillna(1)
    
    # Filter to make sure we have data
    benign = df[df['Label'] == 1]
    attack = df[df['Label'] != 1]
    
    # Only plot if we have data with smoothing for better visualization
    if not benign.empty:
        if len(benign) > 10:
            x = benign['Seconds']
            y = dT_dt[benign.index]
            # Smooth derivative with moving average to reduce noise
            if len(y) > 5:
                y = np.convolve(y, np.ones(5)/5, mode='same')  # Simple moving average
            x_smooth = np.linspace(x.min(), x.max(), 500)
            y_smooth = np.interp(x_smooth, x, y)
            plt.plot(x_smooth, y_smooth, color='green', label='Benign', linewidth=1.5, alpha=0.8)
        else:
            plt.plot(benign['Seconds'], dT_dt[benign.index], color='green', label='Benign', linewidth=1.5)
    
    if not attack.empty:
        if len(attack) > 10:
            x = attack['Seconds']
            y = dT_dt[attack.index]
            # Smooth derivative with moving average to reduce noise
            if len(y) > 5:
                y = np.convolve(y, np.ones(5)/5, mode='same')  # Simple moving average
            x_smooth = np.linspace(x.min(), x.max(), 500)
            y_smooth = np.interp(x_smooth, x, y)
            plt.plot(x_smooth, y_smooth, color='red', label='Attack', linewidth=1.5, alpha=0.8)
        else:
            plt.plot(attack['Seconds'], dT_dt[attack.index], color='red', label='Attack', linewidth=1.5)
    
    plt.title(f"dT/dt vs Seconds ({name})")
    plt.xlabel("Seconds")
    plt.ylabel("dT/dt")
    plt.grid(True, linestyle='--', alpha=0.7)
    plt.legend()
    plt.tight_layout()
    
    # Use the correct filename format with higher quality
    if name.lower() == "live":
        plt.savefig(os.path.join(output_dir, "live_dt_dt.png"), bbox_inches='tight', pad_inches=0.1)
    else:
        plt.savefig(os.path.join(output_dir, f"{name.lower()}_dT_dt.png"), bbox_inches='tight', pad_inches=0.1)
    plt.close()  # Close the figure to free memory



def plot_d2T_dt2(df, name, output_dir):
    dT_dt = np.gradient(df['Flow Packets/s'].values, df['Seconds'].values)
    d2T_dt2 = np.gradient(dT_dt, df['Seconds'].values)
    plt.figure(figsize=(16, 6), dpi=100)  # Wider figure
    plt.clf()
    
    # Ensure we're working with numeric labels
    df = df.copy()
    
    # Check if df['Label'] is numeric already; if not, convert
    if not pd.api.types.is_numeric_dtype(df['Label']):
        df['Label'] = df['Label'].map({'BENIGN': 1, 'ATTACK': 0}).fillna(1)
    
    # Filter to make sure we have data
    benign = df[df['Label'] == 1]
    attack = df[df['Label'] != 1]
    
    # Only plot if we have data with smoothing for better visualization
    if not benign.empty:
        if len(benign) > 10:
            x = benign['Seconds']
            y = d2T_dt2[benign.index]
            # Double smooth second derivative to reduce noise
            if len(y) > 7:
                y = np.convolve(y, np.ones(7)/7, mode='same')  # Simple moving average
            x_smooth = np.linspace(x.min(), x.max(), 500)
            y_smooth = np.interp(x_smooth, x, y)
            plt.plot(x_smooth, y_smooth, color='green', label='Benign', linewidth=1.5, alpha=0.8)
        else:
            plt.plot(benign['Seconds'], d2T_dt2[benign.index], color='green', label='Benign', linewidth=1.5)
    
    if not attack.empty:
        if len(attack) > 10:
            x = attack['Seconds']
            y = d2T_dt2[attack.index]
            # Double smooth second derivative to reduce noise
            if len(y) > 7:
                y = np.convolve(y, np.ones(7)/7, mode='same')  # Simple moving average
            x_smooth = np.linspace(x.min(), x.max(), 500)
            y_smooth = np.interp(x_smooth, x, y)
            plt.plot(x_smooth, y_smooth, color='red', label='Attack', linewidth=1.5, alpha=0.8)
        else:
            plt.plot(attack['Seconds'], d2T_dt2[attack.index], color='red', label='Attack', linewidth=1.5)
    
    plt.title(f"d²T/dt² vs Seconds ({name})")
    plt.xlabel("Seconds")
    plt.ylabel("d²T/dt²")
    plt.grid(True, linestyle='--', alpha=0.7)
    plt.legend()
    plt.tight_layout()
    
    # Use the correct filename format with higher quality
    if name.lower() == "live":
        plt.savefig(os.path.join(output_dir, "live_d2t_dt2.png"), bbox_inches='tight', pad_inches=0.1)
    else:
        plt.savefig(os.path.join(output_dir, f"{name.lower()}_d2T_dt2.png"), bbox_inches='tight', pad_inches=0.1)
    plt.close()  # Close the figure to free memory


def plot_alert_levels_separately(df, dataset_name="Test", save_dir=None):
    level_map = {0: 'none', 1: 'low', 2: 'medium', 3: 'high'}
    colors = {0: 'gray', 1: 'yellow', 2: 'orange', 3: 'red'}

    for level in [0, 1, 2, 3]:
        alert_df = df[df['alert_level'] == level]

        if alert_df.empty:
            print(f"No data found for {level_map[level].capitalize()} level alerts.")
            continue

        plt.figure(figsize=(16, 6), dpi=100)  # Wider figure
        plt.clf()
        
        # Create a smoothed traffic flow curve if we have enough data
        if len(df) > 10:
            x = df['Seconds']
            y = df['Flow Packets/s']
            x_smooth = np.linspace(x.min(), x.max(), 500)
            y_smooth = np.interp(x_smooth, x, y)
            plt.plot(x_smooth, y_smooth, color='gray', linewidth=1, alpha=0.5, label='Traffic Flow (Smoothed)')
        else:
            plt.plot(df['Seconds'], df['Flow Packets/s'], color='gray', linewidth=1, alpha=0.6, label='Traffic Flow')
            
        # Create a better scatter plot for classes
        scatter = plt.scatter(df['Seconds'], df['Flow Packets/s'], 
                             c=df['Label'], cmap='tab10', s=8, alpha=0.6, label='Classes')
        plt.colorbar(scatter, ticks=np.unique(df['Label']))

        # Highlight only current level alerts with enhanced visibility
        plt.scatter(alert_df['Seconds'], alert_df['Flow Packets/s'],
                    color=colors[level], s=50, alpha=0.8, label=f'{level_map[level].capitalize()} Level Alert',
                    edgecolors='black', linewidths=0.5)

        plt.title(f"{dataset_name}: {level_map[level].capitalize()} Level Early Warnings")
        plt.xlabel("Seconds")
        plt.ylabel("Flow Packets/s")
        plt.grid(True, linestyle='--', alpha=0.7)
        plt.legend()
        plt.tight_layout()

        # Save if directory provided
        if save_dir:
            os.makedirs(save_dir, exist_ok=True)
            plt.savefig(os.path.join(save_dir, f"{dataset_name.lower()}_{level_map[level]}_level_alerts.png"),
                       bbox_inches='tight', pad_inches=0.1)
        plt.close()  # Free memory

def print_segment_points(df, label):
    indices = df[df['Label'] == label].index
    print(len(indices))
    print(indices.tolist())
    if len(indices) == 0:
        print(f"No '{label}' data found.")
    else:
        print(f"{label} Start Index: {indices[0]}, End Index: {indices[-1]}")
def plot_stat_with_ews(
    df, stat_df, column_to_plot, dataset_name, output_dir,
    ylabel=None, attack_start_time=None, attack_stop_time=None, peak_time=None
):
    os.makedirs(output_dir, exist_ok=True)
    plt.figure(figsize=(14, 6))

    # Determine majority label (assumed benign)
    benign_label = df['Label'].mode()[0]

    # Plot each label separately for color distinction
    for label, group_df in df.groupby('Label'):
        label_color = 'green' if label == benign_label else 'red'
        label_stat = stat_df[stat_df['Seconds'].isin(group_df['Seconds'])]

        plt.plot(
            label_stat['Seconds'],
            label_stat[column_to_plot],
            label=f"{label} ({'Benign' if label == benign_label else 'Attack'})",
            color=label_color
        )

    # Attack start/stop
    attack_indices = df[df['Label'] != benign_label].index
    if attack_start_time is None and len(attack_indices) > 0:
        attack_start_time = df.loc[attack_indices[0], 'Seconds']
    if attack_stop_time is None and len(attack_indices) > 0:
        attack_stop_time = df.loc[attack_indices[-1], 'Seconds']

    if attack_start_time and attack_stop_time:
        plt.axvline(x=attack_start_time, color='red', linestyle='--', label=f'Attack Start ({int(attack_start_time)}s)')
        plt.axvline(x=attack_stop_time, color='darkred', linestyle='--', label=f'Attack Stop ({int(attack_stop_time)}s)')

        y_center = (plt.ylim()[0] + plt.ylim()[1]) / 2
        plt.text(attack_start_time, y_center, f'Attack Start\n{int(attack_start_time)}s', color='red', ha='center', fontsize=10, fontweight='bold')
        plt.text(attack_stop_time, y_center, f'Attack Stop\n{int(attack_stop_time)}s', color='darkred', ha='center', fontsize=10, fontweight='bold')

    # EWS lines
    ews_colors = ['green', 'orange', 'purple']
    text_offsets = [0.50, 0.87, 0.82]
    high_ews = df[df['alert_level'] == 3]
    first_3_ews = high_ews.head(3)

    for idx, (_, row) in enumerate(first_3_ews.iterrows()):
        sec = row['Seconds']
        stat_value = stat_df[stat_df['Seconds'] == sec][column_to_plot]
        if not stat_value.empty:
            val = stat_value.values[0]
            color = ews_colors[idx % len(ews_colors)]
            offset = text_offsets[idx % len(text_offsets)]

            plt.axvline(x=sec, color=color, linestyle='-.', linewidth=2, label=f'EWS {idx+1}')
            plt.text(
                sec, plt.ylim()[1]*offset,
                f'EWS {idx+1}\n{int(sec)}s',
                color=color, rotation=90, va='top', ha='center', fontsize=9, fontweight='bold'
            )
            plt.scatter(sec, val, color=color, marker='x', s=100, linewidths=2, zorder=5)

    # Plot peak (highest Flow Packets/s timestamp) for all graphs
    if peak_time is not None:
        peak_val_series = stat_df[stat_df['Seconds'] == peak_time][column_to_plot]
        if not peak_val_series.empty:
            peak_val = peak_val_series.values[0]
            plt.axvline(x=peak_time, color='black', linestyle='--', linewidth=1.5, label=f'Peak Flow at {int(peak_time)}s')
            plt.scatter(peak_time, peak_val, color='black', marker='*', s=120, zorder=5)
            plt.text(
                peak_time, peak_val, f'Peak\n{int(peak_time)}s',
                color='black', ha='center', va='bottom', fontsize=9, fontweight='bold'
            )

    # Labels and layout
    plt.title(f"{dataset_name} - {column_to_plot.replace('_', ' ').title()} with Attack & EWS")
    plt.xlabel("Seconds")
    plt.ylabel(ylabel or column_to_plot.replace('_', ' ').title())
    plt.grid(True)
    plt.legend()
    plt.tight_layout()

    # Save plot safely
    safe_col_name = re.sub(r'[^\w\-_.]', '_', column_to_plot.lower())
    safe_dataset_name = re.sub(r'[^\w\-_.]', '_', dataset_name.lower())
    filename = f"{safe_dataset_name}_{safe_col_name}_plot.png"
    save_path = os.path.join(output_dir, filename)
    plt.savefig(save_path)
    print(f"Saved plot to: {save_path}")
    plt.show()

def plot_kurtosis_with_ews(df, kurtosis_df, dataset_name, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    plt.figure(figsize=(14, 6))
    # Plot kurtosis
    plt.plot(
        kurtosis_df['Seconds'], 
        kurtosis_df['Flow Packets/s_kurtosis'], 
        label='Kurtosis of Flow Packets/s', 
        color='blue'
    )
    majority_label = df['Label'].mode()[0]
    attack_indices = df[df['Label'] != majority_label].index
    if len(attack_indices) > 0:
        start_attack = df.loc[attack_indices[0], 'Seconds']
        stop_attack = df.loc[attack_indices[-1], 'Seconds']
        plt.axvline(x=start_attack, color='red', linestyle='--', label='Attack Start')
        plt.axvline(x=stop_attack, color='darkred', linestyle='--', label='Attack Stop')

    # EWS indicators (EWS 1, 2, 3)
    ews_colors = ['green', 'orange', 'purple']
    text_offsets = [0.50, 0.87, 0.82]  # for stacking overlapping labels
    high_ews = df[df['alert_level'] == 3]
    first_3_ews = high_ews.head(3)

    for idx, (_, row) in enumerate(first_3_ews.iterrows()):
        sec = row['Seconds']
        kurtosis_value = kurtosis_df[kurtosis_df['Seconds'] == sec]['Flow Packets/s_kurtosis']
        if not kurtosis_value.empty:
            kurt = kurtosis_value.values[0]
            color = ews_colors[idx % len(ews_colors)]
            offset = text_offsets[idx % len(text_offsets)]

            # Vertical line
            plt.axvline(x=sec, color=color, linestyle='-.', linewidth=2, label=f'EWS {idx+1}')
            
            # Text label
            plt.text(
                sec, plt.ylim()[1]*offset, 
                f'EWS {idx+1}\n{int(sec)}s',
                color=color, rotation=90, va='top', ha='center', fontsize=9, fontweight='bold'
            )
            
            # Cross mark
            plt.scatter(sec, kurt, color=color, marker='x', s=100, linewidths=2, zorder=5)

    plt.title(f"{dataset_name} - Kurtosis of Flow Packets/s with Attack & EWS")
    plt.xlabel("Seconds")
    plt.ylabel("Kurtosis")
    plt.grid(True)
    plt.legend()
    plt.tight_layout()
    filename = f"{dataset_name.lower().replace(' ', '_')}_kurtosis_plot.png"
    save_path = os.path.join(output_dir, filename)
    plt.savefig(save_path)
    print(f"Saved plot to: {save_path}")




features_s = ['Flow Packets/s', 'T(t)', 'dT/dt', 'd²T/dt²']
@app.route('/api/upload', methods=['POST'])
def upload_file():
    global df_global, cleaned_df_global, first_attack_test_global, gradient_model

    try:
        print("Starting file upload process...")

        if 'file' not in request.files:
            print("Error: No file part in the request")
            return jsonify({'error': 'No file part'}), 400

        if 'chunk_size' not in request.form:
            print("Error: Chunk size not provided")
            return jsonify({'error': 'Chunk size not provided'}), 400

        file = request.files['file']
        chunk_size = request.form['chunk_size']

        print(f"File received: {file.filename}, Chunk size: {chunk_size}")

        try:
            chunk_size = int(chunk_size)
        except ValueError as e:
            print(f"Error converting chunk size to integer: {str(e)}")
            return jsonify({'error': f'Invalid chunk size: {str(e)}'}), 400

        if file.filename == '':
            print("Error: No selected file")
            return jsonify({'error': 'No selected file'}), 400

        os.makedirs(output_dir, exist_ok=True)

        print("Reading CSV file...")
        try:
            df_test = pd.read_csv(file)
            df_full = df_test.copy()
            print(df_full.columns)
            sourceip_df=df_full[['Source IP','Timestamp']]
            sourceip_df.to_csv('sourceip_df.csv', index=False)
            cleaned_sourceip_df=clean_dataframe_in_chunks(sourceip_df, chunk_size)
            cleaned_sourceip_df.to_csv('cleaned_sourceip_df.csv', index=False)
            sorted_sourceip_df=sort_by_timestamp(cleaned_sourceip_df)
            sorted_sourceip_df.to_csv('sorted_sourceip_df.csv', index=False)
            
            df_test.to_csv('uploaded.csv', index=False)
            uploaded_csv = df_test.to_dict(orient='records')
            print(f"CSV file read successfully. Columns: {df_test.columns.tolist()}")
            print(f"DataFrame shape: {df_test.shape}")
        except Exception as e:
            print(f"Error reading CSV file: {str(e)}")
            return jsonify({'error': f'Failed to read CSV file: {str(e)}'}), 400

        missing_cols = [col for col in required_columns if col not in df_test.columns]
        if missing_cols:
            print(f"Error: Missing required columns: {missing_cols}")
            return jsonify({'error': f'Missing required columns: {missing_cols}'}), 400

        print("Extracting required columns...")
        df_global = df_test[required_columns]
        selected_columns = df_global.to_dict(orient='records')

        print("Cleaning DataFrame...")
        df_global = clean_dataframe_in_chunks(df_global, chunk_size)
        df_global.to_csv('df_cleaned.csv', index=False)
        cleaned_df = df_global.to_dict(orient='records')

        print("Sorting by timestamp...")
        df_sorted_timestamp = sort_by_timestamp(df_global)
        df_sorted_timestamp.to_csv('df_sorted_timestamp.csv', index=False)

        print("Grouping by timestamp...")
        df_grouped_by_timestamp = group_by_timestamp_and_assign_seconds_df(df_sorted_timestamp)
        df_grouped_by_timestamp.to_csv('df_grouped_by_timestamp.csv', index=False)
        grouped_df = df_grouped_by_timestamp.to_dict(orient='records')

        print("Applying flow transformation...")
        df_flow_transformed = process_flow_df(df_grouped_by_timestamp)
        df_flow_transformed.to_csv('df_flow_transformed.csv', index=False)

        print("Preparing for statistics...")
        df_test_raw = df_flow_transformed.copy()
        print(f"Classes found: {df_test_raw['Label'].unique()}")

        print("Computing statistics...")
        df_test, test_kurtosis, test_skewness, test_warning_indices, first_warning_test, first_attack_test, time_before_attack_test, _, _, _ = compute_statistics_with_warning(
            df_test_raw,
            kurtosis_thresholds=kurtosis_thresholds,
            skewness_thresholds=skewness_thresholds,
            features=features_s
        )

        print_warning_details(df_test, test_warning_indices, first_attack_test)
        print(f"Test  - First Warning: {first_warning_test}, First Attack: {first_attack_test}, Time Before Attack: {time_before_attack_test}")
        df_test.to_csv('df_test.csv', index=False)

        df_test['Label'] = df_test['Label'].map({'BENIGN': 1, 'ATTACK': 0}).fillna(1)

        print("Unique values in Label (repr):")
        for i, label in enumerate(df_test['Label'].unique()):
            print(f"{i}: {repr(label)}")

        print_segment_points(df_test, 1)  # benign
        for label in df_test['Label'].unique():
            if label != 1:
                print_segment_points(df_test, label)

        exclude_cols = ['Label', 'Timestamp', 'Seconds']
        feature_cols = [
            'T(t)', 'Label', 'alert_level', 'alert_level_dT/dt', 'alert_level_Flow Packets/s',
            'Flow Packets/s', 'd²T/dt²', 'alert_level_T(t)', 'dT/dt', 'alert_level_d²T/dt²'
        ]

        X_test_clean = handle_infinite_values(df_test[feature_cols])

        numeric_cols = X_test_clean.select_dtypes(include=[np.number]).columns
        non_numeric_cols = X_test_clean.select_dtypes(exclude=[np.number]).columns

        if len(numeric_cols) > 0:
            X_test_numeric = imputer.fit_transform(X_test_clean[numeric_cols])
            X_test_clean[numeric_cols] = X_test_numeric

        X_test_scaled = scaler.fit_transform(X_test_clean[numeric_cols])
        y_test = df_test['Label']

        plot_benign_attack(df_test, "Test")
        plot_test_peak_region(df_test, first_attack_test)
        plot_T_t(df_test, "Test", output_dir)
        plot_dT_dt(df_test, "Test", output_dir)
        plot_d2T_dt2(df_test, "Test", output_dir)
        plot_early_warnings(df_test, test_kurtosis, test_warning_indices, "Test", save_path=os.path.join(output_dir, "test_early_warnings.png"))
        plot_alert_levels_separately(df_test, dataset_name="Test", save_dir=output_dir)

        if gradient_model is None:
            print("Warning: gradient_model is None, attempting to reload it")
            try:
                gradient_model = load_sklearn_model_h5(model_path)
                if gradient_model is None:
                    raise ValueError("Failed to reload gradient model")
            except Exception as e:
                print(f"Error loading gradient model: {str(e)}")
                y_pred = np.zeros(len(X_test_scaled))
                print("Using fallback predictions (all zeros) due to missing model")
        else:
            y_pred = gradient_model.predict(X_test_scaled)

        # emergency_alerts = generate_emergency_alerts(df_test, y_pred)
        generate_emergency_alerts(df_test, attack_column='Flow Packets/s', dataset_name="Test Dataset", output_dir=output_dir)
        # df_test['emergency_alert'] = emergency_alerts

        # plot_emergency_alerts(df_test, "Test Dataset", save_path=os.path.join(output_dir, "test_emergency_alerts.png"))

        # combined_predicted_attacks = df_test[(df_test['emergency_alert'] == 1) | (y_pred == 1)]

        # level_map = {0: 'low', 1: 'medium', 2: 'high'}
            # for i, (_, row) in enumerate(combined_predicted_attacks.iterrows(), start=1):
            #     if row['emergency_alert'] == 1:
            #         level = level_map.get(row['alert_level'], 'unknown')
            #         severity = level.capitalize()
            #         print(f"Index: {i}, EMERGENCY Alert Level: {level}, Severity: {severity}, Actual Label: {row['Label']}")

        combined_df = pd.DataFrame({
            "Seconds": df_test['Seconds'].reset_index(drop=True),
            "Actual_Label": df_test['Label'].reset_index(drop=True),
            "Actual_Binary": (df_test['Label'] != 1).astype(int).reset_index(drop=True),
            "ML_Prediction": pd.Series(y_pred).reset_index(drop=True),
            "EWS_Alert_Level": df_test['alert_level'].reset_index(drop=True),
            # "Emergency_Alert": pd.Series(emergency_alerts).reset_index(drop=True)
        })

        # combined_df["Combined_Prediction"] = ((combined_df["ML_Prediction"] == 1) | (combined_df["Emergency_Alert"] == 1)).astype(int)

        # combined_excel_path = os.path.join(output_dir, "combined_predictions.xlsx")
        # combined_df.to_excel(combined_excel_path, index=False)
        # print(f"✅ Combined predictions saved to: {combined_excel_path}")

        print("Processing complete. Returning response...")
        kurtosis_data = {feature: values.tolist() for feature, values in test_kurtosis.items()}
        skewness_data = {feature: values.tolist() for feature, values in test_skewness.items()}
        
        
        # Save test kurtosis dataframe
        test_kurtosis_df = pd.DataFrame(test_kurtosis)
        test_kurtosis_df['Seconds'] = df_test['Seconds']
        test_kurtosis_df['Label'] = df_test['Label']
        test_kurtosis_df.to_csv(os.path.join(output_dir, 'test_kurtosis_stats.csv'), index=False)

        # Save test skewness dataframe
        test_skewness_df = pd.DataFrame(test_skewness)
        test_skewness_df['Seconds'] = df_test['Seconds']
        test_skewness_df['Label'] = df_test['Label']
        test_skewness_df.to_csv(os.path.join(output_dir, 'test_skewness_stats.csv'), index=False)
       
        # Identify peak timestamp from highest Flow Packets/s in attack period (Test)
        benign_label_test = df_test['Label'].mode()[0]
        attack_df_test = df_test[df_test['Label'] != benign_label_test]

        # Handle empty attack dataframe case
        if attack_df_test.empty:
            print("Warning: No attack data found in the dataset")
            flow_peak_time_test = None
        else:
            try:
                # Check if 'Flow Packets/s' column exists and has non-null values
                if 'Flow Packets/s' not in attack_df_test.columns or attack_df_test['Flow Packets/s'].isna().all():
                    print("Warning: No valid Flow Packets/s data found in attack data")
                    flow_peak_time_test = None
                else:
                    peak_row_test = attack_df_test.loc[attack_df_test['Flow Packets/s'].idxmax()]
                    flow_peak_time_test = peak_row_test['Seconds']
            except (ValueError, KeyError) as e:
                print(f"Warning: Could not find peak time in attack data: {str(e)}")
                flow_peak_time_test = None

        #function to plot kurtosis with ews
        plot_kurtosis_with_ews(df_test, test_kurtosis_df, "Test Set", output_dir)
        plot_stat_with_ews(df_test, test_kurtosis_df, 'Flow Packets/s_kurtosis', "Test Set - Kurtosis", output_dir, peak_time=flow_peak_time_test)
        plot_stat_with_ews(df_test, test_skewness_df, 'Flow Packets/s_skewness', "Test Set - Skewness", output_dir, peak_time=flow_peak_time_test)
        plot_stat_with_ews(df_test, df_test, 'Flow Packets/s', "Test Set - Flow Rate", output_dir, ylabel="Flow Packets/s", peak_time=flow_peak_time_test)
        df_level_0 = df_test[df_test['alert_level'] == 0]
        df_level_0.to_csv(os.path.join(output_dir, "df_test_alert_level_0.csv"), index=False)
        df_level_1 = df_test[df_test['alert_level'] == 1]
        df_level_1.to_csv(os.path.join(output_dir, "df_test_alert_level_1.csv"), index=False)
        df_level_2 = df_test[df_test['alert_level'] == 2]
        df_level_2.to_csv(os.path.join(output_dir, "df_test_alert_level_2.csv"), index=False)
        df_level_3 = df_test[df_test['alert_level'] == 3]
        df_level_3.to_csv(os.path.join(output_dir, "df_test_alert_level_3.csv"), index=False)
        
        # Convert timestamps to datetime type before merging
        sorted_sourceip_df['Timestamp'] = pd.to_datetime(sorted_sourceip_df['Timestamp'])
        df_test['Timestamp'] = pd.to_datetime(df_test['Timestamp'])
        
        # Merge the dataframes
        merged_df = pd.merge(sorted_sourceip_df, df_test, on='Timestamp', how='inner')
        merged_df.to_csv('merged_df.csv', index=False)
        
        # Group by 'Source IP' and count occurrences of each alert_level
        alert_counts = (
            merged_df.groupby('Source IP')['alert_level']
            .value_counts()
            .unstack(fill_value=0)
        )

        # Rename columns to match the desired format
        alert_counts = alert_counts.rename(columns={
            0: 'BENIGN',
            1: 'LOW',
            2: 'MEDIUM',
            3: 'HIGH'
        })

        # Reset index to make 'Source IP' a column
        alert_counts = alert_counts.reset_index()
        alert_counts.to_csv('alert_counts.csv', index=False)
        return jsonify({
            'df_level_0': df_level_0.to_dict(orient='records'),
            'df_level_1':df_level_1.to_dict(orient='records'),
            'df_level_2':df_level_2.to_dict(orient='records'),
            'df_level_3':df_level_3.to_dict(orient='records'),
            'test_kurtosis_df': test_kurtosis_df.to_dict(orient='records'),
            'test_skewness_df': test_skewness_df.to_dict(orient='records'),
            
            'test_kurtosis': kurtosis_data,
            'test_skewness': skewness_data,
            'uploaded_csv': uploaded_csv,
            'selected_columns': selected_columns,
            'cleaned_df': cleaned_df,
            'grouped_df': grouped_df,
            'kurtosis_thresholds': kurtosis_thresholds,
            'skewness_thresholds': skewness_thresholds,
            'transformed_df': df_flow_transformed.to_dict(orient='records'),
            # 'df': df_test.to_dict(orient='records'),
            'first_attack_test': first_attack_test_global,
            # 'message': 'File uploaded and processed successfully',
            "data": df_test.to_dict(orient='records'),
            "warning_indices": test_warning_indices.tolist(),
            "emergency_alerts_generated": 'emergency_alert' in df_test.columns,
            # "ip_alert_mapping": ip_alert_dict,  # Add the IP-alert mapping to the response
            "alert_counts": alert_counts.to_dict(orient='records'),
            # "visualizations": {
            #     "emergency_alerts": "/api/images/emergency_alerts.png",
            #     "early_warnings": "/api/images/early_warnings.png",
            #     "benign_attack": "/api/images/test_benign_attack.png",
            #     "peak_region": "/api/images/test_peak_region.png",
               
            # }
        })

    except Exception as e:
        print(f"Error processing file: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500


    



@app.route('/api')
def home():
    return jsonify({'message': 'Welcome to the Flask API Home Route'})



@app.route('/api/images/<filename>')
def serve_image(filename):
    try:
        # Adjust `output_dir` to your actual output directory where images are saved
        return send_from_directory(output_dir, filename)
    except FileNotFoundError:
        return jsonify({'error': f'Image {filename} not found'}), 404

@app.route('/api/generate-benign-attack-image', methods=['GET'])
def generate_benign_attack_image():
    """
    Generate the test_benign_attack.png image on demand.
    This ensures the image is available even if it wasn't created during a previous upload.
    """
    try:
        # Path to sample data
        sample_file = 'sample_data.csv'
        if not os.path.exists(sample_file):
            return jsonify({'error': f'Sample data file {sample_file} not found'}), 404
        
        print(f"Generating benign-attack image using {sample_file}")
        
        # Create output directory
        os.makedirs(output_dir, exist_ok=True)
        
        # Read the sample data
        df_test = pd.read_csv(sample_file)
        print(f"Read {len(df_test)} rows from sample data")
        
        # Basic processing
        df_global = df_test[required_columns]
        df_global = clean_dataframe_in_chunks(df_global, 1000)
        df_sorted_timestamp = sort_by_timestamp(df_global)
        df_grouped_by_timestamp = group_by_timestamp_and_assign_seconds_df(df_sorted_timestamp)
        df_flow_transformed = process_flow_df(df_grouped_by_timestamp)
        
        # Process data for analysis
        df_test_raw = df_flow_transformed.copy()
        df_test_raw = encode_labels(df_test_raw)
        
        # Save the benign vs attack plot
        benign_attack_path = os.path.join(output_dir, 'test_benign_attack.png')
        plot_benign_attack(df_test_raw, "Test", save_path=benign_attack_path)
        
        return jsonify({
            'message': 'Benign vs Attack image generated successfully',
            'image_path': '/api/images/test_benign_attack.png'
        })

    except Exception as e:
        print(f"Error generating benign-attack image: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

# Replace all instances of LabelEncoder with custom mapping
def encode_labels(df, column='Label'):
    label_mapping = {'BENIGN': 1, 'ATTACK': 0}
    df[column] = df[column].map(label_mapping)
    return df

@app.route('/')
@app.route('/prevention')
@app.route('/flow-analysis')
@app.route('/live-capture')
def serve_root():
    return send_from_directory(frontend_dist, 'index.html')

def open_browser():
    webbrowser.open_new("http://127.0.0.1:5000/")
from threading import Timer

# Global variables for continuous capture
continuous_capture_thread = None
capture_stop_event = Event()
continuous_capture_interval = 1  # seconds - changed from 10 to 1

# Initialize counters and variables for packet capture
downstream_count = {}
upstream_count = {}
urg_flag_count = 0
cwe_flag_count = 0
fwd_psh_flag_count = 0
rst_flag_count = 0
fwd_packet_length_min = float('inf')
min_packet_length = float('inf')
min_seg_size_forward = float('inf')

flow_bytes = {}
flow_packet_count = {}
flow_last_timestamp = {}
fwd_flow_packet_count = {}
fwd_flow_last_timestamp = {}

flows = {}

# Add this to the global variables section near line 186
alert_history = {
    'past_ml_predictions': [],  # Store past ML predictions 
    'past_ews_alerts': [],      # Store past EWS alerts
    'alert_timestamps': [],     # Track when alerts occurred
    'last_emergency_time': None # Track the last time an emergency was detected
}

def packet_callback(packet):
    global downstream_count, upstream_count, urg_flag_count, cwe_flag_count, fwd_psh_flag_count, rst_flag_count
    global fwd_packet_length_min, min_packet_length, min_seg_size_forward
    global flow_bytes, flow_packet_count, flow_last_timestamp
    global fwd_flow_packet_count, fwd_flow_last_timestamp, flows

    if IP in packet:
        src_ip = packet[IP].src
        dst_ip = packet[IP].dst
        timestamp = packet.time
        readable_time = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(timestamp))
        src_port = None
        dst_port = None
        packet_length = len(packet)

        if TCP in packet:
            src_port = packet[TCP].sport
            dst_port = packet[TCP].dport
            if packet[TCP].flags & 0x20: urg_flag_count += 1
            if packet[TCP].flags & 0x80: cwe_flag_count += 1
            if packet[TCP].flags & 0x08:
                fwd_psh_flag_count += 1
                fwd_packet_length_min = min(fwd_packet_length_min, packet_length)
            if packet[TCP].flags & 0x04: rst_flag_count += 1

        elif UDP in packet:
            src_port = packet[UDP].sport
            dst_port = packet[UDP].dport

        if packet_length < min_packet_length:
            min_packet_length = packet_length

        flow_id = f"{src_ip}:{src_port}:{dst_ip}:{dst_port}"

        if flow_id not in flow_bytes:
            flow_bytes[flow_id] = 0
            flow_packet_count[flow_id] = 0
            flow_last_timestamp[flow_id] = timestamp
            flows[flow_id] = {
                "packets": [],
                "timestamps": [],
                "fwd_lengths": [],
                "bwd_lengths": []
            }

        flows[flow_id]["packets"].append(packet)
        flows[flow_id]["timestamps"].append(timestamp)

        flow_bytes[flow_id] += packet_length
        flow_packet_count[flow_id] += 1

        time_difference = timestamp - flow_last_timestamp[flow_id]
        pps = flow_packet_count[flow_id] / time_difference if time_difference > 0 else 0
        flow_last_timestamp[flow_id] = timestamp

        fwd_flow_id = f"{src_ip}:{src_port}:{dst_ip}:{dst_port}"
        if fwd_flow_id not in fwd_flow_packet_count:
            fwd_flow_packet_count[fwd_flow_id] = 0
            fwd_flow_last_timestamp[fwd_flow_id] = timestamp

        fwd_flow_packet_count[fwd_flow_id] += 1
        fwd_time_difference = timestamp - fwd_flow_last_timestamp[fwd_flow_id]
        fwd_pps = fwd_flow_packet_count[fwd_flow_id] / fwd_time_difference if fwd_time_difference > 0 else 0
        fwd_flow_last_timestamp[fwd_flow_id] = timestamp

        if src_ip == packet[IP].src:
            downstream_count[flow_id] = downstream_count.get(flow_id, 0) + 1
            flows[flow_id]["fwd_lengths"].append(packet_length)
        if dst_ip == packet[IP].dst:
            upstream_count[flow_id] = upstream_count.get(flow_id, 0) + 1
            flows[flow_id]["bwd_lengths"].append(packet_length)

        down_up_ratio = downstream_count[flow_id] / upstream_count[flow_id] if upstream_count[flow_id] > 0 else 0
        inbound = sum(1 for pkt in flows[flow_id]["packets"] if pkt[IP].dst == dst_ip)

        bwd_iat = [
            flows[flow_id]["timestamps"][i] - flows[flow_id]["timestamps"][i-1]
            for i in range(1, len(flows[flow_id]["timestamps"]))
            if flows[flow_id]["timestamps"][i] != flows[flow_id]["timestamps"][i-1]
        ]
        bwd_iat_total = sum(bwd_iat) if bwd_iat else 0

        avg_packet_size = statistics.mean(flows[flow_id]["fwd_lengths"] + flows[flow_id]["bwd_lengths"]) if flows[flow_id]["fwd_lengths"] or flows[flow_id]["bwd_lengths"] else 0

        if TCP in packet and packet[IP].src == src_ip:
            seg_size = len(packet[TCP].payload)
            if seg_size > 0 and seg_size < min_seg_size_forward:
                min_seg_size_forward = seg_size

        if min_seg_size_forward == float('inf'):
            min_seg_size_forward = 0

        fwd_packet_length_mean = statistics.mean(flows[flow_id]["fwd_lengths"]) if flows[flow_id]["fwd_lengths"] else 0
        avg_fwd_segment_size = statistics.mean(flows[flow_id]["fwd_lengths"]) if flows[flow_id]["fwd_lengths"] else 0

        # Save the row to CSV
        with open(csv_file, mode='a', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([
                 readable_time, src_ip, src_port, dst_ip, dst_port, flow_id,
                urg_flag_count, cwe_flag_count, fwd_psh_flag_count, rst_flag_count,
                packet_length, min_packet_length, fwd_packet_length_min,
                flow_bytes[flow_id], f"{pps:.2f}", f"{fwd_pps:.2f}",
                f"{down_up_ratio:.2f}", inbound, f"{bwd_iat_total:.6f}",
                f"{avg_packet_size:.2f}", min_seg_size_forward,
                f"{fwd_packet_length_mean:.2f}", f"{avg_fwd_segment_size:.2f}", 1
            ])

def cleanup_memory():
    """Clean up memory, particularly for matplotlib figures."""
    # Close all matplotlib figures
    plt.close('all')
    
    # Run garbage collector
    gc.collect()
    
    return

# Create a function for continuous capture
def continuous_capture_worker():
    global capture_stop_event
    
    print("Starting continuous capture...")
    
    # Ensure output directories exist
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(os.path.dirname(csv_file), exist_ok=True)
    
    # Initialize the CSV file
    with open(csv_file, mode='w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([
            'Timestamp', 'Source IP', 'Source Port', 'Destination IP', 'Destination Port',
            'Flow ID', 'URG Flag Count', 'CWE Flag Count', 'FWD PSH Flag Count', 'RST Flag Count',
            'Packet Length', 'Minimum Packet Length', 'Minimum FWD Packet Length',
            'Flow Bytes', 'Flow Packets/s', 'FWD PPS',
            'Down/Up Ratio', 'Inbound Packet Count', 'Total BWD IAT',
            'Average Packet Size', 'Minimum Segment Size FWD',
            'FWD Packet Length Mean', 'Avg FWD Segment Size','Label'
        ])
    
    # Reset counters
    reset_capture_counters()
    
    # Run until stopped
    while not capture_stop_event.is_set():
        try:
            # Capture for 1 second
            print(f"Capturing for {continuous_capture_interval} second...")
            sniff(prn=packet_callback, store=0, timeout=continuous_capture_interval)
            
            # Process the captured data immediately after each capture interval
            process_captured_data_internal()
            
            # Clean up memory to prevent leaks during continuous operation
            cleanup_memory()
        except Exception as e:
            print(f"Error in continuous capture: {str(e)}")
            time.sleep(1)  # Wait a short time before retrying on error
    
    print("Continuous capture stopped.")

def reset_capture_counters():
    global downstream_count, upstream_count, urg_flag_count, cwe_flag_count, fwd_psh_flag_count, rst_flag_count
    global fwd_packet_length_min, min_packet_length, min_seg_size_forward
    global flow_bytes, flow_packet_count, flow_last_timestamp, fwd_flow_packet_count, fwd_flow_last_timestamp
    global flows
    
    # Reset all counters to initial values
    downstream_count = {}
    upstream_count = {}
    urg_flag_count = 0
    cwe_flag_count = 0
    fwd_psh_flag_count = 0
    rst_flag_count = 0
    fwd_packet_length_min = float('inf')
    min_packet_length = float('inf')
    min_seg_size_forward = float('inf')
    flow_bytes = {}
    flow_packet_count = {}
    flow_last_timestamp = {}
    fwd_flow_packet_count = {}
    fwd_flow_last_timestamp = {}
    flows = {}
    
    print("All capture counters have been reset")

def process_captured_data_internal():
    global gradient_model, alert_history

    try:
        # Check if file exists and has content
        if not os.path.exists(csv_file) or os.path.getsize(csv_file) <= 100:
            print("No data to process yet")
            return None

        # Ensure output directory exists
        os.makedirs(output_dir, exist_ok=True)

        # Read the CSV file - use a more efficient reading method
        try:
            flow_data = pd.read_csv(csv_file)
        except Exception as e:
            print(f"Error reading CSV file: {str(e)}")
            return None

        

        # Check for required columns
        missing_cols = [col for col in required_columns if col not in flow_data.columns]
        if missing_cols:
            print(f"Error: Missing required columns: {missing_cols}")
            return None

        # Extract, clean, and process the data
        flow_global = flow_data[required_columns]
        flow_global = clean_dataframe(flow_global)
        flow_sorted_timestamp = sort_by_timestamp(flow_global)
        flow_grouped_by_timestamp = group_by_timestamp_and_assign_seconds_df(flow_sorted_timestamp)
        flow_transformed = process_flow_df(flow_grouped_by_timestamp)
        flow_test_raw = flow_transformed.copy()

        # Compute statistics - with optimized settings for faster computation
        flow_test, test_kurtosis, test_skewness, test_warning_indices, first_warning_test, first_attack_test, time_before_attack_test, _, _, _ = compute_statistics_with_warning(
            flow_test_raw,
            window_size=100,
            # min(4, max(2, len(flow_test_raw) // 10)),  # Adaptive window size
            kurtosis_thresholds=kurtosis_thresholds,
            skewness_thresholds=skewness_thresholds,
            features=features_s
        )

        
        print_warning_details(flow_test, test_warning_indices, first_attack_test)
        print(f"Test  - First Warning: {first_warning_test}, First Attack: {first_attack_test}, Time Before Attack: {time_before_attack_test}")
        flow_test.to_csv('df_test.csv', index=False)

        flow_test['Label'] = flow_test['Label'].map({'BENIGN': 1, 'ATTACK': 0}).fillna(1)

        print("Unique values in Label (repr):")
        for i, label in enumerate(flow_test['Label'].unique()):
            print(f"{i}: {repr(label)}")

        print_segment_points(flow_test, 1)  # benign
        for label in flow_test['Label'].unique():
            if label != 1:
                print_segment_points(flow_test, label)

        exclude_cols = ['Label', 'Timestamp', 'Seconds']
        feature_cols = [
            'T(t)', 'Label', 'alert_level', 'alert_level_dT/dt', 'alert_level_Flow Packets/s',
            'Flow Packets/s', 'd²T/dt²', 'alert_level_T(t)', 'dT/dt', 'alert_level_d²T/dt²'
        ]

        X_test_clean = handle_infinite_values(flow_test[feature_cols])

        numeric_cols = X_test_clean.select_dtypes(include=[np.number]).columns
        non_numeric_cols = X_test_clean.select_dtypes(exclude=[np.number]).columns

        if len(numeric_cols) > 0:
            X_test_numeric = imputer.fit_transform(X_test_clean[numeric_cols])
            X_test_clean[numeric_cols] = X_test_numeric

        X_test_scaled = scaler.fit_transform(X_test_clean[numeric_cols])
        y_test = flow_test['Label']

        # plot_benign_attack(flow_test, "live")
        # plot_test_peak_region(flow_test, first_attack_test)
        # plot_T_t(flow_test, "live", output_dir)
        # plot_dT_dt(flow_test, "live", output_dir)
        # plot_d2T_dt2(flow_test, "live", output_dir)
        # plot_early_warnings(flow_test, test_kurtosis, test_warning_indices, "Test", save_path=os.path.join(output_dir, "test_early_warnings.png"))
        # plot_alert_levels_separately(flow_test, dataset_name="Test", save_dir=output_dir)

        if gradient_model is None:
            print("Warning: gradient_model is None, attempting to reload it")
            try:
                gradient_model = load_sklearn_model_h5(model_path)
                if gradient_model is None:
                    raise ValueError("Failed to reload gradient model")
            except Exception as e:
                print(f"Error loading gradient model: {str(e)}")
                y_pred = np.zeros(len(X_test_scaled))
                print("Using fallback predictions (all zeros) due to missing model")
        else:
            y_pred = gradient_model.predict(X_test_scaled)

        # emergency_alerts = generate_emergency_alerts(df_test, y_pred)
        generate_emergency_alerts(flow_test, attack_column='Flow Packets/s', dataset_name="Test Dataset", output_dir=output_dir)
       
        combined_df = pd.DataFrame({
            "Seconds": flow_test['Seconds'].reset_index(drop=True),
            "Actual_Label": flow_test['Label'].reset_index(drop=True),
            "Actual_Binary": (flow_test['Label'] != 1).astype(int).reset_index(drop=True),
            "ML_Prediction": pd.Series(y_pred).reset_index(drop=True),
            "EWS_Alert_Level": flow_test['alert_level'].reset_index(drop=True),
            # "Emergency_Alert": pd.Series(emergency_alerts).reset_index(drop=True)
        })

        print("Processing complete. Returning response...")
        kurtosis_data = {feature: values.tolist() for feature, values in test_kurtosis.items()}
        skewness_data = {feature: values.tolist() for feature, values in test_skewness.items()}
        
        
        # Save test kurtosis dataframe
        test_kurtosis_df = pd.DataFrame(test_kurtosis)
        test_kurtosis_df['Seconds'] = flow_test['Seconds']
        test_kurtosis_df['Label'] = flow_test['Label']
        test_kurtosis_df.to_csv(os.path.join(output_dir, 'test_kurtosis_stats.csv'), index=False)

        # Save test skewness dataframe
        test_skewness_df = pd.DataFrame(test_skewness)
        test_skewness_df['Seconds'] = flow_test['Seconds']
        test_skewness_df['Label'] = flow_test['Label']
        test_skewness_df.to_csv(os.path.join(output_dir, 'test_skewness_stats.csv'), index=False)
       
        # Identify peak timestamp from highest Flow Packets/s in attack period (Test)
        benign_label_test = flow_test['Label'].mode()[0]
        attack_df_test = flow_test[flow_test['Label'] != benign_label_test]

        if (
            not attack_df_test.empty
            and 'Flow Packets/s' in attack_df_test.columns
            and attack_df_test['Flow Packets/s'].notna().any()
        ):
            peak_row_test = attack_df_test.loc[attack_df_test['Flow Packets/s'].idxmax()]
            
            if 'Seconds' in peak_row_test:
                flow_peak_time_test = peak_row_test['Seconds']
            else:
                print("Warning: 'Seconds' column not found in peak_row_test.")
                flow_peak_time_test = None
        else:
            print("Warning: attack_df_test is empty or missing 'Flow Packets/s' values.")
            peak_row_test = None
            flow_peak_time_test = None

        #function to plot kurtosis with ews
        plot_kurtosis_with_ews(flow_test, test_kurtosis_df, "Test Set", output_dir)
        plot_stat_with_ews(flow_test, test_kurtosis_df, 'Flow Packets/s_kurtosis', "Test Set - Kurtosis", output_dir, peak_time=flow_peak_time_test)
        plot_stat_with_ews(flow_test, test_skewness_df, 'Flow Packets/s_skewness', "Test Set - Skewness", output_dir, peak_time=flow_peak_time_test)
        plot_stat_with_ews(flow_test, flow_test, 'Flow Packets/s', "Test Set - Flow Rate", output_dir, ylabel="Flow Packets/s", peak_time=flow_peak_time_test)
        df_level_0 = flow_test[flow_test['alert_level'] == 0]
        df_level_0.to_csv(os.path.join(output_dir, "df_test_alert_level_0.csv"), index=False)
        df_level_1 = flow_test[flow_test['alert_level'] == 1]
        df_level_1.to_csv(os.path.join(output_dir, "df_test_alert_level_1.csv"), index=False)
        df_level_2 = flow_test[flow_test['alert_level'] == 2]
        df_level_2.to_csv(os.path.join(output_dir, "df_test_alert_level_2.csv"), index=False)
        df_level_3 = flow_test[flow_test['alert_level'] == 3]
        df_level_3.to_csv(os.path.join(output_dir, "df_test_alert_level_3.csv"), index=False)
        
        # Use multithreading to speed up graph generation
        plot_tasks = [
            # Kurtosis plot
            (
                plot_stat_with_ews,
                (
                    flow_test,
                    test_kurtosis_df,
                    'Flow Packets/s_kurtosis',
                    "Test Set - Kurtosis",
                    output_dir,
                    
                    None,  # ylabel
                    flow_peak_time_test
                )
            ),

            # Skewness plot
            (
                plot_stat_with_ews,
                (
                    flow_test,
                    test_skewness_df,
                    'Flow Packets/s_skewness',
                    "Test Set - Skewness",
                    output_dir,
                    None,
                    flow_peak_time_test
                )
            ),

            # Flow Packets/s plot
            (
                plot_stat_with_ews,
                (
                    flow_test,
                    flow_test,
                    'Flow Packets/s',
                    "Test Set - Flow Rate",
                   output_dir,
                    "Flow Packets/s",
                    flow_peak_time_test
                )
            ),

            # Benign vs. Attack plot
            (
                plot_benign_attack,
                (
                    flow_test,
                    "Live"
                )
            ),

            # First derivative (T_t)
            (
                plot_T_t,
                (
                    flow_test,
                    "Live",
                    output_dir
                )
            ),

            # Second derivative (dT/dt)
            (
                plot_dT_dt,
                (
                    flow_test,
                    "Live",
                    output_dir
                )
            ),

            # Third derivative (d²T/dt²)
            (
                plot_d2T_dt2,
                (
                    flow_test,
                    "Live",
                    output_dir
                )
            ),

            # Early warnings
            (plot_early_warnings, (flow_test, test_kurtosis, test_warning_indices, "Live",
                                    os.path.join(output_dir, "live_early_warnings.png"))),

            # Emergency alerts
            (plot_emergency_alerts, (flow_test, "Live Capture",
                                     os.path.join(output_dir, "live_emergency_alerts.png"))),
        ]

        # Optional: plot peak region if attack detected
        if first_attack_test is not None and first_attack_test >= 0:
            plot_test_peak_region(flow_test, first_attack_test)

        # Generate alert level plots only when we have more data
        if len(flow_test) % 5 == 0:
            plot_alert_levels_separately(flow_test, dataset_name="Live", save_dir=output_dir)

        # Create attack detected status
        attack_detected = (y_pred != 1).any()

        # Save current state for the web UI to access
        with open(os.path.join(output_dir, 'live_capture_status.json'), 'w') as f:
            json.dump({
                'last_update': time.strftime('%Y-%m-%d %H:%M:%S'),
                'data_points': len(flow_data),
                'emergency_alerts': 0,
                'warning_indices': test_warning_indices.tolist() if len(test_warning_indices) > 0 else [],
                'attack_detected': bool(attack_detected)
            }, f)

        # Execute each plotting function sequentially
        for plot_func, args in plot_tasks:
            try:
                plot_func(*args)
            except Exception as e:
                print(f"Error in plot function {plot_func.__name__}: {str(e)}")

        return flow_test

    except Exception as e:
        print(f"Error processing capture data: {str(e)}")
        print(traceback.format_exc())
        return None



# Add new routes for continuous capture
@app.route('/api/continuous-capture/start', methods=['GET', 'POST'])
def start_continuous_capture():
    global continuous_capture_thread, capture_stop_event, alert_history

    # Stop any existing capture
    if continuous_capture_thread is not None and continuous_capture_thread.is_alive():
        capture_stop_event.set()
        continuous_capture_thread.join(timeout=3)

    # Reset stop event
    capture_stop_event.clear()

    # Reset alert history
    alert_history = {
        'past_ml_predictions': [],
        'past_ews_alerts': [],
        'alert_timestamps': [],
        'last_emergency_time': None
    }

    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)

    # Clear previous output images to ensure fresh graphs
    for filename in [
        "live_benign_attack.png",
        "live_early_warnings.png",
        "live_emergency_alerts.png",
        "live_t_t.png",
        "live_dt_dt.png",
        "live_d2t_dt2.png",
        "live_low_level_alerts.png",
        "live_medium_level_alerts.png",
        "live_high_level_alerts.png",
        "live_capture_status.json",
        "live_kurtosis.png",
        "live_skewness.png",
        "live_flow_packets.png",
        "test_set_-_flow_rate_flow_packets_s_plot.png",
        "test_set_-_kurtosis_flow_packets_s_kurtosis_plot.png",
        "test_set_-_skewness_flow_packets_s_skewness_plot.png"
    ]:
        filepath = os.path.join(output_dir, filename)
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
                print(f"Removed old file: {filepath}")
            except Exception as e:
                print(f"Error removing file {filepath}: {str(e)}")

    # Clear previous capture data file
    with open(csv_file, mode='w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([
            'Timestamp', 'Source IP', 'Source Port', 'Destination IP', 'Destination Port',
            'Flow ID', 'URG Flag Count', 'CWE Flag Count', 'FWD PSH Flag Count', 'RST Flag Count',
            'Packet Length', 'Minimum Packet Length', 'Minimum FWD Packet Length',
            'Flow Bytes', 'Flow Packets/s', 'FWD PPS',
            'Down/Up Ratio', 'Inbound Packet Count', 'Total BWD IAT',
            'Average Packet Size', 'Minimum Segment Size FWD',
            'FWD Packet Length Mean', 'Avg FWD Segment Size', 'Label'
        ])

    # Start new capture thread
    continuous_capture_thread = Thread(target=continuous_capture_worker)
    continuous_capture_thread.daemon = True
    continuous_capture_thread.start()

    return jsonify({
        'status': 'success',
        'message': 'Continuous capture started',
        'interval': continuous_capture_interval
    })


@app.route('/api/continuous-capture/stop', methods=['GET', 'POST'])
def stop_continuous_capture():
    global continuous_capture_thread, capture_stop_event
    
    if continuous_capture_thread is not None and continuous_capture_thread.is_alive():
        capture_stop_event.set()
        continuous_capture_thread.join(timeout=3)
        return jsonify({
            'status': 'success',
            'message': 'Continuous capture stopped'
        })
    else:
        return jsonify({
            'status': 'warning',
            'message': 'No continuous capture running'
        })

@app.route('/api/continuous-capture/status', methods=['GET'])
def continuous_capture_status():
    global continuous_capture_thread
    
    is_running = continuous_capture_thread is not None and continuous_capture_thread.is_alive()
    
    status_file = os.path.join(output_dir, 'live_capture_status.json')
    
    if os.path.exists(status_file):
        try:
            with open(status_file, 'r') as f:
                status_data = json.load(f)
        except Exception as e:
            status_data = {'error': str(e)}
    else:
        status_data = {'last_update': None}
    
    # Add available image paths for the frontend
    image_paths = {
        'benign_attack': '/api/images/live_benign_attack.png',
        'early_warnings': '/api/images/live_early_warnings.png',
        'emergency_alerts': '/api/images/live_emergency_alerts.png',
        't_t': '/api/images/live_t_t.png',
        'dt_dt': '/api/images/live_dt_dt.png',
        'd2t_dt2': '/api/images/live_d2t_dt2.png',
        'kurtosis': '/api/images/test_set_-_kurtosis_flow_packets_s_kurtosis_plot.png',
        'skewness': '/api/images/test_set_-_skewness_flow_packets_s_skewness_plot.png',
        'flow_packets': '/api/images/test_set_-_flow_rate_flow_packets_s_plot.png'
        
    }
    
    # Check if the images exist, and if not, provide default ones
    for key, path in image_paths.items():
        image_file = path.replace('/api/images/', '')
        if not os.path.exists(os.path.join(output_dir, image_file)):
            if key == 'benign_attack':
                image_paths[key] = '/api/images/test_benign_attack.png'
            elif key == 'early_warnings':
                image_paths[key] = '/api/images/test_early_warnings.png'
            elif key == 'emergency_alerts':
                image_paths[key] = '/api/images/test_emergency_alerts.png'
    
    return jsonify({
        'is_running': is_running,
        'interval': continuous_capture_interval,
        'image_paths': image_paths,
        **status_data
    })

@app.route('/api/capture', methods=['GET', 'POST'])
def capture():
    seconds = request.form.get('seconds', '10')
    seconds = int(seconds)
    
    # Clear the flow_statistics.csv file before starting new capture
    with open(csv_file, mode='w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([
            'Timestamp', 'Source IP', 'Source Port', 'Destination IP', 'Destination Port',
            'Flow ID', 'URG Flag Count', 'CWE Flag Count', 'FWD PSH Flag Count', 'RST Flag Count',
            'Packet Length', 'Minimum Packet Length', 'Minimum FWD Packet Length',
            'Flow Bytes', 'Flow Packets/s', 'FWD PPS',
            'Down/Up Ratio', 'Inbound Packet Count', 'Total BWD IAT',
            'Average Packet Size', 'Minimum Segment Size FWD',
            'FWD Packet Length Mean', 'Avg FWD Segment Size','Label'
        ])
    
    # Reset all counters and variables
    reset_capture_counters()
    
    # Start packet capture
    sniff(prn=packet_callback, store=0, timeout=seconds)
    flow_data = pd.read_csv(csv_file)
    return jsonify({'message': 'Capture started', 'flow_data': flow_data.to_dict(orient='records')})

@app.route('/api/process-captured-data', methods=['POST'])
def process_captured_data():
    global gradient_model
    try:
        result = process_captured_data_internal()
        if result is None:
            return jsonify({'error': 'Error processing data'}), 500
            
        # Prepare response data
        analysis_data = result[['Timestamp', 'Flow Packets/s', 'Label']].to_dict('records')

        # Calculate summary statistics
        summary = {
            'total_rows': len(result),
            'avg_packet_rate': float(result['Flow Packets/s'].mean()),
            'max_packet_rate': float(result['Flow Packets/s'].max()),
            'anomaly_threshold': 0.8,
            'high_risk_count': len(
                result[
                    result['Flow Packets/s'] > result['Flow Packets/s'].mean() + 2 * result['Flow Packets/s'].std()
                ]
            ),
            'normal_count': len(
                result[
                    result['Flow Packets/s'] <= result['Flow Packets/s'].mean() + 2 * result['Flow Packets/s'].std()
                ]
            )
        }

        return jsonify({
            'message': 'File uploaded and processed successfully',
            'analysis_data': analysis_data,
            'summary': summary,
            'data': result.replace({np.nan: None}).to_dict(orient='records'),
            'warning_indices': []  # This would need to be captured from process_captured_data_internal
        })

    except Exception as e:
        print(f"Error processing file: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/api/debug-upload', methods=['POST'])
def debug_upload():
    try:
        print("Starting debug file upload process...")

        if 'file' not in request.files:
            print("Error: No file part in the request")
            return jsonify({'error': 'No file part'}), 400

        file = request.files['file']
        chunk_size = request.form.get('chunk_size', '100')

        print(f"Debug File received: {file.filename}, Chunk size: {chunk_size}")

        try:
            chunk_size = int(chunk_size)
        except ValueError as e:
            print(f"Error converting chunk size to integer: {str(e)}")
            return jsonify({'error': f'Invalid chunk size: {str(e)}'}), 400

        if file.filename == '':
            print("Error: No selected file")
            return jsonify({'error': 'No selected file'}), 400

        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Save uploaded file
        file_path = os.path.join(output_dir, "debug_upload.csv")
        file.save(file_path)
        print(f"File saved to {file_path}")

        # Read CSV file
        try:
            df = pd.read_csv(file_path)
            print(f"CSV file read successfully. Columns: {df.columns.tolist()}")
            print(f"DataFrame shape: {df.shape}")
        except Exception as e:
            print(f"Error reading CSV file: {str(e)}")
            return jsonify({'error': f'Failed to read CSV file: {str(e)}'}), 400

        # Check required columns
        missing_cols = [col for col in required_columns if col not in df.columns]
        if missing_cols:
            print(f"Error: Missing required columns: {missing_cols}")
            return jsonify({'error': f'Missing required columns: {missing_cols}'}), 400

        # Extract required columns
        print("Extracting required columns...")
        df_subset = df[required_columns]
        print("Column extraction successful")

        # Create debug visualization
        try:
            print("Creating visualization...")
            plt.figure(figsize=(16, 6))
            plt.plot(df_subset['Flow Packets/s'], color='blue', label='Flow Packets/s')
            plt.title('Debug Visualization')
            plt.xlabel('Index')
            plt.ylabel('Flow Packets/s')
            plt.legend()
            
            debug_plot_path = os.path.join(output_dir, "debug_plot.png")
            plt.savefig(debug_plot_path)
            print(f"Visualization saved to {debug_plot_path}")
        except Exception as e:
            print(f"Error creating visualization: {str(e)}")
            # Continue despite visualization errors

        # Return success with data
        return jsonify({
            'status': 'success',
            'message': 'Debug file upload successful',
            'data': df_subset.to_dict(orient='records'),
            'visualization': '/api/images/debug_plot.png'
        })
    
    except Exception as e:
        print(f"Unexpected error in debug_upload: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': f'Unexpected error: {str(e)}'}), 500

#detection module for 144Features
'''
1. upload the csv
2. remove nan and inf values
3. take the 16 features only and min max
4. find andrew values for 16 as 64 values
5. find the magnitude spectrum and phase spectrum for this
6. combine magnitude spectrum and phase spectrum and 16 values original to a vector 144F
7. apply min max
8. perform the binary predictions
'''
features = ['URG Flag Count', 'CWE Flag Count', 'Fwd PSH Flags', 'RST Flag Count',
            'Inbound', 'Min Packet Length', 'Fwd Packet Length Min', 'Flow Bytes/s',
            'Bwd IAT Total', 'Down/Up Ratio', 'Fwd Packets/s', 'Flow Packets/s',
            'Average Packet Size', 'min_seg_size_forward', 'Fwd Packet Length Mean',
            'Avg Fwd Segment Size']

def andrew_function(arr):
    """
    Applies a sinusoidal transformation to an input array to generate exactly 36 transformed values.

    Args:
    arr: np.ndarray, input array of length 16.

    Returns:
    np.ndarray, the transformed array of length 36.
    """
    if len(arr) != 16:
        raise ValueError("Input array must have a length of 16.")

    t = np.arange(0, 8, 0.125)  
    transformed = np.zeros_like(t, dtype=float)
    for i, value in enumerate(arr):
        transformed += (value / (np.sqrt(2) ** i)) * np.sin((i + 1) * 2 * np.pi * t)

    return transformed

# Function to compute magnitude and phase matrices
def compute_magnitude_phase(matrix):
    fft_matrix = np.fft.fft2(matrix)
    fft_matrix_shifted = np.fft.fftshift(fft_matrix)  # Center low frequencies
    magnitude_matrix = np.abs(fft_matrix_shifted)
    phase_matrix = np.angle(fft_matrix_shifted)
    return magnitude_matrix, phase_matrix

# Function to compute properties (rank, determinant, trace, eigenvalues)
def compute_properties(matrix):
    properties = {}
    properties['rank'] = np.linalg.matrix_rank(matrix)
    try:
        properties['determinant'] = np.linalg.det(matrix)
    except np.linalg.LinAlgError:
        properties['determinant'] = 0
    properties['trace'] = np.trace(matrix)
    eigenvalues = np.abs(np.linalg.eigvals(matrix))
    eigenvalues_sorted = np.pad(np.sort(eigenvalues)[::-1], (0, max(0, 8 - len(eigenvalues))), mode='constant')[:8]
    for i, eigenvalue in enumerate(eigenvalues_sorted):
        properties[f'eigenvalue_{i+1}'] = eigenvalue
    return properties
def process_data(data, output_dir):
    processed_data = []
    os.makedirs(output_dir, exist_ok=True)

    total_rows = data.shape[0]
    
    for index, row in data.iterrows():
        # Get the 16 features and reshape into 4x4 matrix
        features_matrix = row[features].values.reshape(4, 4).astype(float)
        
        # Apply Andrew Function
        flattened_signal = features_matrix.flatten()  # Flatten the 4x4 matrix to size 16
        andrew_signal = andrew_function(flattened_signal)  # Pass the 16-element array
        transformed_matrix = andrew_signal[:64].reshape(8, 8)  
        andrew_values_flat = transformed_matrix.flatten()
        
        # Compute magnitude and phase matrices
        magnitude_matrix, phase_matrix = compute_magnitude_phase(transformed_matrix)
        magnitude_matrix_flat = magnitude_matrix.flatten()
        phase_matrix_flat = phase_matrix.flatten()
        
        # Create row properties dictionary
        row_properties = {
            **{f"original_{i}": v for i, v in enumerate(flattened_signal)},
            **{f"magnitude_{i}": v for i, v in enumerate(magnitude_matrix_flat)},
            **{f"phase_{i}": v for i, v in enumerate(phase_matrix_flat)}
        }
        
        processed_data.append(row_properties)
        
        if (index + 1) % 100 == 0 or index + 1 == total_rows:
            print(f"Processed {index + 1}/{total_rows} rows.")
    
    return pd.DataFrame(processed_data)

# @app.route('/api/upload_detection', methods=['POST'])
# def upload_detection():
#     try:
#         print("Starting detection file upload process...")

#         if 'file' not in request.files:
#             print("Error: No file part in the request")
#             return jsonify({'error': 'No file part'}), 400

#         file = request.files['file']

#         if file.filename == '':
#             print("Error: No selected file")
#             return jsonify({'error': 'No selected file'}), 400

#         # Create output directory if it doesn't exist
#         os.makedirs(output_dir, exist_ok=True)
        
#         # Save uploaded file
#         file_path = os.path.join(output_dir, "detection_upload.csv")
#         file.save(file_path)
#         print(f"File saved to {file_path}")

#         # Read CSV file
#         try:
#             df = pd.read_csv(file_path)
#             print(f"CSV file read successfully. Columns: {df.columns.tolist()}")
#             print(f"DataFrame shape: {df.shape}")
#         except Exception as e:
#             print(f"Error reading CSV file: {str(e)}")
#             return jsonify({'error': f'Failed to read CSV file: {str(e)}'}), 400

#         # Check required columns
#         missing_cols = [col for col in features if col not in df.columns]
#         if missing_cols:
#             print(f"Error: Missing required columns: {missing_cols}")
#             return jsonify({'error': f'Missing required columns: {missing_cols}'}), 400

#         # Extract required columns
#         print("Extracting required columns...")
#         df_subset = df[features].copy()
        
#         # Apply Min-Max scaling to original features
#         print("Applying Min-Max scaling to original features...")
#         scaler = MinMaxScaler()
#         df_scaled = pd.DataFrame(
#             scaler.fit_transform(df_subset),
#             columns=df_subset.columns
#         )
#         print("Min-Max scaling completed")
        
#         # Process the scaled data
#         print("Processing scaled data...")
#         processed_df = process_data(df_scaled, output_dir)
        
#         # Apply Min-Max scaling to processed data
#         print("Applying Min-Max scaling to processed data...")
#         processed_scaler = MinMaxScaler()
#         processed_scaled = pd.DataFrame(
#             processed_scaler.fit_transform(processed_df),
#             columns=processed_df.columns
#         )
#         print("Min-Max scaling of processed data completed")

#         # Make predictions using binary model
#         print("Making predictions...")
        
#         predictions = binary_mm.predict(processed_scaled)
                
      
        
#         # Add predictions to original data
#         df_subset['prediction'] = predictions
#         # df_subset['prediction_probability'] = prediction_probs
        
#         # Save processed data with predictions
#         processed_file_path = os.path.join(output_dir, "processed_detection_data.csv")
#         processed_df.to_csv(processed_file_path, index=False)
#         print(f"Processed data saved to {processed_file_path}")

#         # Save original data with predictions
#         original_with_predictions_path = os.path.join(output_dir, "original_with_predictions.csv")
#         df_subset.to_csv(original_with_predictions_path, index=False)
#         print(f"Original data with predictions saved to {original_with_predictions_path}")

#         # Return success with data
#         return jsonify({
#             'status': 'success',
#             'message': 'Detection file upload and processing successful',
#             'original_data': df_subset.to_dict(orient='records'),
#             'scaled_data': df_scaled.to_dict(orient='records'),
#             'processed_data': processed_df.to_dict(orient='records'),
#             'processed_scaled_data': processed_scaled.to_dict(orient='records'),
#             'predictions': predictions.tolist(),
#             'prediction_probabilities': prediction_probs.tolist(),
#             'processed_file': processed_file_path,
#             'original_with_predictions_file': original_with_predictions_path
#         })
    
#     except Exception as e:
#         print(f"Unexpected error in upload_detection: {str(e)}")
#         traceback.print_exc()
#         return jsonify({'error': f'Unexpected error: {str(e)}'}), 500

if __name__ == "__main__":
    # Open browser after 1 second
    Timer(1, open_browser).start()
    app.run(debug=False, port=5000)
# if __name__ == '__main__':
#     app.run(debug=Tr, port=5000)