/**
 * Express Backend Server for Disaster Relief AI
 * Provides REST API for disaster prediction and data management
 */

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// ES Module dirname alternative
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Import routes
import liveDisastersRouter from './routes/liveDisasters.js';
import reliefPredictionRouter from './routes/reliefPrediction.js';

// Import auto news collector
import autoNewsCollector from './utils/autoNewsCollector.js';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rate limiting (relaxed for development)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000 // limit each IP to 1000 requests per windowMs (increased for dev)
});
// Only apply to specific routes, not all API
app.use('/api/live-data/', limiter);

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/disaster_relief_ai';

let isMongoConnected = false;

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 3000, // Timeout after 3s instead of 30s
    socketTimeoutMS: 3000,
}).then(() => {
    console.log('✓ MongoDB connected successfully');
    isMongoConnected = true;
}).catch(err => {
    console.log('✗ MongoDB connection error:', err.message);
    console.log('⚠️  Running in IN-MEMORY MODE (data will not persist)');
    isMongoConnected = false;
});

// In-memory storage fallback
const inMemoryStorage = {
    disasters: [],
    tweets: [],
    predictions: [],
    resources: [],
    analytics: {
        totalDisasters: 0,
        activePredictions: 0,
        resourcesAllocated: 0,
        peopleHelped: 0
    }
};

// ============================================================================
// SCHEMAS & MODELS (Using imported models instead)
// ============================================================================

