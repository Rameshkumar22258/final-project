/**
 * Create Sample Disasters for Testing
 * Populates database with sample disaster records
 */

import mongoose from 'mongoose';
import Disaster from '../models/Disaster.js';
import dotenv from 'dotenv';

dotenv.config();

// Export sample disasters for use in other scripts
export const sampleDisasters = [
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
      published_at: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      author: 'News Agency'
    },
    description: 'Heavy rainfall causes severe flooding in Mumbai, affecting thousands of families. Emergency services deployed.',
    content: 'Mumbai is facing severe flooding after unprecedented rainfall. The disaster management teams have evacuated over 8,500 people to relief camps. NDRF teams are conducting rescue operations.',
    relevance_score: 85,
    search_keyword: 'flood India',
    detected_at: new Date(Date.now() - 2 * 60 * 60 * 1000)
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
      published_at: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      author: 'Mountain News'
    },
    description: 'Major landslide in Uttarkashi district blocks highways, traps villages.',
    content: 'A massive landslide has struck Uttarkashi, blocking major highways and trapping several villages. Army and NDRF teams are conducting rescue operations. Weather conditions remain challenging.',
    relevance_score: 92,
    search_keyword: 'landslide India',
    detected_at: new Date(Date.now() - 5 * 60 * 60 * 1000)
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
      published_at: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      author: 'Weather Bureau'
    },
    description: 'Cyclone expected to make landfall. Evacuation orders issued for coastal areas.',
    content: 'The India Meteorological Department has issued cyclone warnings for Odisha coast. Over 15,000 people have been evacuated as a precautionary measure. Relief camps have been set up.',
    relevance_score: 88,
    search_keyword: 'cyclone India',
    detected_at: new Date(Date.now() - 8 * 60 * 60 * 1000)
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
      published_at: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      author: 'Seismic Center'
    },
    description: 'Moderate earthquake of magnitude 4.8 recorded in Himalayan region.',
    content: 'An earthquake measuring 4.8 on the Richter scale hit the Himalayan region. Minor damage reported. Emergency teams are assessing the situation.',
    relevance_score: 75,
    search_keyword: 'earthquake India',
    detected_at: new Date(Date.now() - 12 * 60 * 60 * 1000)
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
      published_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      author: 'Agricultural Report'
    },
    description: 'Severe drought affects farming communities across Rajasthan.',
    content: 'Rajasthan is experiencing severe drought conditions. Water scarcity affecting agriculture and livestock. Government has initiated relief measures.',
    relevance_score: 70,
    search_keyword: 'drought India',
    detected_at: new Date(Date.now() - 24 * 60 * 60 * 1000)
  }
];

async function createSampleDisasters() {
  try {
    console.log('🔄 Creating sample disasters...');
    
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/disaster_relief_ai';
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');
    
    // Update or create sample disasters with recent dates
    let created = 0;
    let updated = 0;
    let skipped = 0;
    
    for (const disasterData of sampleDisasters) {
      try {
        // Update detected_at to be recent (within last 7 days)
        disasterData.detected_at = new Date(Date.now() - Math.random() * 6 * 24 * 60 * 60 * 1000); // Random time in last 6 days
        disasterData.source.published_at = disasterData.detected_at;
        
        // Check if already exists
        const existing = await Disaster.findOne({ disaster_id: disasterData.disaster_id });
        
        if (existing) {
          // Update existing disaster with recent date and ensure status is active
          existing.detected_at = disasterData.detected_at;
          existing.status = disasterData.status || 'active';
          existing.source.published_at = disasterData.detected_at;
          // Update other fields too
          Object.assign(existing, disasterData);
          await existing.save();
          console.log(`✓ Updated: ${disasterData.disaster_id} - ${disasterData.title}`);
          updated++;
          continue;
        }
        
        const disaster = new Disaster(disasterData);
        await disaster.save();
        console.log(`✓ Created: ${disaster.title}`);
        created++;
      } catch (err) {
        console.error(`❌ Error creating disaster: ${err.message}`);
      }
    }
    
    console.log('\n✅ Sample data creation complete!');
    console.log(`   Created: ${created}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${sampleDisasters.length}`);
    
    // Verify
    const count = await Disaster.countDocuments();
    console.log(`\n📊 Total disasters in database: ${count}`);
    
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createSampleDisasters();











