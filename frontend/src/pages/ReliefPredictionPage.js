/**
 * Relief Prediction Page
 * Core feature: Predict relief requirements with high accuracy
 */

import React, { useState, useEffect } from 'react';
import { disasterAPI } from '../services/api';
import './ReliefPredictionPage.css';

const ReliefPredictionPage = () => {
  const [formData, setFormData] = useState({
    disaster_type: 'flood',
    disaster_subtype: '', // Sub-type varies by disaster type
    location: {
      city: '',
      state: '',
    },
    severity: 'medium',
    affected_population: '',
    affected_area_km2: '',
    exposure_ratio: '', // Auto-calculated if blank
    disruption_duration: '', // Auto-calculated if blank
    terrain: '', // coastal, hilly, urban, rural
    admin_capacity: null // Optional district capacity limits
  });

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recentPredictions, setRecentPredictions] = useState([]);
  const [calculationProgress, setCalculationProgress] = useState(null);
  const [showCumulative, setShowCumulative] = useState(false);

  // Preset disaster scenarios - Top 6
  const presetScenarios = [
    {
      name: 'Cyclone Hudhud (2014)',
      disaster_type: 'cyclone',
      disaster_subtype: 'super',
      location: { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
      severity: 'critical',
      affected_population: 222000,
      affected_area_km2: 800
    },
    {
      name: '2015 Chennai Floods',
      disaster_type: 'flood',
      disaster_subtype: 'urban',
      location: { city: 'Chennai', state: 'Tamil Nadu' },
      severity: 'critical',
      affected_population: 1716000,
      affected_area_km2: 1200
    },
    {
      name: '2018 Kerala Floods',
      disaster_type: 'flood',
      disaster_subtype: 'riverine',
      location: { city: 'Kochi', state: 'Kerala' },
      severity: 'critical',
      affected_population: 5000000,
      affected_area_km2: 2000
    },
    {
      name: 'Cyclone Fani (2019)',
      disaster_type: 'cyclone',
      disaster_subtype: 'super',
      location: { city: 'Bhubaneswar', state: 'Odisha' },
      severity: 'critical',
      affected_population: 1470000,
      affected_area_km2: 1500
    },
    {
      name: 'Cyclone Amphan (2020)',
      disaster_type: 'cyclone',
      disaster_subtype: 'super',
      location: { city: 'Kolkata', state: 'West Bengal' },
      severity: 'critical',
      affected_population: 813000,
      affected_area_km2: 1000
    },
    {
      name: '2013 Uttarakhand Floods',
      disaster_type: 'flood',
      location: { city: 'Uttarkashi', state: 'Uttarakhand' },
      severity: 'critical',
      affected_population: 100000,
      affected_area_km2: 200
    }
  ];

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ];

  useEffect(() => {
    loadRecentPredictions();
  }, []);

  const loadRecentPredictions = () => {
    // Load from localStorage for now
    const stored = localStorage.getItem('recentPredictions');
    if (stored) {
      setRecentPredictions(JSON.parse(stored));
    }
  };

  const saveToRecent = (pred) => {
    const recent = [pred, ...recentPredictions].slice(0, 3);
    setRecentPredictions(recent);
    localStorage.setItem('recentPredictions', JSON.stringify(recent));
  };

  const loadPreset = (scenario) => {
    setFormData({
      disaster_type: scenario.disaster_type,
      disaster_subtype: scenario.disaster_subtype || '',
      location: scenario.location,
      severity: scenario.severity,
      affected_population: scenario.affected_population.toString(),
      affected_area_km2: scenario.affected_area_km2.toString(),
      exposure_ratio: '',
      disruption_duration: '',
      terrain: '',
      admin_capacity: null
    });
    setPrediction(null);
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'city' || name === 'state') {
      setFormData({
        ...formData,
        location: {
          ...formData.location,
          [name]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCalculationProgress({ currentStep: 0, totalSteps: 8 });

    try {
      // Format data for API
      const apiData = {
        disaster_type: formData.disaster_type,
        disaster_subtype: formData.disaster_subtype || null,
        location: formData.location,
        severity: formData.severity,
        affected_population: parseInt(formData.affected_population) || 2500,
        affected_area_km2: parseInt(formData.affected_area_km2) || 50,
        exposure_ratio: formData.exposure_ratio ? parseFloat(formData.exposure_ratio) : null,
        disruption_duration: formData.disruption_duration ? parseFloat(formData.disruption_duration) : null,
        terrain: formData.terrain || null,
        admin_capacity: formData.admin_capacity || null
      };

      // Simulate calculation steps with delays and detailed info
      const steps = [
        { 
          text: 'Calculating exposure ratio...', 
          detail: `Based on ${formData.severity} severity level`,
          value: formData.exposure_ratio ? `${(parseFloat(formData.exposure_ratio) * 100).toFixed(1)}%` : 'Auto-calculating...'
        },
        { 
          text: 'Determining directly exposed population...', 
          detail: `From ${formatNumber(parseInt(formData.affected_population) || 2500)} total affected`,
          value: 'Calculating...'
        },
        { 
          text: 'Calculating disruption duration...', 
          detail: `Based on ${formData.severity} severity`,
          value: formData.disruption_duration ? `${formData.disruption_duration} days` : 'Auto-calculating...'
        },
        { 
          text: 'Determining base requirements...', 
          detail: `For ${formData.disaster_type} disaster type`,
          value: 'Loading requirements...'
        },
        { 
          text: 'Applying sub-type modifiers...', 
          detail: formData.disaster_subtype ? `${formData.disaster_subtype} sub-type` : 'Standard modifiers',
          value: 'Applying...'
        },
        { 
          text: 'Calculating raw demand...', 
          detail: 'Before capacity constraints',
          value: 'Computing...'
        },
        { 
          text: 'Applying capacity constraints...', 
          detail: 'District-level limits',
          value: 'Bounding...'
        },
        { 
          text: 'Generating final predictions...', 
          detail: 'Finalizing results',
          value: 'Almost done...'
        }
      ];

      for (let i = 0; i < steps.length; i++) {
        setCalculationProgress({ 
          currentStep: i + 1, 
          totalSteps: steps.length,
          currentStepText: steps[i].text,
          currentStepDetail: steps[i].detail,
          currentStepValue: steps[i].value
        });
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const response = await disasterAPI.predictRelief(apiData);
      
      if (response.data.success) {
        const pred = {
          ...response.data.prediction,
          input: formData,
          timestamp: new Date().toISOString()
        };
        setPrediction(pred);
        saveToRecent(pred);
        setError(null);
      } else {
        setError('Prediction failed: ' + (response.data.error || 'Unknown error'));
      }
    } catch (err) {
      // Suppress detailed error logging for connection errors (handled by interceptor)
      if (err.code === 'ERR_NETWORK' || err.message?.includes('ERR_CONNECTION_REFUSED')) {
        setError('Backend server not running. Please start the backend server on port 5000.');
      } else {
        const errorMsg = err.response?.data?.message || err.message || 'Failed to generate prediction';
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
      setCalculationProgress(null);
    }
  };

  const formatNumber = (num) => {
    return num ? num.toLocaleString() : '0';
  };

  const formatCurrency = (amount) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Crore`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} Lakh`;
    } else {
      return `₹${amount.toLocaleString()}`;
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

  const getConfidenceLevel = (score) => {
    if (score >= 0.85) return { text: 'Very High', color: '#22c55e' };
    if (score >= 0.70) return { text: 'High', color: '#84cc16' };
    if (score >= 0.50) return { text: 'Medium', color: '#eab308' };
    return { text: 'Low', color: '#f59e0b' };
  };

  return (
    <div className="relief-prediction-page">
      <div className="prediction-header">
        <div>
          <h1>Relief Prediction Engine</h1>
          <p>Predict relief requirements with high accuracy using ML models and geographic similarity</p>
        </div>
      </div>

      <div className="prediction-container">
        {/* Left Side: Sample Disasters */}
        <div className="presets-section">
          <div className="presets-card">
            <h3>Quick Start - Sample Scenarios</h3>
            <div className="presets-grid">
              {presetScenarios.map((scenario, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="preset-btn"
                  onClick={() => loadPreset(scenario)}
                  title={`${scenario.name} - ${scenario.affected_population.toLocaleString()} affected`}
                >
                  <span className="preset-name">{scenario.name}</span>
                  <span className="preset-details">
                    {scenario.location.city} • {scenario.affected_population.toLocaleString()} people
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Disaster Details Form */}
        <div className="prediction-form-section">

          <div className="form-card">
            <h2 style={{ marginBottom: '1.5rem' }}>Disaster Details</h2>
            <form onSubmit={handleSubmit} className="compact-form">
              {/* Row 1: Disaster Type, Sub-Type, Severity */}
              <div className="form-row-horizontal">
                <div className="form-group-compact">
                  <label htmlFor="disaster_type">
                    <span className="label-text">Disaster Type</span>
                    <span className="label-required">*</span>
                  </label>
                  <select
                    id="disaster_type"
                    name="disaster_type"
                    value={formData.disaster_type}
                    onChange={handleInputChange}
                    required
                    className="form-input-compact"
                  >
                    <option value="flood">Flood</option>
                    <option value="earthquake">Earthquake</option>
                    <option value="cyclone">Cyclone</option>
                    <option value="landslide">Landslide</option>
                    <option value="wildfire">Wildfire</option>
                    <option value="drought">Drought</option>
                    <option value="tsunami">Tsunami</option>
                    <option value="avalanche">Avalanche</option>
                  </select>
                </div>

                <div className="form-group-compact">
                  <label htmlFor="disaster_subtype">
                    <span className="label-text">Sub-Type</span>
                  </label>
                  <select
                    id="disaster_subtype"
                    name="disaster_subtype"
                    value={formData.disaster_subtype}
                    onChange={handleInputChange}
                    className="form-input-compact"
                  >
                    {formData.disaster_type === 'flood' && (
                      <>
                        <option value="">Select type</option>
                        <option value="urban">Urban</option>
                        <option value="riverine">Riverine</option>
                        <option value="flash">Flash</option>
                        <option value="coastal">Coastal</option>
                      </>
                    )}
                    {formData.disaster_type === 'earthquake' && (
                      <>
                        <option value="">Select type</option>
                        <option value="shallow">Shallow</option>
                        <option value="deep">Deep</option>
                        <option value="tectonic">Tectonic</option>
                        <option value="volcanic">Volcanic</option>
                      </>
                    )}
                    {formData.disaster_type === 'cyclone' && (
                      <>
                        <option value="">Select type</option>
                        <option value="tropical">Tropical</option>
                        <option value="extratropical">Extratropical</option>
                        <option value="super">Super</option>
                        <option value="depression">Depression</option>
                      </>
                    )}
                    {formData.disaster_type === 'landslide' && (
                      <>
                        <option value="">Select type</option>
                        <option value="rockfall">Rockfall</option>
                        <option value="mudslide">Mudslide</option>
                        <option value="debris_flow">Debris Flow</option>
                        <option value="rotational">Rotational</option>
                      </>
                    )}
                    {formData.disaster_type === 'wildfire' && (
                      <>
                        <option value="">Select type</option>
                        <option value="forest">Forest</option>
                        <option value="grassland">Grassland</option>
                        <option value="urban">Urban</option>
                        <option value="interface">Interface</option>
                      </>
                    )}
                    {formData.disaster_type === 'drought' && (
                      <>
                        <option value="">Select type</option>
                        <option value="meteorological">Meteorological</option>
                        <option value="agricultural">Agricultural</option>
                        <option value="hydrological">Hydrological</option>
                        <option value="socioeconomic">Socioeconomic</option>
                      </>
                    )}
                    {formData.disaster_type === 'tsunami' && (
                      <>
                        <option value="">Select type</option>
                        <option value="tectonic">Tectonic</option>
                        <option value="volcanic">Volcanic</option>
                        <option value="landslide_triggered">Landslide</option>
                        <option value="meteorite">Meteorite</option>
                      </>
                    )}
                    {formData.disaster_type === 'avalanche' && (
                      <>
                        <option value="">Select type</option>
                        <option value="slab">Slab</option>
                        <option value="powder">Powder</option>
                        <option value="wet">Wet</option>
                        <option value="icefall">Icefall</option>
                      </>
                    )}
                    {!['flood', 'earthquake', 'cyclone', 'landslide', 'wildfire', 'drought', 'tsunami', 'avalanche'].includes(formData.disaster_type) && (
                      <option value="">N/A</option>
                    )}
                  </select>
                </div>

                <div className="form-group-compact">
                  <label htmlFor="severity">
                    <span className="label-text">Severity</span>
                    <span className="label-required">*</span>
                  </label>
                  <select
                    id="severity"
                    name="severity"
                    value={formData.severity}
                    onChange={handleInputChange}
                    required
                    className="form-input-compact"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Location - City and State */}
              <div className="form-row-horizontal form-row-location">
                <div className="form-group-compact">
                  <label htmlFor="city">
                    <span className="label-text">City/District</span>
                    <span className="label-required">*</span>
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.location.city}
                    onChange={handleInputChange}
                    placeholder="Mumbai"
                    required
                    className="form-input-compact"
                  />
                </div>

                <div className="form-group-compact">
                  <label htmlFor="state">
                    <span className="label-text">State</span>
                    <span className="label-required">*</span>
                  </label>
                  <select
                    id="state"
                    name="state"
                    value={formData.location.state}
                    onChange={handleInputChange}
                    required
                    className="form-input-compact"
                  >
                    <option value="">Select State</option>
                    {indianStates.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Affected Population and Area */}
              <div className="form-row-horizontal form-row-population">
                <div className="form-group-compact">
                  <label htmlFor="affected_population">
                    <span className="label-text">Affected Population</span>
                  </label>
                  <input
                    type="number"
                    id="affected_population"
                    name="affected_population"
                    value={formData.affected_population}
                    onChange={handleInputChange}
                    placeholder="5000"
                    min="0"
                    className="form-input-compact"
                  />
                </div>

                <div className="form-group-compact">
                  <label htmlFor="affected_area_km2">
                    <span className="label-text">Area (km²)</span>
                  </label>
                  <input
                    type="number"
                    id="affected_area_km2"
                    name="affected_area_km2"
                    value={formData.affected_area_km2}
                    onChange={handleInputChange}
                    placeholder="50"
                    min="0"
                    className="form-input-compact"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn-predict"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Calculating...
                  </>
                ) : (
                  <>
                    Generate Relief Prediction
                  </>
                )}
              </button>

              {error && (
                <div className="error-message backend-error">
                  <div className="error-icon">⚠</div>
                  <div className="error-content">
                    <div className="error-title">{error}</div>
                    {error.includes('Backend server not running') && (
                      <div className="error-help">
                        <strong>To fix this:</strong>
                        <ol>
                          <li>Open a new terminal window</li>
                          <li>Run: <code>cd backend && npm start</code></li>
                          <li>Wait for: <code>Server running on port 5000</code></li>
                          <li>Refresh this page</li>
                        </ol>
                        <p className="error-tip">Or double-click <code>START_BACKEND.bat</code> in the project folder</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Calculation Loading Screen */}
        {loading && calculationProgress && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(4px)'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2.5rem',
              maxWidth: '600px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              animation: 'fadeIn 0.3s ease'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  border: '6px solid #e2e8f0',
                  borderTop: '6px solid #3b82f6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 1.5rem'
                }}></div>
                <h2 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', fontSize: '1.75rem' }}>
                  Calculating Relief Requirements
                </h2>
                <p style={{ margin: 0, color: '#64748b', fontSize: '1rem' }}>
                  Step {calculationProgress.currentStep} of {calculationProgress.totalSteps}
                </p>
              </div>

              <div style={{
                background: '#f8fafc',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  fontWeight: '600',
                  color: '#1e293b',
                  fontSize: '1.125rem',
                  marginBottom: '0.5rem'
                }}>
                  {calculationProgress.currentStepText}
                </div>
                {calculationProgress.currentStepDetail && (
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#64748b',
                    marginBottom: '0.75rem'
                  }}>
                    {calculationProgress.currentStepDetail}
                  </div>
                )}
                {calculationProgress.currentStepValue && (
                  <div style={{
                    fontSize: '1rem',
                    color: '#3b82f6',
                    fontWeight: '600',
                    padding: '0.5rem',
                    background: '#e0e7ff',
                    borderRadius: '6px',
                    display: 'inline-block'
                  }}>
                    {calculationProgress.currentStepValue}
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div style={{
                width: '100%',
                height: '8px',
                background: '#e2e8f0',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(calculationProgress.currentStep / calculationProgress.totalSteps) * 100}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                  transition: 'width 0.3s ease',
                  borderRadius: '4px'
                }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Prediction Results - Full Width Row Below */}
        {prediction && (
          <div className="prediction-results-fullwidth">
            <div className="results-card">
              <div className="results-header">
                <h2>Relief Requirements</h2>
                <div className="confidence-badge" style={{ 
                  background: `${getConfidenceLevel(prediction.confidence_score).color}20`,
                  color: getConfidenceLevel(prediction.confidence_score).color
                }}>
                  <span className="confidence-label">Confidence:</span>
                  <span className="confidence-value">
                    {(prediction.confidence_score * 100).toFixed(0)}% 
                    ({getConfidenceLevel(prediction.confidence_score).text})
                  </span>
                </div>
              </div>

              {/* Key Metrics - Horizontal Row */}
              <div className="results-row-horizontal">
                <div className="result-card-horizontal">
                  <div className="result-icon-horizontal">Food</div>
                  <div className="result-content-horizontal">
                    <div className="result-label-horizontal">Food Packets</div>
                    <div className="result-value-horizontal">{formatNumber(prediction.food_packets)}</div>
                    {prediction.food_packets_per_day && (
                      <div className="result-note-horizontal">
                        {formatNumber(prediction.food_packets_per_day)}/day
                      </div>
                    )}
                  </div>
                </div>

                <div className="result-card-horizontal">
                  <div className="result-icon-horizontal">Water</div>
                  <div className="result-content-horizontal">
                    <div className="result-label-horizontal">Water (Liters)</div>
                    <div className="result-value-horizontal">{formatNumber(prediction.water_liters)}</div>
                    {prediction.water_liters_per_day && (
                      <div className="result-note-horizontal">
                        {formatNumber(prediction.water_liters_per_day)}L/day
                      </div>
                    )}
                  </div>
                </div>

                <div className="result-card-horizontal">
                  <div className="result-icon-horizontal">Medical</div>
                  <div className="result-content-horizontal">
                    <div className="result-label-horizontal">Medical Teams</div>
                    <div className="result-value-horizontal">{formatNumber(prediction.medical_teams)}</div>
                    <div className="result-note-horizontal">Teams</div>
                  </div>
                </div>

                <div className="result-card-horizontal">
                  <div className="result-icon-horizontal">Rescue</div>
                  <div className="result-content-horizontal">
                    <div className="result-label-horizontal">Rescue Personnel</div>
                    <div className="result-value-horizontal">{formatNumber(prediction.rescue_personnel)}</div>
                    <div className="result-note-horizontal">Personnel</div>
                  </div>
                </div>

                <div className="result-card-horizontal">
                  <div className="result-icon-horizontal">Shelter</div>
                  <div className="result-content-horizontal">
                    <div className="result-label-horizontal">Shelters</div>
                    <div className="result-value-horizontal">{formatNumber(prediction.temporary_shelters)}</div>
                    <div className="result-note-horizontal">Camps</div>
                  </div>
                </div>

                <div className="result-card-horizontal">
                  <div className="result-icon-horizontal">Financial</div>
                  <div className="result-content-horizontal">
                    <div className="result-label-horizontal">Financial Aid</div>
                    <div className="result-value-horizontal">{formatCurrency(prediction.financial_aid_inr)}</div>
                    <div className="result-note-horizontal">INR</div>
                  </div>
                </div>
              </div>

              {/* Cumulative Relief Button */}
              {((prediction.per_day_breakdown && prediction.per_day_breakdown.length > 0) || (prediction.daily_breakdown && prediction.daily_breakdown.length > 0)) && (
                <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                  <button
                    onClick={() => setShowCumulative(!showCumulative)}
                    style={{
                      padding: '0.875rem 2rem',
                      background: showCumulative ? '#3b82f6' : '#e2e8f0',
                      color: showCumulative ? 'white' : '#475569',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '1rem',
                      transition: 'all 0.2s',
                      boxShadow: showCumulative ? '0 4px 6px rgba(59, 130, 246, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
                      fontFamily: 'Arial, sans-serif'
                    }}
                  >
                    {showCumulative ? 'Hide Day-Wise Breakdown' : 'View Cumulative Relief (Day-Wise)'}
                  </button>
                </div>
              )}

              {/* Per-Day Breakdown - Shown when button clicked */}
              {showCumulative && (prediction.per_day_breakdown || prediction.daily_breakdown) && (prediction.per_day_breakdown || prediction.daily_breakdown).length > 0 && (
                <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px solid #e2e8f0' }}>
                  <h3 style={{ marginBottom: '1rem', color: '#1e293b', fontSize: '1.25rem', fontWeight: '600' }}>Day-Wise Breakdown</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ 
                      width: '100%', 
                      borderCollapse: 'collapse', 
                      background: 'white', 
                      borderRadius: '8px', 
                      overflow: 'hidden', 
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
                    }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9' }}>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#475569', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>Day</th>
                          <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#475569', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>Food/Day</th>
                          <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#475569', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>Water/Day (L)</th>
                          <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#475569', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>Cumulative Food</th>
                          <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#475569', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>Cumulative Water</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(prediction.per_day_breakdown || prediction.daily_breakdown).map((day, idx) => (
                          <tr key={idx} style={{ borderTop: '1px solid #e2e8f0', background: idx % 2 === 0 ? 'white' : '#f8fafc' }}>
                            <td style={{ padding: '0.75rem', fontWeight: '600', color: '#1e293b', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>Day {day.day}</td>
                            <td style={{ padding: '0.75rem', textAlign: 'right', color: '#475569', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>{formatNumber(day.food_packets_daily || day.food_packets)}</td>
                            <td style={{ padding: '0.75rem', textAlign: 'right', color: '#475569', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>{formatNumber(day.water_liters_daily || day.water_liters)}</td>
                            <td style={{ padding: '0.75rem', textAlign: 'right', color: '#3b82f6', fontWeight: '600', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>{formatNumber(day.cumulative_food)}</td>
                            <td style={{ padding: '0.75rem', textAlign: 'right', color: '#3b82f6', fontWeight: '600', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif' }}>{formatNumber(day.cumulative_water)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReliefPredictionPage;

