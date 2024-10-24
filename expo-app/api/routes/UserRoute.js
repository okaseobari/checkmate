const express = require("express");
const userRouter = express.Router();

// Import the user controller functions
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUserSchedule,
} = require("../controllers/userController");

// Import middleware for protecting routes (like verifying JWT token)
const { protect } = require("../middleware/authMiddleware.js");

// User registration route
userRouter.post("/register", registerUser);

// User login route
userRouter.post("/login", loginUser);

// Get and update user profile (protected routes, requires authentication)
userRouter
  .route("/profile")
  .get(protect, getUserProfile) // Get user profile
  .put(protect, updateUserProfile); // Update user profile

// Get user schedule (protected route)
userRouter.get("/schedule", protect, getUserSchedule);

module.exports = userRouter;