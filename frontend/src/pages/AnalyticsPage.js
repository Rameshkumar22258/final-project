import React from 'react';
import { FaChartBar, FaChartLine, FaChartPie } from 'react-icons/fa';
import './AnalyticsPage.css';

const AnalyticsPage = () => {
  return (
    <div className="analytics-page">
      <div className="page-header">
        <h1>Historical Analytics</h1>
        <p>Analyze disaster patterns and trends for better preparedness</p>
      </div>

      <div className="analytics-grid">
        {/* Summary Cards */}
        <div className="analytics-summary">
          <div className="summary-card">
            <div className="summary-icon primary">
              <FaChartBar />
            </div>
            <div className="summary-content">
              <div className="summary-value">127</div>
              <div className="summary-label">Total Disasters (2023)</div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon success">
              <FaChartLine />
            </div>
            <div className="summary-content">
              <div className="summary-value">85%</div>
              <div className="summary-label">Prediction Accuracy</div>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon warning">
              <FaChartPie />
            </div>
            <div className="summary-content">
              <div className="summary-value">2.5M</div>
              <div className="summary-label">People Helped</div>
            </div>
          </div>
        </div>

        {/* Disaster Frequency */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Disaster Frequency by Type</h2>
          </div>
          <div className="card-body">
            <div className="chart-placeholder">
              <div className="bar-chart">
                <div className="bar" style={{ height: '75%' }}>
                  <div className="bar-value">45</div>
                  <div className="bar-label">Floods</div>
                </div>
                <div className="bar" style={{ height: '53%' }}>
                  <div className="bar-value">32</div>
                  <div className="bar-label">Cyclones</div>
                </div>
                <div className="bar" style={{ height: '47%' }}>
                  <div className="bar-value">28</div>
                  <div className="bar-label">Earthquakes</div>
                </div>
                <div className="bar" style={{ height: '25%' }}>
                  <div className="bar-value">15</div>
                  <div className="bar-label">Droughts</div>
                </div>
                <div className="bar" style={{ height: '20%' }}>
                  <div className="bar-value">12</div>
                  <div className="bar-label">Wildfires</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Regional Vulnerability */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Regional Vulnerability Index</h2>
          </div>
          <div className="card-body">
            <div className="vulnerability-list">
              <div className="vulnerability-item">
                <div className="region-info">
                  <span className="region-name">Northeast India</span>
                  <span className="vulnerability-score high">High Risk</span>
                </div>
                <div className="vulnerability-bar">
                  <div className="vulnerability-fill high" style={{ width: '85%' }}></div>
                </div>
              </div>

              <div className="vulnerability-item">
                <div className="region-info">
                  <span className="region-name">East Coast</span>
                  <span className="vulnerability-score high">High Risk</span>
                </div>
                <div className="vulnerability-bar">
                  <div className="vulnerability-fill high" style={{ width: '78%' }}></div>
                </div>
              </div>

              <div className="vulnerability-item">
                <div className="region-info">
                  <span className="region-name">West Coast</span>
                  <span className="vulnerability-score medium">Medium Risk</span>
                </div>
                <div className="vulnerability-bar">
                  <div className="vulnerability-fill medium" style={{ width: '60%' }}></div>
                </div>
              </div>

              <div className="vulnerability-item">
                <div className="region-info">
                  <span className="region-name">Central India</span>
                  <span className="vulnerability-score medium">Medium Risk</span>
                </div>
                <div className="vulnerability-bar">
                  <div className="vulnerability-fill medium" style={{ width: '45%' }}></div>
                </div>
              </div>

              <div className="vulnerability-item">
                <div className="region-info">
                  <span className="region-name">North India</span>
                  <span className="vulnerability-score low">Low Risk</span>
                </div>
                <div className="vulnerability-bar">
                  <div className="vulnerability-fill low" style={{ width: '30%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="card insights-card">
          <div className="card-header">
            <h2 className="card-title">AI-Generated Insights</h2>
          </div>
          <div className="card-body">
            <div className="insights-list">
              <div className="insight-item">
                <div className="insight-icon">💡</div>
                <div className="insight-content">
                  <h4>Seasonal Pattern Detected</h4>
                  <p>Flood disasters peak during monsoon season (June-September) with 65% increase in relief demand.</p>
                </div>
              </div>

              <div className="insight-item">
                <div className="insight-icon">📊</div>
                <div className="insight-content">
                  <h4>Regional Vulnerability</h4>
                  <p>Northeast India shows highest vulnerability index due to frequent landslides and earthquakes.</p>
                </div>
              </div>

              <div className="insight-item">
                <div className="insight-icon">⚡</div>
                <div className="insight-content">
                  <h4>Response Time Improvement</h4>
                  <p>Average response time has decreased by 40% using AI-powered early warning systems.</p>
                </div>
              </div>

              <div className="insight-item">
                <div className="insight-icon">🎯</div>
                <div className="insight-content">
                  <h4>Resource Optimization</h4>
                  <p>Medical aid demand increases by 40% during cyclone events compared to other disasters.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seasonal Trends */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Seasonal Trends</h2>
          </div>
          <div className="card-body">
            <div className="seasonal-chart">
              <div className="seasonal-bar">
                <div className="seasonal-month">
                  <div className="month-bar" style={{ height: '20%' }}></div>
                  <div className="month-label">Jan</div>
                </div>
                <div className="seasonal-month">
                  <div className="month-bar" style={{ height: '25%' }}></div>
                  <div className="month-label">Feb</div>
                </div>
                <div className="seasonal-month">
                  <div className="month-bar" style={{ height: '30%' }}></div>
                  <div className="month-label">Mar</div>
                </div>
                <div className="seasonal-month">
                  <div className="month-bar" style={{ height: '35%' }}></div>
                  <div className="month-label">Apr</div>
                </div>
                <div className="seasonal-month">
                  <div className="month-bar" style={{ height: '50%' }}></div>
                  <div className="month-label">May</div>
                </div>
                <div className="seasonal-month">
                  <div className="month-bar" style={{ height: '80%' }}></div>
                  <div className="month-label">Jun</div>
                </div>
                <div className="seasonal-month">
                  <div className="month-bar" style={{ height: '95%' }}></div>
                  <div className="month-label">Jul</div>
                </div>
                <div className="seasonal-month">
                  <div className="month-bar" style={{ height: '85%' }}></div>
                  <div className="month-label">Aug</div>
                </div>
                <div className="seasonal-month">
                  <div className="month-bar" style={{ height: '70%' }}></div>
                  <div className="month-label">Sep</div>
                </div>
                <div className="seasonal-month">
                  <div className="month-bar" style={{ height: '40%' }}></div>
                  <div className="month-label">Oct</div>
                </div>
                <div className="seasonal-month">
                  <div className="month-bar" style={{ height: '25%' }}></div>
                  <div className="month-label">Nov</div>
                </div>
                <div className="seasonal-month">
                  <div className="month-bar" style={{ height: '20%' }}></div>
                  <div className="month-label">Dec</div>
                </div>
              </div>
              <div className="seasonal-legend">
                <span className="legend-label">Disaster Frequency by Month</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;














