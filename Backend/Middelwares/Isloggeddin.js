import jwt from 'jsonwebtoken'
import User from '../Models/User.js'
//MIddelware to protect routes

export const isLoggedIn =async(req,res,next)=>{
    try {
      const token=req.headers.token
      const decodedtoken=jwt.verify(token,process.env.JWT_SECRET)
      const user=await User.findById(decodedtoken.userId).select("-password")

      if(!user){
        return res.status(401).json({ success: false, msg: "User not found" });
      }
      req.user=user
      next()
    } catch (error) {
    res.status(401).json({ success: false, msg: error.message });

    }
}