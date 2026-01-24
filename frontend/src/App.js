import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Components
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import PredictionPage from './pages/PredictionPage';
import ReliefPredictionPage from './pages/ReliefPredictionPage';
import MonitoringPage from './pages/MonitoringPage';
import AnalyticsPageWithTrends from './pages/AnalyticsPageWithTrends';
import DynamicMapView from './pages/DynamicMapView';
import DisasterDetail from './pages/DisasterDetail';

// API Service
import api from './services/api';
import { DataModeProvider } from './context/DataModeContext';

function App() {
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check API health on mount
    checkAPIHealth();
  }, []);

  const checkAPIHealth = async () => {
    try {
      const response = await api.get('/health');
      setSystemStatus(response.data);
      setLoading(false);
    } catch (error) {
      // Suppress error logging - handled by interceptor
      setSystemStatus({ status: 'ERROR' });
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Initializing Disaster Relief AI...</p>
      </div>
    );
  }

  return (
    <DataModeProvider>
      <Router>
        <div className="App">
          <Navbar systemStatus={systemStatus} />
          
          <div className="app-container">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/disaster/:id" element={<DisasterDetail />} />
            <Route path="/prediction" element={<PredictionPage />} />
            <Route path="/relief-predict" element={<ReliefPredictionPage />} />
            <Route path="/monitoring" element={<MonitoringPage />} />
            <Route path="/analytics" element={<AnalyticsPageWithTrends />} />
            <Route path="/historical-trends" element={<Navigate to="/analytics" replace />} />
            <Route path="/map" element={<DynamicMapView />} />
          </Routes>
          </div>
        </div>
      </Router>
    </DataModeProvider>
  );
}

export default App;


