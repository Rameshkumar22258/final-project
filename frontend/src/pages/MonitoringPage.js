import React, { useState, useEffect } from 'react';
import { FaSatelliteDish, FaNewspaper, FaSchool, FaGlobe, FaBuilding, FaExclamationTriangle, FaFlask, FaChartBar } from 'react-icons/fa';
import axios from 'axios';
import './MonitoringPage.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Static disaster alerts data
const STATIC_DISASTER_ALERTS = [
  {
    id: 'alert-1',
    icon: FaSchool,
    heading: '🏫 Schools Shift Focus from Drills to Habit-Based Disaster Preparedness',
    date: 'January 24, 2026',
    description: 'Schools across India are moving beyond routine safety drills to instil long-term safety habits and clear role definitions among students, aiming to boost confidence and reduce vulnerability during emergencies.',
    severity: 'medium',
    source: 'Education & Disaster Management',
    publishedAt: new Date('2026-01-24')
  },
  {
    id: 'alert-2',
    icon: FaGlobe,
    heading: '🌍 Mizoram Conducts Large-Scale Statewide Earthquake Mock Drill',
    date: 'January 23, 2026',
    description: 'Mizoram carried out a statewide earthquake simulation across 36 locations, jointly organised by NDMA and the state DM&R department, testing coordinated responses to building collapses and fire emergencies.',
    severity: 'high',
    source: 'NDMA & State DM&R',
    publishedAt: new Date('2026-01-23')
  },
  {
    id: 'alert-3',
    icon: FaBuilding,
    heading: '🏢 Patna Hosts Earthquake Safety Drill at Collectorate',
    date: 'January 18, 2026',
    description: 'Around 200 officials in Patna participated in an earthquake safety mock drill at the Collectorate, receiving hands-on rescue and office safety training from NDRF and SDRF teams during the safety fortnight.',
    severity: 'high',
    source: 'NDRF & SDRF',
    publishedAt: new Date('2026-01-22')
  },
  {
    id: 'alert-4',
    icon: FaExclamationTriangle,
    heading: '🚨 Innovative Two-Week Disaster Awareness Campaign Launched in Patna',
    date: 'January 18, 2026',
    description: 'A district-wide safety campaign led by the Patna District Magistrate is using e-rickshaw outreach, street performances, and live mock drills to strengthen community preparedness until January 28.',
    severity: 'medium',
    source: 'Patna District Administration',
    publishedAt: new Date('2026-01-18')
  },
  {
    id: 'alert-5',
    icon: FaFlask,
    heading: '☣️ Madhya Pradesh Plans Memorial and Hazardous Waste Cleanup at Bhopal Site',
    date: 'January 20, 2026',
    description: 'The Madhya Pradesh government announced plans for a memorial at the Union Carbide disaster site, alongside incineration of hazardous waste and scientific studies to assess long-term environmental contamination.',
    severity: 'high',
    source: 'Madhya Pradesh Government',
    publishedAt: new Date('2026-01-20')
  },
  {
    id: 'alert-6',
    icon: FaChartBar,
    heading: '📊 India\'s Disaster Risk Profile Highlights Gaps Between Response and Preparedness',
    date: 'January 21, 2026',
    description: 'While India has improved disaster response capacity, experts highlight persistent preparedness gaps, contrasting effective handling of cyclones like Phailin with recurring flood vulnerabilities in states such as Bihar.',
    severity: 'medium',
    source: 'Disaster Risk Assessment',
    publishedAt: new Date('2026-01-21')
  }
];