// Create simple schemas for old API compatibility
const TweetSchema = new mongoose.Schema({
    tweetId: { type: String, unique: true },
    content: String,
    cleanedText: String,
    location: String,
    disasterType: [String],
    resourceNeeds: [String],
    urgency: String,
    engagementScore: Number,
    processed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const PredictionSchema = new mongoose.Schema({
    disasterType: String,
    location: String,
    severity: String,
    populationDensity: String,
    peopleAffected: Number,
    predictedResources: {
        food: Number,
        water: Number,
        medical: Number,
        shelter: Number
    },
    confidence: Number,
    recommendations: [String],
    requestedAt: { type: Date, default: Date.now }
});

const Tweet = mongoose.model('Tweet', TweetSchema);
const Prediction = mongoose.model('Prediction', PredictionSchema);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get sample disaster data for demo purposes
 */
function getSampleDisasters() {
    return [
        {
            disasterId: 'DIS_2024_001',
            disasterType: 'flood',
            location: 'Maharashtra, India',
            severity: 'high',
            peopleAffected: 15000,
            date: new Date('2024-08-15'),
            status: 'active',
            predictedDemand: { food: 45000, water: 75000, medical: 3000, shelter: 3000 },
            actualDemand: { food: 42000, water: 71000, medical: 2800, shelter: 2900 },
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            disasterId: 'DIS_2024_002',
            disasterType: 'cyclone',
            location: 'Odisha, India',
            severity: 'critical',
            peopleAffected: 25000,
            date: new Date('2024-09-01'),
            status: 'active',
            predictedDemand: { food: 75000, water: 125000, medical: 5000, shelter: 5000 },
            actualDemand: { food: 73000, water: 122000, medical: 4900, shelter: 4800 },
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            disasterId: 'DIS_2024_003',
            disasterType: 'earthquake',
            location: 'Uttarakhand, India',
            severity: 'medium',
            peopleAffected: 8000,
            date: new Date('2024-09-10'),
            status: 'active',
            predictedDemand: { food: 24000, water: 40000, medical: 1600, shelter: 1600 },
            actualDemand: { food: 22000, water: 38000, medical: 1500, shelter: 1550 },
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            disasterId: 'DIS_2024_004',
            disasterType: 'landslide',
            location: 'Kerala, India',
            severity: 'high',
            peopleAffected: 5000,
            date: new Date('2024-10-01'),
            status: 'resolved',
            predictedDemand: { food: 15000, water: 25000, medical: 1000, shelter: 1000 },
            actualDemand: { food: 14500, water: 24000, medical: 950, shelter: 980 },
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            disasterId: 'DIS_2024_005',
            disasterType: 'drought',
            location: 'Rajasthan, India',
            severity: 'medium',
            peopleAffected: 50000,
            date: new Date('2024-07-01'),
            status: 'monitoring',
            predictedDemand: { food: 150000, water: 250000, medical: 10000, shelter: 0 },
            actualDemand: { food: 145000, water: 240000, medical: 9500, shelter: 0 },
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ];
}

/**
 * Execute Python ML script
 */
function executePythonScript(scriptPath, args = []) {
    return new Promise((resolve, reject) => {
        const python = spawn('python', [scriptPath, ...args]);
        
        let dataString = '';
        let errorString = '';
        
        python.stdout.on('data', (data) => {
            dataString += data.toString();
        });
        
        python.stderr.on('data', (data) => {
            errorString += data.toString();
        });
        
        python.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Python script exited with code ${code}: ${errorString}`));
            } else {
                try {
                    const result = JSON.parse(dataString);
                    resolve(result);
                } catch (e) {
                    resolve({ raw: dataString });
                }
            }
        });
    });
}

/**
 * Generate AI prediction using rule-based model
 * (This can be replaced with actual ML model prediction)
 */
function generateAIPrediction(data) {
    const baseDemand = {
        flood: { food: 1000, medical: 500, shelter: 800, water: 20000 },
        cyclone: { food: 800, medical: 700, shelter: 1200, water: 25000 },
        earthquake: { food: 1200, medical: 1000, shelter: 1500, water: 30000 },
        drought: { food: 1500, medical: 300, shelter: 400, water: 50000 },
        wildfire: { food: 600, medical: 400, shelter: 900, water: 15000 },
        landslide: { food: 400, medical: 800, shelter: 600, water: 10000 }
    };

    const severityMultipliers = {
        low: 0.5,
        medium: 1.0,
        high: 2.0,
        critical: 3.5
    };

    const densityMultipliers = {
        low: 0.7,
        medium: 1.0,
        high: 1.5
    };

    const historicalImpact = Math.min((data.historicalEvents || 0) * 0.1, 0.5);
    
    const base = baseDemand[data.disasterType] || baseDemand.flood;
    const severityMult = severityMultipliers[data.severity] || 1.0;
    const densityMult = densityMultipliers[data.populationDensity] || 1.0;
    const totalMultiplier = severityMult * densityMult * (1 + historicalImpact);

    return {
        disasterType: data.disasterType,
        location: data.region,
        predictedDemand: {
            food: Math.round(base.food * totalMultiplier),
            medical: Math.round(base.medical * totalMultiplier),
            shelter: Math.round(base.shelter * totalMultiplier),
            water: Math.round(base.water * totalMultiplier)
        },
        confidence: Math.min(85 + ((data.historicalEvents || 0) * 2), 95),
        urgency: data.severity === 'critical' ? 'IMMEDIATE' : 
                data.severity === 'high' ? 'HIGH' : 
                data.severity === 'medium' ? 'MODERATE' : 'LOW',
        estimatedAffected: Math.round(base.food * totalMultiplier / 0.5)
    };
}

// ============================================================================
// API ROUTES
// ============================================================================

// Mount live disasters routes
app.use('/api/disasters', liveDisastersRouter);

// Mount relief prediction routes
app.use('/api/relief', reliefPredictionRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date(),
        service: 'Disaster Relief AI API',
        version: '1.0.0',
        mongoConnected: isMongoConnected,
        liveDataEnabled: !!process.env.NEWS_API_KEY
    });
});

// ============================================================================
// LIVE DATA COLLECTION ROUTES
// ============================================================================

/**
 * GET /api/live-data/status
 * Check status of live data collection
 */
app.get('/api/live-data/status', (req, res) => {
    try {
        const newsApiKey = process.env.NEWS_API_KEY;
        const hasApiKey = !!newsApiKey;
        
        // Check for latest collected data
        const dataDir = path.join(__dirname, 'data', 'raw');
        let latestCollection = null;
        
        if (fs.existsSync(dataDir)) {
            const files = fs.readdirSync(dataDir)
                .filter(f => f.startsWith('disaster_news') && f.endsWith('.csv'))
                .sort()
                .reverse();
            
            if (files.length > 0) {
                const latestFile = files[0];
                const stats = fs.statSync(path.join(dataDir, latestFile));
                latestCollection = {
                    filename: latestFile,
                    date: stats.mtime,
                    size: stats.size
                };
            }
        }
        
        res.json({
            success: true,
            status: {
                apiKeyConfigured: hasApiKey,
                canCollectLiveData: hasApiKey,
                latestCollection,
                provider: 'NewsAPI',
                limit: hasApiKey ? '100 requests/day' : 'No API key'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to check live data status',
            message: error.message
        });
    }
});

/**
 * POST /api/live-data/collect
 * Trigger live data collection
 */
app.post('/api/live-data/collect', async (req, res) => {
    try {
        const newsApiKey = process.env.NEWS_API_KEY;
        
        if (!newsApiKey) {
            return res.status(400).json({
                success: false,
                error: 'NewsAPI key not configured',
                message: 'Set NEWS_API_KEY environment variable to enable live data collection'
            });
        }
        
        // Execute Python script to collect live data
        const scriptPath = path.join(__dirname, '..', 'ml_pipeline', 'data_collection', 'news_api_collector.py');
        
        res.json({
            success: true,
            message: 'Live data collection started',
            status: 'running'
        });
        
        // Run collection in background
        executePythonScript(scriptPath, [])
            .then(result => {
                console.log('✓ Live data collection completed:', result);
            })
            .catch(error => {
                console.error('✗ Live data collection failed:', error.message);
            });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to start live data collection',
            message: error.message
        });
    }
});

/**
 * POST /api/live-data/retrain
 * Retrain ML models with latest data
 */
app.post('/api/live-data/retrain', async (req, res) => {
    try {
        const scriptPath = path.join(__dirname, '..', 'ml_pipeline', 'main_pipeline.py');
        
        res.json({
            success: true,
            message: 'Model retraining started',
            status: 'training',
            estimatedTime: '10-30 seconds'
        });
        
        // Run training in background
        executePythonScript(scriptPath, [])
            .then(result => {
                console.log('✓ Model retraining completed:', result);
            })
            .catch(error => {
                console.error('✗ Model retraining failed:', error.message);
            });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to start model retraining',
            message: error.message
        });
    }
});

/**
 * GET /api/live-data/articles
 * Get collected articles data
 */
app.get('/api/live-data/articles', (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;
        const dataDir = path.join(__dirname, 'data', 'raw');
        
        // Find the latest disaster news file
        if (!fs.existsSync(dataDir)) {
            return res.json({
                success: true,
                articles: [],
                total: 0,
                message: 'No data collected yet'
            });
        }
        
        const files = fs.readdirSync(dataDir)
            .filter(f => f.startsWith('disaster_news') && f.endsWith('.csv'))
            .sort()
            .reverse();
        
        if (files.length === 0) {
            return res.json({
                success: true,
                articles: [],
                total: 0,
                message: 'No data collected yet'
            });
        }
        
        // Read the latest CSV file
        const latestFile = path.join(dataDir, files[0]);
        const fileContent = fs.readFileSync(latestFile, 'utf-8');
        
        // Parse CSV (simple parser)
        const lines = fileContent.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',');
        
        const articles = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const article = {};
            headers.forEach((header, index) => {
                article[header.trim()] = values[index] ? values[index].trim() : '';
            });
            articles.push(article);
        }
        
        const total = articles.length;
        const paginatedArticles = articles.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
        
        res.json({
            success: true,
            articles: paginatedArticles,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            filename: files[0]
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch articles',
            message: error.message
        });
    }
});

// ============================================================================
// DISASTER PREDICTION ROUTES
// ============================================================================

/**
 * POST /api/predict
 * Generate relief demand prediction
 */
app.post('/api/predict', async (req, res) => {
    try {
        const {
            disasterType,
            region,
            severity,
            populationDensity,
            historicalEvents
        } = req.body;

        // Validate input
        if (!disasterType || !region || !severity) {
            return res.status(400).json({
                error: 'Missing required fields: disasterType, region, severity'
            });
        }

        // Generate prediction
        const prediction = generateAIPrediction({
            disasterType,
            region,
            severity,
            populationDensity: populationDensity || 'medium',
            historicalEvents: historicalEvents || 0
        });

        // Save prediction to database or in-memory storage
        if (isMongoConnected) {
            const predictionDoc = new Prediction({
                disasterType,
                location: region,
                severity,
                populationDensity,
                predictedResources: prediction.predictedDemand,
                confidence: prediction.confidence,
                recommendations: generateRecommendations(prediction)
            });
            await predictionDoc.save();
        } else {
            // Use in-memory storage
            inMemoryStorage.predictions.push({
                disasterType,
                location: region,
                severity,
                populationDensity,
                predictedResources: prediction.predictedDemand,
                confidence: prediction.confidence,
                recommendations: generateRecommendations(prediction),
                requestedAt: new Date()
            });
        }

        res.json({
            success: true,
            prediction: {
                ...prediction,
                recommendations: generateRecommendations(prediction)
            }
        });

    } catch (error) {
        console.error('Prediction error:', error);
        res.status(500).json({
            error: 'Failed to generate prediction',
            message: error.message
        });
    }
});

/**
 * Generate recommendations based on prediction
 */
function generateRecommendations(prediction) {
    const recommendations = [];
    const demand = prediction.predictedDemand;
    
    // Disaster-specific recommendations
    if (prediction.disasterType === 'flood') {
        recommendations.push('Deploy water purification units and emergency boats');
        recommendations.push('Set up temporary shelters in elevated areas');
        recommendations.push('Prepare medical supplies for waterborne diseases');
    } else if (prediction.disasterType === 'cyclone') {
        recommendations.push('Evacuate coastal areas and secure infrastructure');
        recommendations.push('Stock emergency medical supplies for wind-related injuries');
        recommendations.push('Prepare backup power systems and communication equipment');
    } else if (prediction.disasterType === 'earthquake') {
        recommendations.push('Deploy search and rescue teams with specialized equipment');
        recommendations.push('Set up field hospitals for trauma care');
        recommendations.push('Prepare temporary housing for displaced families');
    }
    
    // Demand-based recommendations
    if (demand.food > 1000) {
        recommendations.push('Activate large-scale food distribution network');
    }
    
    if (demand.medical > 500) {
        recommendations.push('Deploy additional medical teams and supplies');
    }
    
    if (demand.shelter > 1000) {
        recommendations.push('Establish emergency relief camps');
    }
    
    return recommendations;
}

/**
 * GET /api/predictions/history
 * Get prediction history
 */
app.get('/api/predictions/history', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const predictions = await Prediction.find()
            .sort({ requestedAt: -1 })
            .limit(limit);
        
        res.json({
            success: true,
            count: predictions.length,
            predictions
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch predictions',
            message: error.message
        });
    }
});

// ============================================================================
// OLD DISASTER MANAGEMENT ROUTES - REMOVED (using new routes from routes/liveDisasters.js)
// ============================================================================
// Old routes deleted to avoid conflicts with new routes

// ============================================================================
// TWEET MONITORING ROUTES
// ============================================================================

/**
 * GET /api/tweets
 * Get processed tweets
 */
app.get('/api/tweets', async (req, res) => {
    try {
        const { disasterType, urgency, limit = 50 } = req.query;
        
        const query = { processed: true };
        if (disasterType) query.disasterType = disasterType;
        if (urgency) query.urgency = urgency;
        
        const tweets = await Tweet.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));
        
        res.json({
            success: true,
            count: tweets.length,
            tweets
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch tweets',
            message: error.message
        });
    }
});

/**
 * POST /api/tweets/analyze
 * Analyze new tweet
 */
app.post('/api/tweets/analyze', async (req, res) => {
    try {
        const { content } = req.body;
        
        if (!content) {
            return res.status(400).json({
                error: 'Tweet content is required'
            });
        }
        
        // Simple analysis (in production, call ML model)
        const analysis = {
            disasterType: extractDisasterType(content),
            urgency: extractUrgency(content),
            resourceNeeds: extractResourceNeeds(content)
        };
        
        res.json({
            success: true,
            analysis
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to analyze tweet',
            message: error.message
        });
    }
});

// Simple extraction functions
function extractDisasterType(text) {
    const types = {
        flood: /flood|flooding|deluge/i,
        cyclone: /cyclone|hurricane|storm/i,
        earthquake: /earthquake|quake|tremor/i,
        fire: /fire|wildfire|blaze/i
    };
    
    for (const [type, pattern] of Object.entries(types)) {
        if (pattern.test(text)) return type;
    }
    
    return 'unknown';
}

function extractUrgency(text) {
    if (/urgent|emergency|critical|sos/i.test(text)) return 'critical';
    if (/help|rescue|immediate/i.test(text)) return 'high';
    return 'medium';
}

function extractResourceNeeds(text) {
    const needs = [];
    if (/food|meal|ration/i.test(text)) needs.push('food');
    if (/water|drinking/i.test(text)) needs.push('water');
    if (/medical|doctor|hospital/i.test(text)) needs.push('medical');
    if (/shelter|home|accommodation/i.test(text)) needs.push('shelter');
    return needs;
}

// ============================================================================
// ANALYTICS ROUTES
// ============================================================================

/**
 * GET /api/analytics/summary
 * Get dashboard summary statistics
 */
app.get('/api/analytics/summary', async (req, res) => {
    try {
        let activeDisasters, totalPredictions, recentTweets;
        
        if (isMongoConnected) {
            activeDisasters = await Disaster.countDocuments({ status: 'active' });
            totalPredictions = await Prediction.countDocuments();
            recentTweets = await Tweet.countDocuments({
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            });
        } else {
            // Use in-memory storage
            activeDisasters = inMemoryStorage.disasters.filter(d => d.status === 'active').length || 3;
            totalPredictions = inMemoryStorage.predictions.length || 8;
            recentTweets = inMemoryStorage.tweets.length || 156;
        }
        
        res.json({
            success: true,
            summary: {
                activeDisasters,
                totalPredictions,
                recentTweets,
                systemUptime: process.uptime()
            }
        });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch analytics',
            message: error.message
        });
    }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.path
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, async () => {
    console.log('='.repeat(60));
    console.log('🚀 SwasthyaSetu - Disaster Relief AI Backend Server');
    console.log('='.repeat(60));
    console.log(`✓ Server running on port ${PORT}`);
    console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✓ API Base URL: http://localhost:${PORT}/api`);
    console.log(`✓ MongoDB: ${isMongoConnected ? 'Connected' : 'Disconnected'}`);
    console.log('='.repeat(60));
    
    // Initialize auto news collector
    if (process.env.NEWS_API_KEY && isMongoConnected) {
        console.log('\n📰 Initializing auto news collector...');
        await autoNewsCollector.initialize();
        autoNewsCollector.start();
        console.log('✓ Auto news collection enabled (every 60 minutes)');
    } else {
        console.log('\n⚠️  Auto news collection disabled (requires NEWS_API_KEY and MongoDB)');
    }
});

export default app;


