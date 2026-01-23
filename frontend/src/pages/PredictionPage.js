import React, { useState } from 'react';
import { FaBrain, FaExclamationTriangle } from 'react-icons/fa';
import { disasterAPI } from '../services/api';
import './PredictionPage.css';

const PredictionPage = () => {
  const [formData, setFormData] = useState({
    disasterType: '',
    region: '',
    populationDensity: '',
    severity: '',
    historicalEvents: 0
  });

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await disasterAPI.predict(formData);
      setPrediction(response.data.prediction);
      setLoading(false);
    } catch (err) {
      setError('Failed to generate prediction. Please try again.');
      setLoading(false);
      console.error('Prediction error:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      disasterType: '',
      region: '',
      populationDensity: '',
      severity: '',
      historicalEvents: 0
    });
    setPrediction(null);
    setError(null);
  };

  return (
    <div className="prediction-page">
      <div className="page-header">
        <h1>AI Relief Demand Prediction</h1>
        <p>Generate accurate relief demand forecasts using AI-powered analysis</p>
      </div>

      <div className="prediction-container">
        {/* Prediction Form */}
        <div className="card prediction-form-card">
          <div className="card-header">
            <h2 className="card-title">Disaster Scenario Input</h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} className="prediction-form">
              <div className="form-group">
                <label className="form-label">Disaster Type *</label>
                <select
                  name="disasterType"
                  value={formData.disasterType}
                  onChange={handleChange}
                  className="form-control"
                  required
                >
                  <option value="">Select Disaster Type</option>
                  <option value="flood">Flood</option>
                  <option value="cyclone">Cyclone/Hurricane</option>
                  <option value="earthquake">Earthquake</option>
                  <option value="drought">Drought</option>
                  <option value="wildfire">Wildfire</option>
                  <option value="landslide">Landslide</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Affected Region *</label>
                <select
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  className="form-control"
                  required
                >
                  <option value="">Select Region</option>
                  <option value="north">North India</option>
                  <option value="south">South India</option>
                  <option value="east">East India</option>
                  <option value="west">West India</option>
                  <option value="northeast">Northeast India</option>
                  <option value="central">Central India</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Population Density *</label>
                <select
                  name="populationDensity"
                  value={formData.populationDensity}
                  onChange={handleChange}
                  className="form-control"
                  required
                >
                  <option value="">Select Population Density</option>
                  <option value="low">Low (&lt; 100/km²)</option>
                  <option value="medium">Medium (100-500/km²)</option>
                  <option value="high">High (&gt; 500/km²)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Severity Level *</label>
                <select
                  name="severity"
                  value={formData.severity}
                  onChange={handleChange}
                  className="form-control"
                  required
                >
                  <option value="">Select Severity</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Historical Similar Events</label>
                <input
                  type="number"
                  name="historicalEvents"
                  value={formData.historicalEvents}
                  onChange={handleChange}
                  className="form-control"
                  min="0"
                  max="10"
                  placeholder="Number of similar past events"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <FaBrain />
                  {loading ? 'Generating...' : 'Generate AI Prediction'}
                </button>
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  Reset
                </button>
              </div>

              {error && (
                <div className="alert alert-danger">
                  <FaExclamationTriangle />
                  {error}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Prediction Results */}
        {prediction && (
          <div className="card prediction-results-card fade-in">
            <div className="card-header">
              <h2 className="card-title">AI-Generated Relief Demand Forecast</h2>
              <span className="confidence-badge">
                Confidence: {prediction.confidence}%
              </span>
            </div>
            <div className="card-body">
              {/* Summary */}
              <div className="prediction-summary">
                <div className="summary-item">
                  <span className="summary-label">Disaster Type</span>
                  <span className="summary-value">{prediction.disasterType?.toUpperCase()}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Region</span>
                  <span className="summary-value">{prediction.location}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Urgency Level</span>
                  <span className={`urgency-badge ${prediction.urgency?.toLowerCase()}`}>
                    {prediction.urgency}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Estimated Affected</span>
                  <span className="summary-value">
                    {prediction.estimatedAffected?.toLocaleString()} people
                  </span>
                </div>
              </div>

              {/* Resource Requirements */}
              <div className="resource-requirements">
                <h3>Predicted Relief Requirements</h3>
                <div className="requirements-grid">
                  <div className="requirement-card">
                    <div className="requirement-icon">🍚</div>
                    <div className="requirement-content">
                      <div className="requirement-label">Food</div>
                      <div className="requirement-value">
                        {prediction.predictedDemand?.food?.toLocaleString()} tons
                      </div>
                    </div>
                  </div>

                  <div className="requirement-card">
                    <div className="requirement-icon">💧</div>
                    <div className="requirement-content">
                      <div className="requirement-label">Water</div>
                      <div className="requirement-value">
                        {prediction.predictedDemand?.water?.toLocaleString()} liters
                      </div>
                    </div>
                  </div>

                  <div className="requirement-card">
                    <div className="requirement-icon">💊</div>
                    <div className="requirement-content">
                      <div className="requirement-label">Medical Aid</div>
                      <div className="requirement-value">
                        {prediction.predictedDemand?.medical?.toLocaleString()} people
                      </div>
                    </div>
                  </div>

                  <div className="requirement-card">
                    <div className="requirement-icon">🏠</div>
                    <div className="requirement-content">
                      <div className="requirement-label">Shelter</div>
                      <div className="requirement-value">
                        {prediction.predictedDemand?.shelter?.toLocaleString()} families
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Recommendations */}
              {prediction.recommendations && prediction.recommendations.length > 0 && (
                <div className="ai-recommendations">
                  <h3>AI Recommendations</h3>
                  <ul className="recommendations-list">
                    {prediction.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="prediction-footer">
                <p>
                  <strong>Note:</strong> These predictions are AI-generated estimates. 
                  Please validate with field assessment teams before resource deployment.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionPage;

