/**
 * Sync News Data to Database
 * Reads collected news articles and populates disaster database
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';
import mongoose from 'mongoose';
import Disaster from '../models/Disaster.js';
import dotenv from 'dotenv';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Extract location from text
function extractLocation(text) {
  const locationPatterns = [
    /in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),?\s+([A-Z][a-z]+)/,
  ];
  
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        city: match[1].trim(),
        state: match[2].trim()
      };
    }
  }
  
  // Default fallback
  return { city: 'Unknown', state: 'India' };
}

// Extract affected numbers
function extractAffectedNumbers(text) {
  const numbers = {
    casualties: 0,
    injured: 0,
    displaced: 0
  };
  
  // Casualties
  const casualtyMatch = text.match(/(\d+)\s+(?:killed|dead|casualties|deaths)/i);
  if (casualtyMatch) numbers.casualties = parseInt(casualtyMatch[1]);
  
  // Injured
  const injuredMatch = text.match(/(\d+)\s+injured/i);
  if (injuredMatch) numbers.injured = parseInt(injuredMatch[1]);
  
  // Displaced
  const displacedMatch = text.match(/(\d+(?:,\d+)?)\s+(?:displaced|evacuated|affected)/i);
  if (displacedMatch) {
    numbers.displaced = parseInt(displacedMatch[1].replace(/,/g, ''));
  }
  
  return numbers;
}

// Get coordinates using Python geocoder
async function getCoordinates(city, state) {
  return new Promise((resolve) => {
    try {
      const geocoder = spawn('python', [
        path.join(__dirname, '..', '..', 'ml_pipeline', 'utils', 'geocoder.py'),
        city,
        state
      ]);
      
      let data = '';
      geocoder.stdout.on('data', (chunk) => {
        data += chunk.toString();
      });
      
      geocoder.on('close', () => {
        try {
          const result = JSON.parse(data);
          resolve({ latitude: result.latitude, longitude: result.longitude });
        } catch {
          resolve(getDefaultCoordinates(state));
        }
      });
      
      geocoder.on('error', () => {
        resolve(getDefaultCoordinates(state));
      });
    } catch {
      resolve(getDefaultCoordinates(state));
    }
  });
}

// Default coordinates by state
function getDefaultCoordinates(state) {
  const stateCoords = {
    'Maharashtra': { latitude: 19.7515, longitude: 75.7139 },
    'Kerala': { latitude: 10.8505, longitude: 76.2711 },
    'Tamil Nadu': { latitude: 11.1271, longitude: 78.6569 },
    'Karnataka': { latitude: 15.3173, longitude: 75.7139 },
    'Gujarat': { latitude: 22.2587, longitude: 71.1924 },
    'Rajasthan': { latitude: 27.0238, longitude: 74.2179 },
    'Uttar Pradesh': { latitude: 26.8467, longitude: 80.9462 },
    'Madhya Pradesh': { latitude: 22.9734, longitude: 78.6569 },
    'West Bengal': { latitude: 22.9868, longitude: 87.8550 },
    'Bihar': { latitude: 25.0961, longitude: 85.3131 },
    'Odisha': { latitude: 20.9517, longitude: 85.0985 },
    'Assam': { latitude: 26.2006, longitude: 92.9376 },
    'Uttarakhand': { latitude: 30.0668, longitude: 79.0193 },
    'Himachal Pradesh': { latitude: 31.1048, longitude: 77.1734 },
  };
  
  return stateCoords[state] || { latitude: 20.5937, longitude: 78.9629 }; // India center
}

// Calculate affected radius based on text
function estimateAffectedRadius(text, disaster_type) {
  // Look for area mentions
  const areaMatch = text.match(/(\d+)\s*(?:km|kilometer)/i);
  if (areaMatch) {
    return parseInt(areaMatch[1]);
  }
  
  // Default by disaster type
  const defaultRadius = {
    flood: 30,
    earthquake: 50,
    cyclone: 100,
    landslide: 10,
    wildfire: 25,
    tsunami: 150,
    drought: 200
  };
  
  return defaultRadius[disaster_type] || 20;
}

// Main sync function
async function syncNewsToDatabase() {
  try {
    console.log('🔄 Starting news data sync...');
    
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/disaster_relief_ai';
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');
    
    // Find latest news CSV
    const dataDir = path.join(__dirname, '..', '..', 'backend', 'data', 'raw');
    if (!fs.existsSync(dataDir)) {
      console.log('⚠️  No data directory found');
      return;
    }
    
    const files = fs.readdirSync(dataDir)
      .filter(f => f.startsWith('disaster_news') && f.endsWith('.csv'))
      .sort()
      .reverse();
    
    if (files.length === 0) {
      console.log('⚠️  No news data files found');
      return;
    }
    
    const latestFile = path.join(dataDir, files[0]);
    console.log(`📄 Processing: ${files[0]}`);
    
    // Read and process CSV
    const articles = [];
    
    fs.createReadStream(latestFile)
      .pipe(csv())
      .on('data', (row) => {
        articles.push(row);
      })
      .on('end', async () => {
        console.log(`📊 Found ${articles.length} articles`);
        
        let processed = 0;
        let skipped = 0;
        
        for (const article of articles) {
          try {
            // Check if already exists
            const existing = await Disaster.findOne({ 
              title: article.title 
            });
            
            if (existing) {
              skipped++;
              continue;
            }
            
            // Extract information
            const location = extractLocation(article.title + ' ' + article.description);
            const numbers = extractAffectedNumbers(article.content || article.description || '');
            const coordinates = await getCoordinates(location.city, location.state);
            
            // Create disaster record
            const disaster = new Disaster({
              disaster_id: `DIS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              title: article.title,
              disaster_type: article.search_keyword?.split(' ')[0].toLowerCase() || 'other',
              location: {
                city: location.city,
                state: location.state,
                coordinates
              },
              severity: numbers.casualties > 50 ? 'critical' : 
                       numbers.casualties > 10 ? 'high' : 
                       numbers.displaced > 1000 ? 'high' : 'medium',
              affected_radius_km: estimateAffectedRadius(article.content || '', article.search_keyword?.split(' ')[0]),
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
        
        console.log('\n✅ Sync complete!');
        console.log(`   Processed: ${processed}`);
        console.log(`   Skipped (duplicates): ${skipped}`);
        console.log(`   Total: ${articles.length}`);
        
        await mongoose.disconnect();
        process.exit(0);
      });
    
  } catch (error) {
    console.error('❌ Sync error:', error);
    process.exit(1);
  }
}

// Run sync
syncNewsToDatabase();












