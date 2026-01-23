/**
 * Disaster Detail Page
 * Shows full details of a specific disaster
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { disasterAPI } from '../services/api';
import './DisasterDetail.css';

const DisasterDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [disaster, setDisaster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDisasterDetails();
  }, [id]);

  const loadDisasterDetails = async () => {
    try {
      setLoading(true);
      const response = await disasterAPI.getDisaster(id);
      
      if (response.data.success) {
        setDisaster(response.data.data);
      } else {
        setError('Disaster not found');
      }
    } catch (err) {
      console.error('Error loading disaster:', err);
      setError('Failed to load disaster details');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: '#dc2626',
      high: '#f59e0b',
      medium: '#eab308',
      low: '#22c55e'
    };
    return colors[severity] || colors.medium;
  };

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

  const formatNumber = (num) => {
    return num ? num.toLocaleString() : '0';
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Crore`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} Lakh`;
    } else {
      return `₹${amount.toLocaleString()}`;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading disaster details...</p>
      </div>
    );
  }

  if (error || !disaster) {
    return (
      <div className="error-container">
        <h2>⚠️ {error || 'Disaster not found'}</h2>
        <button className="btn-primary" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="disaster-detail">
      <button className="btn-back" onClick={() => navigate(-1)}>
        ← Back
      </button>

      {/* Header */}
      <div className="detail-header" style={{ borderLeftColor: getSeverityColor(disaster.severity) }}>
        <div className="header-icon">{getDisasterIcon(disaster.disaster_type)}</div>
        <div className="header-content">
          <h1>{disaster.title}</h1>
          <div className="header-meta">
            <span className={`badge badge-${disaster.severity}`}>{disaster.severity.toUpperCase()}</span>
            <span className="meta-item">📍 {disaster.location.city}, {disaster.location.state}</span>
            <span className="meta-item">📅 {new Date(disaster.detected_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div className="detail-content">
        {/* Impact Statistics */}
        <div className="detail-section">
          <h2>📊 Impact Assessment</h2>
          <div className="impact-grid">
            {disaster.casualties > 0 && (
              <div className="impact-card">
                <div className="impact-value danger">{formatNumber(disaster.casualties)}</div>
                <div className="impact-label">Casualties</div>
              </div>
            )}
            {disaster.injured > 0 && (
              <div className="impact-card">
                <div className="impact-value warning">{formatNumber(disaster.injured)}</div>
                <div className="impact-label">Injured</div>
              </div>
            )}
            {disaster.displaced > 0 && (
              <div className="impact-card">
                <div className="impact-value info">{formatNumber(disaster.displaced)}</div>
                <div className="impact-label">Displaced</div>
              </div>
            )}
            {disaster.affected_area_km2 && (
              <div className="impact-card">
                <div className="impact-value">{formatNumber(disaster.affected_area_km2)} km²</div>
                <div className="impact-label">Affected Area</div>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="detail-section">
          <h2>📝 Details</h2>
          <p>{disaster.description}</p>
          {disaster.content && (
            <div className="content-box">
              <p>{disaster.content}</p>
            </div>
          )}
        </div>

        {/* Relief Prediction */}
        {disaster.relief_prediction?.predicted && (
          <div className="detail-section">
            <h2>🎯 Relief Requirements (ML Prediction)</h2>
            <div className="confidence-badge">
              Confidence: {(disaster.relief_prediction.confidence_score * 100).toFixed(0)}%
            </div>
            <div className="relief-grid">
              <div className="relief-card">
                <div className="relief-icon">🍽️</div>
                <div className="relief-value">{formatNumber(disaster.relief_prediction.food_packets)}</div>
                <div className="relief-label">Food Packets</div>
              </div>
              <div className="relief-card">
                <div className="relief-icon">💧</div>
                <div className="relief-value">{formatNumber(disaster.relief_prediction.water_liters)} L</div>
                <div className="relief-label">Water</div>
              </div>
              <div className="relief-card">
                <div className="relief-icon">🏥</div>
                <div className="relief-value">{disaster.relief_prediction.medical_teams}</div>
                <div className="relief-label">Medical Teams</div>
              </div>
              <div className="relief-card">
                <div className="relief-icon">🏕️</div>
                <div className="relief-value">{disaster.relief_prediction.temporary_shelters}</div>
                <div className="relief-label">Shelters</div>
              </div>
              <div className="relief-card financial">
                <div className="relief-icon">💰</div>
                <div className="relief-value">{formatCurrency(disaster.relief_prediction.financial_aid_inr)}</div>
                <div className="relief-label">Financial Aid</div>
              </div>
            </div>
          </div>
        )}

        {/* Source */}
        {disaster.source && (
          <div className="detail-section">
            <h2>📰 Source Information</h2>
            <div className="source-info">
              <p><strong>Source:</strong> {disaster.source.type}</p>
              {disaster.source.author && <p><strong>Author:</strong> {disaster.source.author}</p>}
              {disaster.source.url && (
                <p>
                  <strong>URL:</strong> 
                  <a href={disaster.source.url} target="_blank" rel="noopener noreferrer">
                    {disaster.source.url}
                  </a>
                </p>
              )}
              <p><strong>Published:</strong> {new Date(disaster.source.published_at).toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DisasterDetail;












