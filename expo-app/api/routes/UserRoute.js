const express = require("express");
const userRouter = express.Router();

// Import the user controller functions
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUserCheckInSettings,
  updateUserCheckInSetting,
  deleteUserCheckInSetting,
  resetUserCheckInSettings,
  requestPasswordReset,
  resetPassword,
} = require("../controllers/userController");

// Import middleware for protecting routes (like verifying JWT token)
const { protect } = require("../middleware/authMiddleware.js");

// User registration route
userRouter.post("/register", registerUser);

// User login route
userRouter.post("/login", loginUser);

// Password reset routes
userRouter.post("/reset-password", requestPasswordReset);
userRouter.post("/reset-password/:token", resetPassword);

// Profile routes (protected)
userRouter
  .route("/profile")
  .get(protect, getUserProfile) // Get user profile
  .put(protect, updateUserProfile); // Update user profile

// Check-in settings routes (protected)
userRouter
  .route("/settings/check-ins")
  .get(protect, getUserCheckInSettings) // Get check-in settings
  .put(protect, updateUserCheckInSetting); // Update/add check-in setting

userRouter
  .route("/settings/check-ins/:relationshipType")
  .delete(protect, deleteUserCheckInSetting); // Delete check-in setting

// Separate route for resetting check-in settings to defaults (protected)
userRouter.post("/settings/check-ins/reset", protect, resetUserCheckInSettings); // Reset check-in settings to default

module.exports = userRouter;
