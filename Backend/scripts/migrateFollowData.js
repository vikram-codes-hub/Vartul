// scripts/migrateFollowData.js
import mongoose from 'mongoose';
import User from '../Models/User.js';
import Follow from '../Models/Follow.js';
import dotenv from 'dotenv';

dotenv.config();

async function migrateFollowData() {
  try {
    console.log('🚀 Starting follow data migration...\n');

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const users = await User.find({}).select('_id followers following');
    console.log(`📊 Found ${users.length} users to process\n`);

    let totalFollowsCreated = 0;
    let skippedDuplicates = 0;
    let errors = 0;

    // Process each user
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`Processing user ${i + 1}/${users.length} (${user._id})...`);

      // Process each follower relationship
      if (user.followers && user.followers.length > 0) {
        for (const followerId of user.followers) {
          try {
            // Create Follow document
            await Follow.create({
              follower: followerId,
              following: user._id
            });
            totalFollowsCreated++;
          } catch (error) {
            if (error.code === 11000) {
              // Duplicate key error - relationship already exists
              skippedDuplicates++;
            } else {
              console.error(`Error creating follow relationship: ${error.message}`);
              errors++;
            }
          }
        }
      }

      // Update counter fields
      await User.findByIdAndUpdate(user._id, {
        followersCount: user.followers ? user.followers.length : 0,
        followingCount: user.following ? user.following.length : 0
      });
    }

    console.log('\n✅ Migration completed!\n');
    console.log('📈 Statistics:');
    console.log(`   - Follow relationships created: ${totalFollowsCreated}`);
    console.log(`   - Skipped duplicates: ${skippedDuplicates}`);
    console.log(`   - Errors: ${errors}`);
    console.log(`   - Users processed: ${users.length}\n`);

    // Verify data integrity
    console.log('🔍 Verifying data integrity...\n');
    
    const totalFollowDocs = await Follow.countDocuments();
    console.log(`   - Total Follow documents: ${totalFollowDocs}`);

    const usersWithCounters = await User.countDocuments({
      followersCount: { $exists: true }
    });
    console.log(`   - Users with counter fields: ${usersWithCounters}\n`);

    console.log('✅ Migration successful! You can now switch to the new endpoints.\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    process.exit(0);
  }
}

// Run migration
migrateFollowData();