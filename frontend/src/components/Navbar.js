import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaShieldAlt, FaBrain, FaChartLine, FaSatelliteDish, FaMapMarkedAlt, FaChartBar, FaHistory } from 'react-icons/fa';
import { useDataMode } from '../context/DataModeContext';
import './Navbar.css';

const Navbar = ({ systemStatus }) => {
  const location = useLocation();
  const { dataMode, toggleDataMode } = useDataMode();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <FaShieldAlt className="logo-icon" />
          <span>AIDisasterRelief</span>
        </Link>

        <ul className="navbar-menu">
          <li className="nav-item">
            <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
              <FaBrain />
              <span>Dashboard</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/relief-predict" className={`nav-link ${isActive('/relief-predict')}`}>
              <FaChartLine />
              <span>Relief Prediction</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/monitoring" className={`nav-link ${isActive('/monitoring')}`}>
              <FaSatelliteDish />
              <span>Monitoring</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/map" className={`nav-link ${isActive('/map')}`}>
              <FaMapMarkedAlt />
              <span>Map View</span>
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/analytics" className={`nav-link ${isActive('/analytics') || isActive('/historical-trends') ? 'active' : ''}`}>
              <FaChartBar />
              <span>Historical Trends</span>
            </Link>
          </li>
        </ul>

        <div className="navbar-status">
          <div className="data-mode-toggle">
            <span className={`toggle-label ${dataMode === 'live' ? 'active' : ''}`}>Live</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={dataMode === 'sample'}
                onChange={toggleDataMode}
              />
              <span className="toggle-slider"></span>
            </label>
            <span className={`toggle-label ${dataMode === 'sample' ? 'active' : ''}`}>Sample</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;


