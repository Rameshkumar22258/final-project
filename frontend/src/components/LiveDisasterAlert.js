/**
 * LiveDisasterAlert Component
 * Displays the most recent disaster as an alert banner on the homepage
 * Auto-refreshes every 5 minutes
 */

import React, { useState, useEffect } from 'react';
import './LiveDisasterAlert.css';

const LiveDisasterAlert = ({ autoRefresh = 300000 }) => {
  const [disaster, setDisaster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeAgo, setTimeAgo] = useState('');

  // Fetch latest disaster
  const fetchLatestDisaster = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/disasters/latest');
      const data = await response.json();

      if (data.success && data.data) {
        setDisaster(data.data);
        setError(null);
      } else {
        setError('No active disasters found');
        setDisaster(null);
      }
    } catch (err) {
      // Suppress error logging for connection errors (handled by API interceptor)
      if (err.message?.includes('Failed to fetch') || err.message?.includes('ERR_CONNECTION_REFUSED')) {
        setError(null); // Don't show error, just hide the alert
        setDisaster(null);
      } else {
        console.error('Error fetching latest disaster:', err);
        setError('Failed to load disaster data');
        setDisaster(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate time ago
  const calculateTimeAgo = () => {
    if (!disaster || !disaster.detected_at) return '';

    const now = new Date();
    const detected = new Date(disaster.detected_at);
    const diffMs = now - detected;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffHours >= 24) {
      const days = Math.floor(diffHours / 24);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMins > 0) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchLatestDisaster();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh > 0) {
      const interval = setInterval(fetchLatestDisaster, autoRefresh);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Update time ago every minute
  useEffect(() => {
    if (disaster) {
      setTimeAgo(calculateTimeAgo());
      const interval = setInterval(() => {
        setTimeAgo(calculateTimeAgo());
      }, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [disaster]);

  // Get severity class
  const getSeverityClass = (severity) => {
    switch (severity) {
      case 'critical':
        return 'alert-critical';
      case 'high':
        return 'alert-high';
      case 'medium':
        return 'alert-medium';
      case 'low':
        return 'alert-low';
      default:
        return 'alert-medium';
    }
  };

  // Get disaster type icon
  const getDisasterIcon = (type) => {
    const icons = {
      flood: '🌊',
      earthquake: '🏚️',
      cyclone: '🌀',
      landslide: '⛰️',
      wildfire: '🔥',
      drought: '☀️',
      tsunami: '🌊',
      avalanche: '❄️'
    };
    return icons[type] || '⚠️';
  };

  if (loading) {
    return (
      <div className="live-alert-container">
        <div className="live-alert alert-medium">
          <div className="alert-content">
            <span>Loading latest disaster information...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !disaster) {
    return (
      <div className="live-alert-container">
        <div className="live-alert alert-safe">
          <div className="alert-content">
            <span className="alert-icon">✅</span>
            <div className="alert-text">
              <strong>No Active Disasters</strong>
              <p>All regions are currently safe. Monitoring continues.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="live-alert-container">
      <div className={`live-alert ${getSeverityClass(disaster.severity)}`}>
        <div className="alert-badge">
          <span className="pulse-dot"></span>
          LIVE
        </div>

        <div className="alert-content">
          <span className="alert-icon">{getDisasterIcon(disaster.disaster_type)}</span>
          
          <div className="alert-text">
            <div className="alert-header">
              <strong className="alert-title">{disaster.title}</strong>
              <span className="alert-severity-badge">{disaster.severity.toUpperCase()}</span>
            </div>
            
            <p className="alert-description">
              {disaster.location.city}, {disaster.location.state} • {timeAgo}
              {disaster.displaced && ` • ${disaster.displaced.toLocaleString()} displaced`}
              {disaster.casualties && disaster.casualties > 0 && ` • ${disaster.casualties} casualties`}
            </p>
          </div>

          <button 
            className="alert-action-btn"
            onClick={() => window.location.href = `/disaster/${disaster.disaster_id}`}
          >
            View Details →
          </button>
        </div>

        <button 
          className="alert-refresh-btn"
          onClick={fetchLatestDisaster}
          title="Refresh"
        >
          🔄
        </button>
      </div>
    </div>
  );
};

export default LiveDisasterAlert;












