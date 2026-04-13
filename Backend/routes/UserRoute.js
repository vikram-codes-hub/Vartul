import express from 'express';
import { changeUserPassword, checkauth, completeUserProfile, deleteUserAccount, getAllUsers, getCurrentUser, getUserProfile, getUserStats, searchUser, updateUserInterests, updateUserProfile, uploadProfilePic, userLogin, userSignup, connectWallet, disconnectWallet } from '../Controllers/Usercontroller.js'
import { isLoggedIn } from '../Middelwares/Isloggeddin.js';
import { checkFollowStatus, followUser, getFollowers, getFollowing, unfollowUser } from '../Controllers/FollowController.js';

const userrouter = express.Router();

//Auth Routes
userrouter.post('/signup',userSignup);

userrouter.post('/login',userLogin);
userrouter.get('/checkauth',isLoggedIn,checkauth)
userrouter.post("/profile-setup",isLoggedIn,completeUserProfile);
userrouter.post("/interests",isLoggedIn,updateUserInterests);
userrouter.put('/upload-profile-picture',isLoggedIn,uploadProfilePic);

//password Routes
userrouter.post('/change-password',isLoggedIn,changeUserPassword);

// Wallet Routes
userrouter.post('/connect-wallet', isLoggedIn, connectWallet);
userrouter.post('/disconnect-wallet', isLoggedIn, disconnectWallet);

//profile Routes
userrouter.get('/getcurrentuser',isLoggedIn,getCurrentUser) //getting current user
userrouter.get('/getuser/:id',getUserProfile) //getting user profile by id
userrouter.put('/update-profile',isLoggedIn,updateUserProfile) //updating user profile
userrouter.delete('/delete-profile',isLoggedIn,deleteUserAccount) //deleting user account

//Social route
userrouter.get('/get-stats/:id',isLoggedIn,getUserStats)

//search route
userrouter.get('/search/:key',isLoggedIn,searchUser) //search users by name or username
userrouter.get('/all',isLoggedIn,getAllUsers) //get all users

//completing the profile by adding
userrouter.put('/comeple-profile',isLoggedIn,completeUserProfile)
userrouter.put('/update-interests-categories',isLoggedIn,updateUserProfile)

//follow routes

userrouter.post('/:id/follow', isLoggedIn, followUser);
userrouter.post('/:id/unfollow', isLoggedIn, unfollowUser);

// Get lists (with pagination)
userrouter.get('/:id/followers', isLoggedIn, getFollowers);
userrouter.get('/:id/following', isLoggedIn, getFollowing);


// Check status
userrouter.get('/:id/follow-status', isLoggedIn, checkFollowStatus);


export default userrouter;