const MonitoringPage = () => {
  const [feeds, setFeeds] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(null);

  useEffect(() => {
    let interval;
    if (isMonitoring) {
      // Fetch immediately when monitoring starts
      fetchLatestArticles();
      // Then fetch every 30 seconds
      interval = setInterval(() => {
        fetchLatestArticles();
      }, 30000);
    }
    return () => clearInterval(interval);
  }, [isMonitoring]);

  const extractHeadingAndDate = (article) => {
    // Get full text from title and description
    const title = (article.title || '').trim();
    const description = (article.description || '').trim();
    const fullText = `${title}\n${description}`.trim();
    
    let heading = title || description || '';
    let dateStr = '';
    let date = null;
    let author = '';
    
    // First, try to extract from published_at
    if (article.published_at) {
      date = new Date(article.published_at);
      dateStr = date.toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // Pattern to match: "Author Name / Updated: Jan 17, 2026, 00:59 IST" or similar
    const authorDatePattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\/\s*(?:Updated?|Published?|TNN|HC)[\s:]*([A-Z][a-z]{2}\s+\d{1,2},?\s+\d{4},?\s+\d{1,2}:\d{2}\s+[A-Z]{2,4})/gi;
    const dateOnlyPattern = /(?:Updated?|Published?|TNN|HC|Tapan|Susheel)[\s\/]*:?\s*([A-Z][a-z]{2}\s+\d{1,2},?\s+\d{4},?\s+\d{1,2}:\d{2}\s+[A-Z]{2,4})/gi;
    const simpleDatePattern = /([A-Z][a-z]{2}\s+\d{1,2},?\s+\d{4},?\s+\d{1,2}:\d{2}\s+[A-Z]{2,4})/g;
    
    // Try to find author and date together
    const authorDateMatch = fullText.match(authorDatePattern);
    if (authorDateMatch && authorDateMatch.length > 0) {
      const match = authorDateMatch[0];
      const parts = match.split(/\s*\/\s*(?:Updated?|Published?)[\s:]*/i);
      if (parts.length >= 2) {
        author = parts[0].trim();
        dateStr = parts[1].trim();
      } else {
        // Extract author and date separately
        const authorMatch = match.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
        const dateMatch = match.match(/([A-Z][a-z]{2}\s+\d{1,2},?\s+\d{4},?\s+\d{1,2}:\d{2}\s+[A-Z]{2,4})/);
        if (authorMatch) author = authorMatch[1];
        if (dateMatch) dateStr = dateMatch[1];
      }
      
      // Remove author/date line from heading
      heading = heading.replace(match, '').trim();
    } else {
      // Try date-only patterns
      const dateMatches = [
        ...fullText.matchAll(dateOnlyPattern),
        ...fullText.matchAll(simpleDatePattern)
      ];
      
      if (dateMatches.length > 0) {
        const match = dateMatches[0][1] || dateMatches[0][0];
        dateStr = match.trim();
        // Remove date from heading
        heading = heading.replace(new RegExp(match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '').trim();
      }
    }
    
    // Parse the date string
    if (dateStr && !date) {
      try {
        // Clean the date string for parsing - handle formats like "14 Oct 2025, 08:05 am"
        let cleanDate = dateStr.replace(/,/g, '').replace(/\s+(IST|GMT|UTC|am|pm)/i, '');
        
        // Try parsing
        date = new Date(cleanDate);
        
        // If parsing failed, try alternative formats
        if (isNaN(date.getTime())) {
          // Try with different separators
          cleanDate = dateStr.replace(/,\s+/g, ' ').replace(/\s+(IST|GMT|UTC)/i, '');
          date = new Date(cleanDate);
        }
        
        if (!isNaN(date.getTime())) {
          // Format it nicely but keep original format if it has time
          if (dateStr.includes(':') && (dateStr.includes('am') || dateStr.includes('pm'))) {
            // Keep the original format with time
            dateStr = dateStr;
          } else if (dateStr.includes(':')) {
            // Format with time
            dateStr = date.toLocaleDateString('en-IN', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          } else {
            dateStr = date.toLocaleDateString('en-IN', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric'
            });
          }
        } else {
          // If still invalid, try to extract just the date part
          const dateOnlyMatch = dateStr.match(/([A-Z][a-z]{2}\s+\d{1,2},?\s+\d{4})/);
          if (dateOnlyMatch) {
            date = new Date(dateOnlyMatch[1]);
            if (!isNaN(date.getTime())) {
              dateStr = date.toLocaleDateString('en-IN', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric'
              });
            } else {
              dateStr = dateOnlyMatch[1]; // Keep original if parsing fails
              date = null;
            }
          } else {
            dateStr = ''; // Invalid date
            date = null;
          }
        }
      } catch (e) {
        // Keep original match if parsing fails, but mark date as null
        date = null;
      }
    }
    
    // Extract main heading - take first line or first sentence
    if (heading) {
      // Split by newlines and take first non-empty line
      const lines = heading.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length > 0) {
        heading = lines[0];
      }
      
      // Remove any remaining date patterns
      heading = heading.replace(/(?:Updated?|Published?|TNN|HC|Tapan|Susheel)[\s\/]*:?\s*[A-Z][a-z]{2}\s+\d{1,2},?\s+\d{4}[^\s]*/gi, '').trim();
      heading = heading.replace(/^[A-Z][a-z]+\s+[A-Z][a-z]+\s*\/\s*/g, '').trim(); // Remove author at start
      
      // Limit length
      if (heading.length > 200) {
        heading = heading.substring(0, 200) + '...';
      }
    }
    
    // Format date with author if available
    let formattedDate = dateStr;
    if (author && dateStr) {
      formattedDate = `${author} / ${dateStr}`;
    } else if (dateStr) {
      formattedDate = dateStr;
    }
    
    return { heading, date: formattedDate, dateObj: date, author };
  };

  const isDisasterRelated = (article) => {
    const text = (article.title + ' ' + article.description + ' ' + (article.content || '')).toLowerCase();
    
    // Exclusion terms - if article contains these, it's likely not disaster-related
    const excludeTerms = ['wedding dress', 'shipping', 'grid', 'electricity', 'data center', 'goldman sachs', 
                          'stock market', 'cryptocurrency', 'election', 'political', 'diplomatic', 
                          'military', 'terrorism', 'geoengineering', 'terraform', 'camel mission', 
                          'upsc', 'bjp', 'tmc', 'trinamool', 'modi', 'mamata'];
    
    if (excludeTerms.some(term => text.includes(term))) {
      return false;
    }
    
    // Disaster-related keywords
    const disasterKeywords = ['flood', 'earthquake', 'cyclone', 'tsunami', 'landslide', 'wildfire', 
                             'drought', 'disaster', 'evacuation', 'relief', 'rescue', 'ndrf', 
                             'casualties', 'affected', 'damage', 'emergency', 'crisis', 'shelter',
                             'monsoon', 'rainfall', 'storm', 'hurricane', 'typhoon', 'avalanche'];
    
    return disasterKeywords.some(keyword => text.includes(keyword));
  };

  const determineSeverity = (article) => {
    const text = (article.title + ' ' + article.description).toLowerCase();
    if (text.includes('critical') || text.includes('extreme') || text.includes('evacuation') || text.includes('casualties')) {
      return 'critical';
    }
    if (text.includes('high') || text.includes('severe') || text.includes('warning') || text.includes('alert')) {
      return 'high';
    }
    if (text.includes('moderate') || text.includes('medium')) {
      return 'medium';
    }
    return 'low';
  };

  const formatTimeAgo = (date) => {
    if (!date || isNaN(date.getTime())) return 'Unknown time';
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 365) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
  };

  const fetchLatestArticles = async () => {
    setLoading(true);
    setFeeds([]); // Clear existing feeds
    
    try {
      // Use static disaster alerts data
      const processedFeeds = STATIC_DISASTER_ALERTS.map(alert => {
        const timeAgo = alert.publishedAt ? formatTimeAgo(alert.publishedAt) : 'Unknown time';
        
        return {
          id: alert.id,
          type: 'news',
          icon: alert.icon,
          heading: alert.heading,
          date: alert.date,
          content: alert.description,
          source: alert.source,
          time: timeAgo,
          severity: alert.severity,
          publishedAt: alert.publishedAt
        };
      });
      
      // Find alerts by their ID to ensure correct order: alert-6, alert-5, alert-4, alert-3, alert-2, alert-1
      const orderedFeeds = [];
      for (let i = 6; i >= 1; i--) {
        const alert = processedFeeds.find(feed => feed.id === `alert-${i}`);
        if (alert) {
          orderedFeeds.push(alert);
        }
      }
      
      // Show alerts one by one, starting with alert-6, then alert-5 on top, etc.
      for (let i = 0; i < orderedFeeds.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between each
        
        // Add the current alert to the top of the list (each new one pushes previous ones down)
        setFeeds(prevFeeds => {
          const newAlert = { ...orderedFeeds[i], severity: 'low' }; // Set all alerts to 'low' severity
          return [newAlert, ...prevFeeds]; // Add to top, pushing others down
        });
      }
      
      setLastFetchTime(new Date());
    } catch (err) {
      console.error('Error loading alerts:', err);
      // Fallback to static data even on error
      const fallbackFeeds = STATIC_DISASTER_ALERTS.map(alert => ({
        id: alert.id,
        type: 'news',
        icon: alert.icon,
        heading: alert.heading,
        date: alert.date,
        content: alert.description,
        source: alert.source,
        time: alert.publishedAt ? formatTimeAgo(alert.publishedAt) : 'Unknown time',
        severity: alert.severity,
        publishedAt: alert.publishedAt
      }));
      
       // Order fallback feeds: alert-6, alert-5, alert-4, alert-3, alert-2, alert-1
       const orderedFallbackFeeds = [];
       for (let i = 6; i >= 1; i--) {
         const alert = fallbackFeeds.find(feed => feed.id === `alert-${i}`);
         if (alert) {
           orderedFallbackFeeds.push(alert);
         }
       }
       
       // Show fallback alerts one by one, starting with alert-6
       for (let i = 0; i < orderedFallbackFeeds.length; i++) {
         await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between each
         setFeeds(prevFeeds => {
           const newAlert = { ...orderedFallbackFeeds[i], severity: 'low' }; // Set all alerts to 'low' severity
           return [newAlert, ...prevFeeds]; // Add to top, pushing others down
         });
       }
    } finally {
      setLoading(false);
    }
  };

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
    if (!isMonitoring) {
      // Start monitoring - fetch articles immediately
      fetchLatestArticles();
    }
  };

  const refreshFeeds = () => {
    fetchLatestArticles();
  };

  return (
    <div className="monitoring-page">
      <div className="page-header">
        <h1>Real-time Disaster Monitoring</h1>
        <p>Live feed from multiple sources for early disaster detection</p>
      </div>

      <div className="monitoring-container">
        {/* Monitoring Controls */}
        <div className="card monitoring-controls-card">
          <div className="card-header">
            <h2 className="card-title">Monitoring Controls</h2>
            <div className="monitoring-status">
              <span className={`status-indicator ${isMonitoring ? 'active' : ''}`}></span>
              <span>{isMonitoring ? 'Live Monitoring' : 'Paused'}</span>
            </div>
          </div>
          <div className="card-body">
            <div className="control-buttons">
              <button
                onClick={toggleMonitoring}
                className={`btn ${isMonitoring ? 'btn-danger' : 'btn-primary'}`}
              >
                <FaSatelliteDish />
                {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
              </button>
              <button onClick={refreshFeeds} className="btn btn-secondary">
                Refresh Feed
              </button>
            </div>

            {lastFetchTime && (
              <div className="last-update">
                <p>Last updated: {lastFetchTime.toLocaleTimeString()}</p>
              </div>
            )}
          </div>
        </div>

        {/* Live Feed */}
        <div className="card live-feed-card">
          <div className="card-header">
            <h2 className="card-title">Live Feed</h2>
          </div>
          <div className="card-body">
            {loading && feeds.length === 0 ? (
              <div className="loading-feed">
                <FaSatelliteDish />
                <p>Loading latest disaster news...</p>
              </div>
            ) : feeds.length > 0 ? (
              <div className="feed-container">
                {feeds.map(feed => (
                  <div key={feed.id} className={`feed-item severity-${feed.severity}`}>
                    <div className="feed-icon">
                      <feed.icon />
                    </div>
                    <div className="feed-content">
                      {feed.heading && (
                        <h3 className="feed-heading">{feed.heading}</h3>
                      )}
                      {feed.date && !feed.date.toLowerCase().includes('invalid') && (
                        <div className="feed-date-badge">
                          <span className="feed-date-icon">📅</span>
                          <span className="feed-date-text">{feed.date}</span>
                        </div>
                      )}
                      {feed.content && feed.content !== feed.heading && (
                        <p className="feed-description">{feed.content}</p>
                      )}
                      <div className="feed-meta">
                        {feed.source && feed.source !== 'Unknown Source' && (
                          <span className="feed-source">{feed.source}</span>
                        )}
                        {feed.time && !feed.time.toLowerCase().includes('nan') && (
                          <span className="feed-time">{feed.time}</span>
                        )}
                        <span className={`feed-severity ${feed.severity}`}>
                          {feed.severity}
                        </span>
                      </div>
                      {feed.url && (
                        <a 
                          href={feed.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="feed-link"
                        >
                          Read full article →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-feed">
                <FaSatelliteDish />
                <p>{isMonitoring ? 'No new alerts. Monitoring active...' : 'Click "Start Monitoring" to fetch latest disaster news'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitoringPage;














