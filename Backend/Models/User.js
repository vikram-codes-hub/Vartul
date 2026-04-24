import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    fullName: {
      type: String,
      default: "",
      trim: true,
    },

    username: {
      type: String,
        sparse: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    profilePic: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      default: "",
    },

    interests: {
      type: [String],
      default: [],
    },

    contentCategories: {
      type: [String],
      default: [],
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other", ""],
      default: "",
    },

    ageGroup: {
      type: String,
      default: "",
    },

    hobbies: {
      type: [String],
      default: [],
    },


    profileCompleted: {
      type: Boolean,
      default: false,
    },

    walletAddress: {
      type: String,
      default: "",
    },

    tokensStaked: {
      type: Number,
      default: 0,
    },

    twtBalance: {
      type: Number,
      default: 0,
    },

    // IVTG — Initial Virtual Token Grant
    virtualTwtBalance: {
      type: Number,
      default: 0,
    },
    ivtgClaimed: {
      type: Boolean,
      default: false,
    },
    isVirtualConverted: {
      type: Boolean,
      default: false,
    },
    watchSessionCount: {
      type: Number,
      default: 0,
    },

    totalRewardsEarned: {
      type: Number,
      default: 0,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    lastSeen: {
      type: Date,
      default: Date.now,
    },

    resetPasswordToken: String,
    resetPasswordExpire: Date,

     followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  
  // ADD these new counter fields
  followersCount: {
    type: Number,
    default: 0,
    min: 0
  },
  followingCount: {
    type: Number,
    default: 0,
    min: 0
  },
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    postsCount: {
      type: Number,
      default: 0,
    },

    likedPosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],

    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
