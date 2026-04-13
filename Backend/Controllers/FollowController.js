// controllers/followController.js
import Follow from '../Models/Follow.js';
import User from '../Models/User.js'
import mongoose from 'mongoose';

// Helper function to clear cache
const clearFollowCache = async (userId, redisClient) => {
  try {
    await redisClient.del(`followers:${userId}`);
    await redisClient.del(`userstats:${userId}`);
  } catch (error) {
    console.error('Cache clear error:', error);
  }
};

// Follow a user
export const followUser = async (req, res) => {
  try {
    const userToFollowId = req.params.id;
    const currentUserId = req.user._id;

    // Validation 1: Cannot follow yourself
    if (userToFollowId === currentUserId.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'You cannot follow yourself' 
      });
    }

    // Validation 2: Check if user to follow exists
    const userToFollow = await User.findById(userToFollowId);
    if (!userToFollow) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Validation 3: Check if already following
    const existingFollow = await Follow.findOne({
      follower: currentUserId,
      following: userToFollowId
    });

    if (existingFollow) {
      return res.status(400).json({ 
        success: false, 
        message: 'You already follow this user' 
      });
    }

    // Use MongoDB transaction for data consistency
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create follow relationship
      await Follow.create([{
        follower: currentUserId,
        following: userToFollowId
      }], { session });

      // Increment following count for current user
      await User.findByIdAndUpdate(
        currentUserId,
        { $inc: { followingCount: 1 } },
        { session }
      );

      // Increment followers count for user being followed
      await User.findByIdAndUpdate(
        userToFollowId,
        { $inc: { followersCount: 1 } },
        { session }
      );

      // Commit transaction
      await session.commitTransaction();

      // Clear Redis cache for both users
      if (req.app.locals.redisClient) {
        await clearFollowCache(currentUserId, req.app.locals.redisClient);
        await clearFollowCache(userToFollowId, req.app.locals.redisClient);
      }
      console.log('Follow cache cleared for users:', currentUserId, userToFollowId);

      res.status(201).json({
        success: true,
        message: 'User followed successfully',
        data: {
          following: userToFollowId
        }
      });

    } catch (error) {
      // Rollback transaction on error
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Unfollow a user
export const unfollowUser = async (req, res) => {
  try {
    const userToUnfollowId = req.params.id;
    const currentUserId = req.user._id;

    // Validation 1: Cannot unfollow yourself
    if (userToUnfollowId === currentUserId.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'You cannot unfollow yourself' 
      });
    }

    // Validation 2: Check if follow relationship exists
    const followRelationship = await Follow.findOne({
      follower: currentUserId,
      following: userToUnfollowId
    });

    if (!followRelationship) {
      return res.status(400).json({ 
        success: false, 
        message: 'You are not following this user' 
      });
    }

    // Use MongoDB transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Delete follow relationship
      await Follow.findByIdAndDelete(followRelationship._id, { session });

      // Decrement following count for current user
      await User.findByIdAndUpdate(
        currentUserId,
        { $inc: { followingCount: -1 } },
        { session }
      );

      // Decrement followers count for user being unfollowed
      await User.findByIdAndUpdate(
        userToUnfollowId,
        { $inc: { followersCount: -1 } },
        { session }
      );

      // Commit transaction
      await session.commitTransaction();

      // Clear Redis cache
      if (req.app.locals.redisClient) {
        await clearFollowCache(currentUserId, req.app.locals.redisClient);
        await clearFollowCache(userToUnfollowId, req.app.locals.redisClient);
      }
console.log('Unfollow cache cleared for users:', currentUserId, userToUnfollowId);
      res.status(200).json({
        success: true,
        message: 'User unfollowed successfully',
        data: {
          unfollowed: userToUnfollowId
        }
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Get followers list (with pagination)
export const getFollowers = async (req, res) => {
  try {
    const userId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Check cache first
    const cacheKey = `followers:${userId}:page:${page}:limit:${limit}`;
    if (req.app.locals.redisClient) {
      const cachedData = await req.app.locals.redisClient.get(cacheKey);
      if (cachedData) {
        return res.json({ 
          success: true, 
          ...JSON.parse(cachedData), 
          fromCache: true 
        });
      }
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Get followers with pagination
    const followers = await Follow.find({ following: userId })
      .populate('follower', 'firstName lastName username profilePic bio')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalFollowers = user.followersCount || 0;

    const response = {
      followers: followers.map(f => f.follower),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalFollowers / limit),
        totalFollowers,
        hasMore: skip + followers.length < totalFollowers
      }
    };

    // Cache for 5 minutes
    if (req.app.locals.redisClient) {
      await req.app.locals.redisClient.setEx(cacheKey, 300, JSON.stringify(response));
    }
console.log("The response for followers is ", response);
    res.status(200).json({
      success: true,
      ...response
    });

  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Get following list (with pagination)
export const getFollowing = async (req, res) => {
  try {
    const userId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Check cache
    const cacheKey = `following:${userId}:page:${page}:limit:${limit}`;
    if (req.app.locals.redisClient) {
      const cachedData = await req.app.locals.redisClient.get(cacheKey);
      if (cachedData) {
        return res.json({ 
          success: true, 
          ...JSON.parse(cachedData), 
          fromCache: true 
        });
      }
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Get following with pagination
    const following = await Follow.find({ follower: userId })
      .populate('following', 'firstName lastName username profilePic bio')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalFollowing = user.followingCount || 0;

    const response = {
      following: following.map(f => f.following),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalFollowing / limit),
        totalFollowing,
        hasMore: skip + following.length < totalFollowing
      }
    };

    // Cache for 5 minutes
    if (req.app.locals.redisClient) {
      await req.app.locals.redisClient.setEx(cacheKey, 300, JSON.stringify(response));
    }

    res.status(200).json({
      success: true,
      ...response
    });

  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};



// Check follow status
export const checkFollowStatus = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    // Check if current user follows target user
    const isFollowing = await Follow.exists({
      follower: currentUserId,
      following: targetUserId
    });

    // Check if target user follows current user back
    const followsBack = await Follow.exists({
      follower: targetUserId,
      following: currentUserId
    });


    res.status(200).json({
      success: true,
      data: {
        isFollowing: !!isFollowing,
        followsBack: !!followsBack
      }
    });

  } catch (error) {
    console.error('Check follow status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};