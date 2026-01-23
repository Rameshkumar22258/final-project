/**
 * Auto News Collector
 * Periodically collects disaster news and updates database
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import csv from 'csv-parser';
import mongoose from 'mongoose';
import Disaster from '../models/Disaster.js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

class AutoNewsCollector {
  constructor() {
    this.isRunning = false;
    this.collectInterval = 60 * 60 * 1000; // 1 hour
    this.mongoConnected = false;
  }

  async initialize() {
    try {
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/disaster_relief_ai';
      await mongoose.connect(MONGODB_URI);
      console.log('✓ MongoDB connected for auto collector');
      this.mongoConnected = true;
    } catch (err) {
      console.error('MongoDB connection failed:', err.message);
      this.mongoConnected = false;
    }
  }

  async collectNews() {
    if (this.isRunning) {
      console.log('⏭️  Collection already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('\n' + '='.repeat(80));
    console.log(`📰 AUTO NEWS COLLECTION - ${new Date().toLocaleString()}`);
    console.log('='.repeat(80));

    try {
      const scriptPath = path.join(__dirname, '..', '..', 'ml_pipeline', 'data_collection', 'news_api_collector.py');
      
      // Run Python collector
      const result = await this.executePythonScript(scriptPath);
      console.log('✓ News collection completed');

      // Sync to database
      await this.syncToDatabase();
      
    } catch (error) {
      console.error('❌ Auto collection error:', error.message);
    } finally {
      this.isRunning = false;
    }
  }

  executePythonScript(scriptPath) {
    return new Promise((resolve, reject) => {
      const python = spawn('python', [scriptPath]);
      
      python.stdout.on('data', (data) => {
        process.stdout.write(data.toString());
      });
      
      python.stderr.on('data', (data) => {
        process.stderr.write(data.toString());
      });
      
      python.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Python script exited with code ${code}`));
        }
      });
    });
  }

  async syncToDatabase() {
    if (!this.mongoConnected) {
      console.log('⚠️  MongoDB not connected, skipping sync');
      return;
    }

    console.log('\n🔄 Syncing news to database...');

    try {
      // Find latest CSV file
      const dataDir = path.join(__dirname, '..', 'data', 'raw');
      
      if (!fs.existsSync(dataDir)) {
        console.log('⚠️  No data directory found');
        return;
      }

      const files = fs.readdirSync(dataDir)
        .filter(f => f.startsWith('disaster_news') && f.endsWith('.csv'))
        .sort()
        .reverse();

      if (files.length === 0) {
        console.log('⚠️  No news files found');
        return;
      }

      const latestFile = path.join(dataDir, files[0]);
      console.log(`📄 Processing: ${files[0]}`);

      // Read CSV
      const articles = [];
      await new Promise((resolve) => {
        fs.createReadStream(latestFile)
          .pipe(csv())
          .on('data', (row) => articles.push(row))
          .on('end', resolve);
      });

      let processed = 0;
      let skipped = 0;

      for (const article of articles) {
        try {
          // Check if already exists
          const existing = await Disaster.findOne({ title: article.title });
          if (existing) {
            skipped++;
            continue;
          }

          // Extract location and coordinates
          const location = this.extractLocation(article.title + ' ' + article.description);
          const coordinates = this.getCoordinates(location.city, location.state);
          const numbers = this.extractNumbers(article.content || article.description || '');

          // Create disaster record
          const disaster = new Disaster({
            disaster_id: `DIS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: article.title,
            disaster_type: this.extractDisasterType(article.search_keyword || ''),
            location: {
              city: location.city,
              state: location.state,
              coordinates
            },
            severity: this.calculateSeverity(numbers),
            affected_radius_km: this.estimateRadius(article.search_keyword || ''),
            casualties: numbers.casualties,
            injured: numbers.injured,
            displaced: numbers.displaced,
            source: {
              type: 'news_api',
              url: article.url,
              published_at: new Date(article.published_at),
              author: article.author
            },
            description: article.description,
            content: article.content,
            relevance_score: parseFloat(article.relevance_score) || 50,
            search_keyword: article.search_keyword,
            status: 'active',
            detected_at: new Date(article.published_at)
          });

          await disaster.save();
          processed++;
        } catch (err) {
          console.error(`Error processing article: ${err.message}`);
        }
      }

      console.log(`✅ Sync complete: Processed ${processed}, Skipped ${skipped}`);

    } catch (error) {
      console.error('Sync error:', error.message);
    }
  }

  extractLocation(text) {
    // Simple location extraction
    const patterns = [
      /in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),?\s+([A-Z][a-z]+)/,
      /([A-Z][a-z]+),\s*([A-Z][a-z]+)/
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return { city: match[1], state: match[2] };
      }
    }

    return { city: 'Unknown', state: 'India' };
  }

  getCoordinates(city, state) {
    const coords = {
      'Mumbai': { latitude: 19.0760, longitude: 72.8777 },
      'Delhi': { latitude: 28.7041, longitude: 77.1025 },
      'Bangalore': { latitude: 12.9716, longitude: 77.5946 },
      'Hyderabad': { latitude: 17.3850, longitude: 78.4867 },
      'Chennai': { latitude: 13.0827, longitude: 80.2707 },
      'Kolkata': { latitude: 22.5726, longitude: 88.3639 },
      'Uttarkashi': { latitude: 30.7268, longitude: 78.4354 },
      'Chamoli': { latitude: 30.4067, longitude: 79.3308 },
      'Bhubaneswar': { latitude: 20.2961, longitude: 85.8245 },
    };

    return coords[city] || { latitude: 20.5937, longitude: 78.9629 };
  }

  extractNumbers(text) {
    const numbers = { casualties: 0, injured: 0, displaced: 0 };
    
    const casualtyMatch = text.match(/(\d+)\s+(?:killed|dead|casualties|deaths)/i);
    if (casualtyMatch) numbers.casualties = parseInt(casualtyMatch[1]);
    
    const injuredMatch = text.match(/(\d+)\s+injured/i);
    if (injuredMatch) numbers.injured = parseInt(injuredMatch[1]);
    
    const displacedMatch = text.match(/(\d+(?:,\d+)?)\s+(?:displaced|evacuated|affected)/i);
    if (displacedMatch) {
      numbers.displaced = parseInt(displacedMatch[1].replace(/,/g, ''));
    }
    
    return numbers;
  }

  calculateSeverity(numbers) {
    if (numbers.casualties > 50 || numbers.displaced > 10000) return 'critical';
    if (numbers.casualties > 10 || numbers.displaced > 1000) return 'high';
    if (numbers.casualties > 0 || numbers.displaced > 100) return 'medium';
    return 'low';
  }

  extractDisasterType(keyword) {
    const types = {
      flood: /flood/i,
      earthquake: /earthquake/i,
      cyclone: /cyclone/i,
      landslide: /landslide/i,
      wildfire: /wildfire|fire/i,
      drought: /drought/i,
      tsunami: /tsunami/i,
      avalanche: /avalanche/i
    };

    for (const [type, pattern] of Object.entries(types)) {
      if (pattern.test(keyword)) return type;
    }

    return 'other';
  }

  estimateRadius(keyword) {
    const radii = {
      flood: 30,
      earthquake: 50,
      cyclone: 100,
      landslide: 10,
      wildfire: 25,
      tsunami: 150,
      drought: 200
    };

    const type = this.extractDisasterType(keyword);
    return radii[type] || 20;
  }

  start() {
    console.log('🚀 Auto News Collector started');
    console.log(`   Collection interval: ${this.collectInterval / 1000 / 60} minutes`);
    
    // Initial collection
    setTimeout(() => this.collectNews(), 5000); // 5 second delay
    
    // Schedule periodic collection
    setInterval(() => this.collectNews(), this.collectInterval);
  }
}

// Export instance
const collector = new AutoNewsCollector();
export default collector;

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    await collector.initialize();
    await collector.collectNews();
    process.exit(0);
  })();
}












