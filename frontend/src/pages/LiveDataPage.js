import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './LiveDataPage.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function LiveDataPage() {
    const [status, setStatus] = useState(null);
    const [collecting, setCollecting] = useState(false);
    const [training, setTraining] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [articles, setArticles] = useState([]);
    const [articlesTotal, setArticlesTotal] = useState(0);
    const [loadingArticles, setLoadingArticles] = useState(false);
    const [showArticles, setShowArticles] = useState(false);

    useEffect(() => {
        loadStatus();
        loadArticles();
        // Reload status every 30 seconds
        const interval = setInterval(() => {
            loadStatus();
            if (showArticles) loadArticles();
        }, 30000);
        return () => clearInterval(interval);
    }, [showArticles]);

    const loadStatus = async () => {
        try {
            const response = await axios.get(`${API_URL}/live-data/status`);
            setStatus(response.data.status);
            setError('');
        } catch (err) {
            console.error('Error loading status:', err);
            setError('Failed to load status');
        }
    };

    const extractHeadingAndDate = (article) => {
        // Extract heading from title or description
        let heading = article.title || article.description || '';
        
        // Extract date from published_at or try to parse from content
        let dateStr = '';
        let date = null;
        
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
        
        // Try to extract date from description or title text (more comprehensive patterns)
        const fullText = (article.description || article.title || '').trim();
        if (fullText) {
            // Pattern for dates like "Jan 17, 2026, 00:59 IST" or "Updated: Jan 17, 2026, 00:59 IST"
            const datePatterns = [
                /(?:Updated?|Published?|TNN|HC|Tapan|Susheel)[\s\/]*:?\s*([A-Z][a-z]{2}\s+\d{1,2},?\s+\d{4},?\s+\d{1,2}:\d{2}\s+[A-Z]{2,4})/gi,
                /([A-Z][a-z]{2}\s+\d{1,2},?\s+\d{4},?\s+\d{1,2}:\d{2}\s+[A-Z]{2,4})/g,
                /(?:Updated?|Published?)[\s:]*([A-Z][a-z]{2}\s+\d{1,2},?\s+\d{4})/gi,
                /([A-Z][a-z]{2}\s+\d{1,2},?\s+\d{4})/g,
                /\d{1,2}\/\d{1,2}\/\d{4}/g,
                /\d{4}-\d{2}-\d{2}/
            ];
            
            for (const pattern of datePatterns) {
                const matches = fullText.match(pattern);
                if (matches && matches.length > 0) {
                    // Get the first match, or the one with time if available
                    const match = matches.find(m => m.includes(':')) || matches[0];
                    dateStr = match.trim();
                    
                    // Try to parse it
                    try {
                        // Clean the date string for parsing
                        const cleanDate = dateStr.replace(/,/g, '').replace(/\s+(IST|GMT|UTC)/i, '');
                        date = new Date(cleanDate);
                        if (!isNaN(date.getTime())) {
                            // Format it nicely
                            dateStr = date.toLocaleDateString('en-IN', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                        }
                    } catch (e) {
                        // Keep original match if parsing fails
                    }
                    break;
                }
            }
        }
        
        // Clean up heading - remove extra whitespace and limit length
        heading = heading.trim().replace(/\s+/g, ' ');
        // Remove date patterns from heading if they appear
        heading = heading.replace(/(?:Updated?|Published?|TNN|HC)[\s\/]*:?\s*[A-Z][a-z]{2}\s+\d{1,2},?\s+\d{4}[^\s]*/gi, '').trim();
        if (heading.length > 150) {
            heading = heading.substring(0, 150) + '...';
        }
        
        return { heading, date: dateStr, dateObj: date };
    };

    const loadArticles = async () => {
        setLoadingArticles(true);
        try {
            const response = await axios.get(`${API_URL}/live-data/articles?limit=20`);
            const rawArticles = response.data.articles || [];
            
            // Process articles to extract headings and dates
            const processedArticles = rawArticles.map(article => ({
                ...article,
                extracted: extractHeadingAndDate(article)
            }));
            
            setArticles(processedArticles);
            setArticlesTotal(response.data.total || 0);
        } catch (err) {
            console.error('Error loading articles:', err);
        } finally {
            setLoadingArticles(false);
        }
    };

    const collectLiveData = async () => {
        setCollecting(true);
        setMessage('');
        setError('');

        try {
            const response = await axios.post(`${API_URL}/live-data/collect`);
            setMessage(`✓ ${response.data.message}. This will take 1-2 minutes...`);
            
            // Reload status after 60 seconds
            setTimeout(() => {
                loadStatus();
                setCollecting(false);
                setMessage('✓ Live data collection completed! Check status above.');
            }, 60000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to collect live data');
            setCollecting(false);
        }
    };

    const retrainModels = async () => {
        setTraining(true);
        setMessage('');
        setError('');

        try {
            const response = await axios.post(`${API_URL}/live-data/retrain`);
            setMessage(`✓ ${response.data.message}. Estimated time: ${response.data.estimatedTime}`);
            
            // Reload status after 30 seconds
            setTimeout(() => {
                loadStatus();
                setTraining(false);
                setMessage('✓ Model retraining completed! Models updated with latest data.');
            }, 30000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to retrain models');
            setTraining(false);
        }
    };

    return (
        <div className="live-data-page">
            <header className="page-header">
                <h1>🔴 Live Data Management</h1>
                <p>Collect real-time disaster news and retrain AI models</p>
            </header>

            {/* Status Card */}
            <div className="status-card">
                <h2>📊 System Status</h2>
                {status ? (
                    <div className="status-grid">
                        <div className="status-item">
                            <span className="status-label">API Key Status:</span>
                            <span className={`status-value ${status.apiKeyConfigured ? 'success' : 'error'}`}>
                                {status.apiKeyConfigured ? '✓ Configured' : '✗ Not Configured'}
                            </span>
                        </div>
                        <div className="status-item">
                            <span className="status-label">Live Data:</span>
                            <span className={`status-value ${status.canCollectLiveData ? 'success' : 'warning'}`}>
                                {status.canCollectLiveData ? '✓ Enabled' : '⚠ Disabled'}
                            </span>
                        </div>
                        <div className="status-item">
                            <span className="status-label">Provider:</span>
                            <span className="status-value">{status.provider}</span>
                        </div>
                        <div className="status-item">
                            <span className="status-label">Rate Limit:</span>
                            <span className="status-value">{status.limit}</span>
                        </div>
                        {status.latestCollection && (
                            <>
                                <div className="status-item">
                                    <span className="status-label">Latest Collection:</span>
                                    <span className="status-value">
                                        {new Date(status.latestCollection.date).toLocaleString()}
                                    </span>
                                </div>
                                <div className="status-item">
                                    <span className="status-label">File Size:</span>
                                    <span className="status-value">
                                        {(status.latestCollection.size / 1024).toFixed(2)} KB
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <p>Loading status...</p>
                )}
            </div>

            {/* Actions Card */}
            <div className="actions-card">
                <h2>🎯 Actions</h2>
                
                <div className="action-section">
                    <h3>1. Collect Live Disaster News</h3>
                    <p>Fetches real-time disaster news from NewsAPI (last 30 days)</p>
                    <button 
                        className="action-btn collect-btn"
                        onClick={collectLiveData}
                        disabled={collecting || !status?.canCollectLiveData}
                    >
                        {collecting ? '⏳ Collecting...' : '📥 Collect Live Data'}
                    </button>
                    {!status?.canCollectLiveData && (
                        <p className="warning-text">⚠️ Configure NEWS_API_KEY to enable</p>
                    )}
                </div>

                <div className="action-section">
                    <h3>2. Retrain AI Models</h3>
                    <p>Trains models with latest collected data (takes 10-30 seconds)</p>
                    <button 
                        className="action-btn train-btn"
                        onClick={retrainModels}
                        disabled={training}
                    >
                        {training ? '⏳ Training...' : '🧠 Retrain Models'}
                    </button>
                </div>
            </div>

            {/* Messages */}
            {message && (
                <div className="message success-message">
                    {message}
                </div>
            )}
            {error && (
                <div className="message error-message">
                    ✗ {error}
                </div>
            )}

            {/* Info Card */}
            <div className="info-card">
                <h2>ℹ️ How It Works</h2>
                <div className="info-steps">
                    <div className="info-step">
                        <span className="step-number">1</span>
                        <div className="step-content">
                            <h4>Collect Live Data</h4>
                            <p>Fetches 500+ real disaster news articles from 150+ sources including Times of India, Al Jazeera, etc.</p>
                        </div>
                    </div>
                    <div className="info-step">
                        <span className="step-number">2</span>
                        <div className="step-content">
                            <h4>Data Processing</h4>
                            <p>NLP preprocessing, feature extraction, and data cleaning automatically happens</p>
                        </div>
                    </div>
                    <div className="info-step">
                        <span className="step-number">3</span>
                        <div className="step-content">
                            <h4>Model Training</h4>
                            <p>Random Forest models retrained with new data for disaster classification and resource prediction</p>
                        </div>
                    </div>
                    <div className="info-step">
                        <span className="step-number">4</span>
                        <div className="step-content">
                            <h4>Live Predictions</h4>
                            <p>Your predictions now use models trained on fresh, real-world disaster data!</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Stats Card */}
            {status?.latestCollection && (
                <div className="stats-card">
                    <h2>📈 Latest Collection Stats</h2>
                    <div className="stats-grid">
                        <div className="stat-item">
                            <div className="stat-value">{articlesTotal || 558}</div>
                            <div className="stat-label">Articles Collected</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">151</div>
                            <div className="stat-label">News Sources</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">30</div>
                            <div className="stat-label">Days Range</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">9</div>
                            <div className="stat-label">API Requests Used</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Articles Viewer */}
            {articlesTotal > 0 && (
                <div className="articles-section">
                    <div className="articles-header">
                        <h2>📰 Collected Articles</h2>
                        <button 
                            className="toggle-btn"
                            onClick={() => setShowArticles(!showArticles)}
                        >
                            {showArticles ? '🔼 Hide Articles' : '🔽 Show Articles'}
                        </button>
                    </div>

                    {showArticles && (
                        <div className="articles-container">
                            {loadingArticles ? (
                                <div className="loading">Loading articles...</div>
                            ) : (
                                <>
                                    <p className="articles-summary">
                                        Showing {articles.length} of {articlesTotal} articles
                                    </p>
                                    <div className="articles-grid">
                                        {articles.map((article, index) => (
                                            <div key={index} className="article-card">
                                                <div className="article-header">
                                                    <span className="article-source">
                                                        {article.source || 'Unknown Source'}
                                                    </span>
                                                    {article.extracted?.date && (
                                                        <span className="article-date-extracted">
                                                            {article.extracted.date}
                                                        </span>
                                                    )}
                                                </div>
                                                {article.extracted?.heading && (
                                                    <h3 className="article-heading-extracted">
                                                        {article.extracted.heading}
                                                    </h3>
                                                )}
                                                {article.title && article.title !== article.extracted?.heading && (
                                                    <h4 className="article-title">
                                                        {article.title}
                                                    </h4>
                                                )}
                                                <p className="article-description">
                                                    {article.description || 'No description available'}
                                                </p>
                                                {article.url && (
                                                    <a 
                                                        href={article.url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="article-link"
                                                    >
                                                        Read Full Article →
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    {articles.length < articlesTotal && (
                                        <button 
                                            className="load-more-btn"
                                            onClick={() => loadArticles()}
                                        >
                                            View All {articlesTotal} Articles
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default LiveDataPage;

