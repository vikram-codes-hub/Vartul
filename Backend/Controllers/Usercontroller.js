import bcrypt from "bcryptjs";
import User from "../Models/User.js";
import { generatetoken } from "../Utils/generatetokens.js";
import cloudinary from "../Config/cloudinary.js";
import redisclient from "../Config/redis.js";
import { clearUserCache } from "../Utils/redishelper.js";
import Post_model from "../Models/Post_model.js";
import Post from "../Models/Post_model.js";
//  Controller for user signup
export const userSignup = async (req, res) => {
  try {
    const {fullname,email, password } = req.body;

    
    if (!fullname|| !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const [firstName,...rest]=fullname.trim().split(" ");
    const lastName=rest.join(" ")||"_"
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = await User.create({
     firstName,
     lastName,
      email,
      password: hashedPassword,
     
    });

    // Generate JWT token
    const token = generatetoken(newUser._id);

    // Exclude password from response
    const { password: _, ...userWithoutPassword } = newUser._doc;

    // Response
    res.status(201).json({
      success: true,
      UserData: userWithoutPassword,
      token,
      mssg: "Account created successfully",
    });
  } catch (error) {
    console.error("Error during user signup:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//  Controller for user login
export const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check fields
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT
    const token = generatetoken(user._id);

    // Exclude password from response
    const { password: _, ...userWithoutPassword } = user._doc;

    // Response
    res.status(200).json({
      success: true,
      UserData: userWithoutPassword,
      token,
      mssg: "Login successful",
    });
  } catch (error) {
    console.error("Error during user login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



//controller to get user profile
export const getUserProfile=async(req,res)=>{
    try {
        const userId=req.params.id;

        //chache checking fiorst
        const cacheprofile=await redisclient.get(`userprofile:${userId}`);
        if(cacheprofile){
            return res.json({success:true,user:JSON.parse(cacheprofile)});
        }
        const user=await User.findById(userId).select("-password");
        if(!user){
        return res.status(404).json({message:"User not found"});
        }
         await redisclient.setEx(`user:${userId}`, 300, JSON.stringify(user));

        res.json({success:true,user});
    }catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

//controller to update user profile
export const updateUserProfile=async(req,res)=>{
    try {
        const { username, bio, profilePic, interests,firstName,lastName } = req.body;
        const userId=req.user._id;
        let updateuser;

        if(!profilePic){
            updateuser=await User.findByIdAndUpdate(userId,{
                username,
                firstName,
                lastName,
                bio,
                interests
            },{new:true})
        }else{
            const uploadedImage=cloudinary.uploader.upload(profilePic)
            updateuser= await User.findByIdAndUpdate(userId,{
                username,
                firstName,
                lastName,
                bio,
                profilePic:(await uploadedImage).secure_url,
                interests
            },{new:true})

        }

        res.json({success:true,updateuser});
    } catch (error) {
        console.error("Error updating user profile:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}


//controller to delete user account
export const deleteUserAccount=async(req,res)=>{
    try {
        const userId=req.user._id;
        await User.findByIdAndDelete(userId);
        await clearUserCache(req.user._id);

        res.json({success:true,message:"User account deleted successfully"});

    } catch (error) {
        console.error("Error deleting user account:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

//contoller to change password
export const changeUserPassword=async(req,res)=>{
    try {
        const {currentPassword,newPassword}=req.body;
        const userId=await User.findById(req.user._id);
        const isMatcha=await bcrypt.compare(currentPassword,userId.password);
        if(!isMatcha){
            return res.status(400).json({message:"Current password is incorrect"});
        }
        const salt=await bcrypt.genSalt(10);
        const hashedNewPassword=await bcrypt.hash(newPassword,salt);
        userId.password=hashedNewPassword;
        await userId.save();
        res.json({success:true,message:"Password changed successfully"});


    } catch (error) {
        console.log("Error changing user password:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}






//forn the folkolower and following  amnd p[ost count
export const getUserStats = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check cache
    const cacheKey = `userstats:${userId}`;
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

    // Get user with stats
    const user = await User.findById(userId).select('followersCount followingCount postsCount');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const response = {
      followersCount: user.followersCount || 0,
      followingCount: user.followingCount || 0,
      postsCount: user.postsCount || 0
    };

    // Cache for 5 minutes
    if (req.app.locals.redisClient) {
      await req.app.locals.redisClient.setEx(cacheKey, 300, JSON.stringify(response));
    }

    res.json({ success: true, ...response });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};
//to search the user bu his username or name
export const searchUser = async (req, res) => {
  try {
    const key = req.params.key;

    if (!key || key.trim() === "") {
      return res.status(400).json({ message: "Search key is required" });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: key, $options: "i" } },
        { firstName: { $regex: key, $options: "i" } },
        { lastName: { $regex: key, $options: "i" } }
      ]
    }).select("firstName lastName username profilePic bio");

    res.status(200).json({
      success: true,
      user: users
    });

  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//controller to get current user details
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    console.log("Current user data:", user);
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error fetching current user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
//contolerr for getting all users for admin panel
export const getAllUsers = async (req, res) => {
  try {
    const cachedUsers = await redisclient.get("allUsers");
    if (cachedUsers) {
      return res.json({ success: true, ...JSON.parse(cachedUsers), fromCache: true });
    }

    const users = await User.find().select("username firstName lastName profilePic bio");
    const response = { count: users.length, users };

    await redisclient.setEx("allUsers", 600, JSON.stringify(response)); 

    res.json({ success: true, ...response });
  } catch (error) {
    console.error("Error fetching all users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//Controleer for the completeuserprofile
export const completeUserProfile = async (req, res) => {
  try {
    const { username, gender, ageGroup,  bio} = req.body;
    const userId = req.user._id;

   

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        username,
        gender,
        ageGroup,
        bio,
        profileCompleted: true
      },
      { new: true, upsert: false }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile completed successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error in completeUserProfile:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


//user filling the interests and content categories during signup
export const updateUserInterests = async (req, res) => {
  try {
    const { interests, contentCategories } = req.body;
    const userId = req.user._id;

    if (!interests || interests.length < 3) {
      return res.status(400).json({ message: "Select at least 3 interests" });
    }

    if (!contentCategories || contentCategories.length < 3) {
      return res.status(400).json({ message: "Select at least 3 content categories" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { interests, contentCategories },
      { new: true }
    ).select("-password");
    await clearUserCache(req.user._id);


    res.status(200).json({
      success: true,
      message: "Interests and content preferences updated successfully",
      user: updatedUser,
      profileCompleted: true
    });
  } catch (error) {
    console.error("Error updating interests:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// check auth
export const checkauth = async (req, res) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (error) {
    console.log("Problem in checking auth", error);
    res.json({ success: false });
  }
};

//contorller to upload profile pric after the signup
export const uploadProfilePic=async(req,res)=>{
  try {
    const {profilePic}=req.body;
    const userId=req.user._id;
    const uploadedImage=cloudinary.uploader.upload(profilePic)
    const updateuser= await User.findByIdAndUpdate(userId,{
        profilePic:(await uploadedImage).secure_url,
    },{new:true})
    res.json({success:true,updateuser});
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
//controller to forget password

// ── Connect Wallet to User Account ────────────────────────────────────────────
export const connectWallet = async (req, res) => {
  try {
    const { walletAddress } = req.body;
    const userId = req.user._id;

    if (!walletAddress || walletAddress.length < 32 || walletAddress.length > 44) {
      return res.status(400).json({ message: "Invalid Solana wallet address" });
    }

    // Check if wallet already linked to another user
    const existingOwner = await User.findOne({
      walletAddress,
      _id: { $ne: userId },
    });
    if (existingOwner) {
      return res.status(409).json({
        message: "This wallet is already linked to another account",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { walletAddress },
      { new: true }
    ).select("-password");

    await clearUserCache(userId);

    res.json({
      success: true,
      message: "Wallet connected successfully",
      walletAddress,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Connect wallet error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ── Disconnect Wallet from User Account ───────────────────────────────────────
export const disconnectWallet = async (req, res) => {
  try {
    const userId = req.user._id;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { walletAddress: "" },
      { new: true }
    ).select("-password");

    await clearUserCache(userId);

    res.json({
      success: true,
      message: "Wallet disconnected",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Disconnect wallet error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
