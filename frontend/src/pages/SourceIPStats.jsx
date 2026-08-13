import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AgGridReact } from '@ag-grid-community/react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import '@ag-grid-community/styles/ag-grid.css';
import '@ag-grid-community/styles/ag-theme-alpine.css';

const SourceIPStats = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/api/source-ip-stats');
        setStats(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching source IP stats:', err);
        setError('Failed to load source IP statistics');
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const columnDefs = [
    { field: 'source_ip', headerName: 'Source IP', sortable: true, filter: true, width: 200 },
    { field: 'low_count', headerName: 'Low Count', sortable: true, filter: true, width: 150 },
    { field: 'medium_count', headerName: 'Medium Count', sortable: true, filter: true, width: 150 },
    { field: 'high_count', headerName: 'High Count', sortable: true, filter: true, width: 150 }
  ];

  const defaultColDef = {
    flex: 1,
    minWidth: 100,
    resizable: true,
    cellStyle: { textAlign: 'center', fontFamily: 'Inter, Montserrat, ui-sans-serif, system-ui', color: '#F4F5F7', background: '#23262F' }
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-extrabold tracking-widest uppercase text-primary drop-shadow-neon">
            Source IP Statistics
          </h1>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger text-danger px-4 py-3 mb-8 font-semibold">
            Error: {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="bg-surface border border-border shadow-card p-8">
            <div className="ag-theme-alpine dark-ag-grid" style={{ height: '600px', width: '100%' }}>
              <AgGridReact
                rowData={stats}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                modules={[ClientSideRowModelModule]}
                pagination={true}
                paginationPageSize={20}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SourceIPStats; 