/**
 * Clean Duplicate Disasters from Database
 */

import mongoose from 'mongoose';
import Disaster from '../models/Disaster.js';
import dotenv from 'dotenv';

dotenv.config();

async function cleanDuplicates() {
  try {
    console.log('🧹 Cleaning duplicate disasters...');
    
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/disaster_relief_ai';
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');
    
    // Find all disasters
    const all = await Disaster.find().sort({ detected_at: -1 });
    console.log(`Found ${all.length} total disasters`);
    
    // Group by title (duplicates have same title)
    const seen = new Map();
    const toDelete = [];
    
    for (const disaster of all) {
      const key = disaster.title.toLowerCase().trim();
      
      if (seen.has(key)) {
        // Duplicate - mark for deletion
        toDelete.push(disaster._id);
      } else {
        // First occurrence - keep it
        seen.set(key, disaster._id);
      }
    }
    
    console.log(`Found ${toDelete.length} duplicates to remove`);
    
    if (toDelete.length > 0) {
      const result = await Disaster.deleteMany({ _id: { $in: toDelete } });
      console.log(`✓ Deleted ${result.deletedCount} duplicate disasters`);
    }
    
    // Verify
    const remaining = await Disaster.countDocuments();
    console.log(`✅ Database cleaned: ${remaining} unique disasters remaining`);
    
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanDuplicates();












