import React from 'react';
import Plot from 'react-plotly.js';

const EmergencyAlertsPlot = ({ df, datasetName }) => {
  // Identify emergency alert indices
  const emergencyIndices = df
    .map((row, index) => row.emergency_alert === 1 ? index : -1)
    .filter(index => index !== -1);

  // First emergency alert
  const firstAlertIndex = emergencyIndices.length > 0 ? emergencyIndices[0] : null;
  const firstAlertTime = firstAlertIndex !== null ? df[firstAlertIndex].Seconds : null;
  const firstAlertValue = firstAlertIndex !== null ? df[firstAlertIndex]['Flow Packets/s'] : null;

  // Create data for the plot
  const trafficFlowData = {
    x: df.map(row => row.Seconds),
    y: df.map(row => row['Flow Packets/s']), 
    type: 'scatter',
    mode: 'lines',
    name: 'Traffic Flow',
    line: { color: '#00B8D9', width: 2 }
  };

  const classData = {
    x: df.map(row => row.Seconds),
    y: df.map(row => row['Flow Packets/s']),
    type: 'scatter',
    mode: 'markers',
    name: 'Classes',
    marker: { color: '#3B82F6', size: 2, opacity: 0.5 },
  };

  const emergencyAlertData = {
    x: emergencyIndices.map(index => df[index].Seconds),
    y: emergencyIndices.map(index => df[index]['Flow Packets/s']),
    type: 'scatter',
    mode: 'markers',
    name: 'Emergency Alerts',
    marker: { color: '#FFB020', size: 10, symbol: 'star' },
  };

  const firstAlertData = firstAlertIndex !== null ? {
    x: [firstAlertTime],
    y: [firstAlertValue],
    type: 'scatter',
    mode: 'markers',
    name: 'First Alert',
    marker: { color: '#00B8D9', size: 16, symbol: 'x-thin', line: { width: 3, color: '#00B8D9' } },
  } : {};

  // Plot Layout
  const layout = {
    title: {
      text: `Flow Packets/s vs Seconds with Emergency Alerts (${datasetName})`,
      font: { family: 'Inter, Montserrat, ui-sans-serif, system-ui', size: 20, color: '#F4F5F7', weight: 'bold' }
    },
    paper_bgcolor: '#181A20',
    plot_bgcolor: '#181A20',
    font: { family: 'Inter, Montserrat, ui-sans-serif, system-ui', color: '#F4F5F7', size: 14 },
    xaxis: {
      title: { text: 'Seconds', font: { family: 'Inter, Montserrat, ui-sans-serif, system-ui', color: '#F4F5F7', size: 16 } },
      gridcolor: 'rgba(35,38,47,0.08)',
      zeroline: false,
      tickcolor: '#F4F5F7',
      linecolor: '#23262F',
      tickfont: { color: '#F4F5F7', family: 'Inter, Montserrat, ui-sans-serif, system-ui' },
    },
    yaxis: {
      title: { text: 'Flow Packets/s', font: { family: 'Inter, Montserrat, ui-sans-serif, system-ui', color: '#F4F5F7', size: 16 } },
      gridcolor: 'rgba(35,38,47,0.08)',
      zeroline: false,
      tickcolor: '#F4F5F7',
      linecolor: '#23262F',
      tickfont: { color: '#F4F5F7', family: 'Inter, Montserrat, ui-sans-serif, system-ui' },
    },
    legend: {
      bgcolor: 'rgba(24,26,32,0.8)',
      bordercolor: '#23262F',
      font: { color: '#F4F5F7', family: 'Inter, Montserrat, ui-sans-serif, system-ui', size: 13 }
    },
    showlegend: true,
    margin: { t: 60, l: 60, r: 30, b: 60 },
  };

  return (
    <div className="bg-surface rounded-lg shadow-card p-6 mb-8 font-sans">
      <Plot
        data={[
          trafficFlowData,
          classData,
          emergencyAlertData,
          firstAlertData,
        ]}
        layout={layout}
        useResizeHandler
        style={{ width: '100%', height: '100%' }}
        config={{ displayModeBar: false }}
      />
    </div>
  );
};

export default EmergencyAlertsPlot;
