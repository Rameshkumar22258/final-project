/**
 * Fresh Start Script
 * Clears all disasters and creates fresh sample data
 */

import mongoose from 'mongoose';
import Disaster from '../models/Disaster.js';
import dotenv from 'dotenv';

dotenv.config();

// Sample disasters data (same as createSampleDisasters.js)
const sampleDisasters = [
  {
    disaster_id: 'DIS_2025_001',
    title: 'Heavy Floods in Mumbai: Thousands Evacuated',
    disaster_type: 'flood',
    location: {
      city: 'Mumbai',
      state: 'Maharashtra',
      district: 'Mumbai Suburban',
      coordinates: {
        latitude: 19.0760,
        longitude: 72.8777
      }
    },
    severity: 'high',
    affected_area_km2: 150,
    affected_radius_km: 30,
    casualties: 12,
    injured: 45,
    displaced: 8500,
    buildings_damaged: 320,
    status: 'active',
    source: {
      type: 'news_api',
      url: 'https://example.com/mumbai-floods',
      published_at: new Date(),
      author: 'News Agency'
    },
    description: 'Heavy rainfall causes severe flooding in Mumbai, affecting thousands of families. Emergency services deployed.',
    content: 'Mumbai is facing severe flooding after unprecedented rainfall. The disaster management teams have evacuated over 8,500 people to relief camps. NDRF teams are conducting rescue operations.',
    relevance_score: 85,
    search_keyword: 'flood India',
    detected_at: new Date()
  },
  {
    disaster_id: 'DIS_2025_002',
    title: 'Landslide in Uttarkashi: Rescue Operations Underway',
    disaster_type: 'landslide',
    location: {
      city: 'Uttarkashi',
      state: 'Uttarakhand',
      coordinates: {
        latitude: 30.7268,
        longitude: 78.4354
      }
    },
    severity: 'critical',
    affected_area_km2: 25,
    affected_radius_km: 10,
    casualties: 28,
    injured: 67,
    displaced: 1200,
    buildings_damaged: 45,
    status: 'active',
    source: {
      type: 'news_api',
      url: 'https://example.com/uttarkashi-landslide',
      published_at: new Date(),
      author: 'Mountain News'
    },
    description: 'Major landslide in Uttarkashi district blocks highways, traps villages.',
    content: 'A massive landslide has struck Uttarkashi, blocking major highways and trapping several villages. Army and NDRF teams are conducting rescue operations. Weather conditions remain challenging.',
    relevance_score: 92,
    search_keyword: 'landslide India',
    detected_at: new Date()
  },
  {
    disaster_id: 'DIS_2025_003',
    title: 'Cyclone Warning for Odisha Coast',
    disaster_type: 'cyclone',
    location: {
      city: 'Bhubaneswar',
      state: 'Odisha',
      coordinates: {
        latitude: 20.2961,
        longitude: 85.8245
      }
    },
    severity: 'high',
    affected_area_km2: 500,
    affected_radius_km: 150,
    casualties: 0,
    injured: 0,
    displaced: 15000,
    status: 'active',
    source: {
      type: 'news_api',
      url: 'https://example.com/odisha-cyclone',
      published_at: new Date(),
      author: 'Weather Bureau'
    },
    description: 'Cyclone expected to make landfall. Evacuation orders issued for coastal areas.',
    content: 'The India Meteorological Department has issued cyclone warnings for Odisha coast. Over 15,000 people have been evacuated as a precautionary measure. Relief camps have been set up.',
    relevance_score: 88,
    search_keyword: 'cyclone India',
    detected_at: new Date()
  },
  {
    disaster_id: 'DIS_2025_004',
    title: 'Earthquake Tremors Felt in North India',
    disaster_type: 'earthquake',
    location: {
      city: 'Chamoli',
      state: 'Uttarakhand',
      coordinates: {
        latitude: 30.4067,
        longitude: 79.3308
      }
    },
    severity: 'medium',
    affected_area_km2: 200,
    affected_radius_km: 50,
    casualties: 3,
    injured: 15,
    displaced: 450,
    buildings_damaged: 28,
    status: 'active',
    source: {
      type: 'news_api',
      url: 'https://example.com/earthquake',
      published_at: new Date(),
      author: 'Seismic Center'
    },
    description: 'Moderate earthquake of magnitude 4.8 recorded in Himalayan region.',
    content: 'An earthquake measuring 4.8 on the Richter scale hit the Himalayan region. Minor damage reported. Emergency teams are assessing the situation.',
    relevance_score: 75,
    search_keyword: 'earthquake India',
    detected_at: new Date()
  },
  {
    disaster_id: 'DIS_2025_005',
    title: 'Drought Conditions Worsen in Rajasthan',
    disaster_type: 'drought',
    location: {
      city: 'Jaipur',
      state: 'Rajasthan',
      coordinates: {
        latitude: 26.9124,
        longitude: 75.7873
      }
    },
    severity: 'medium',
    affected_area_km2: 5000,
    affected_radius_km: 200,
    casualties: 0,
    injured: 0,
    displaced: 0,
    status: 'active',
    source: {
      type: 'news_api',
      url: 'https://example.com/rajasthan-drought',
      published_at: new Date(),
      author: 'Agricultural Report'
    },
    description: 'Severe drought affects farming communities across Rajasthan.',
    content: 'Rajasthan is experiencing severe drought conditions. Water scarcity affecting agriculture and livestock. Government has initiated relief measures.',
    relevance_score: 70,
    search_keyword: 'drought India',
    detected_at: new Date()
  }
];

async function freshStart() {
  try {
    console.log('🔄 Starting fresh database setup...\n');
    
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/disaster_relief_ai';
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');
    
    // Clear ALL existing disasters
    console.log('🗑️  Clearing all existing disasters...');
    const deleteResult = await Disaster.deleteMany({});
    console.log(`✓ Deleted ${deleteResult.deletedCount} disasters\n`);
    
    // Create fresh sample disasters with recent dates
    console.log('✨ Creating fresh sample disasters...\n');
    let created = 0;
    
    for (const disasterData of sampleDisasters) {
      try {
        // Set recent dates (within last 5 days to ensure they show up) - random time in past 5 days
        const hoursAgo = Math.random() * 5 * 24; // Max 5 days = 120 hours
        disasterData.detected_at = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
        disasterData.source.published_at = disasterData.detected_at;
        disasterData.status = 'active'; // Ensure all are active
        
        const disaster = new Disaster(disasterData);
        await disaster.save();
        console.log(`✓ Created: ${disaster.title} (${Math.round(hoursAgo)} hours ago)`);
        created++;
      } catch (err) {
        console.error(`❌ Error creating disaster: ${err.message}`);
      }
    }
    
    console.log('\n✅ Fresh start complete!');
    console.log(`   Created: ${created} fresh disasters`);
    
    // Verify
    const count = await Disaster.countDocuments();
    const activeCount = await Disaster.countDocuments({ status: 'active' });
    console.log(`\n📊 Database Status:`);
    console.log(`   Total disasters: ${count}`);
    console.log(`   Active disasters: ${activeCount}`);
    
    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

freshStart();

