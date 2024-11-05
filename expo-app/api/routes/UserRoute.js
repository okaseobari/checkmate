import express from "express";
import {
  addPushToken,
  deleteUserCheckInSetting,
  getUserCheckInSettings,
  getUserProfile,
  loginUser,
  registerUser,
  removePushToken,
  requestPasswordReset,
  resetPassword,
  resetUserCheckInSettings,
  updateUserCheckInSetting,
  updateUserProfile,
} from "../controllers/UserController.js";
import { protect } from "../middleware/authMiddleware.js";

const userRouter = express.Router();

// User authentication routes
userRouter.post("/register", registerUser); // Register new user
userRouter.post("/login", loginUser); // Login user

// Password reset routes
userRouter.post("/reset-password", requestPasswordReset); // Request password reset
userRouter.post("/reset-password/:token", resetPassword); // Reset password with token

// User profile routes (protected)
userRouter
  .route("/profile")
  .get(protect, getUserProfile) // Get user profile
  .put(protect, updateUserProfile); // Update user profile

// Push token management routes (protected)
userRouter.put("/push-token/add", protect, addPushToken); // Add a push token
userRouter.put("/push-token/remove", protect, removePushToken); // Remove a push token

// Check-in settings routes (protected)
userRouter
  .route("/settings/check-ins")
  .get(protect, getUserCheckInSettings) // Get user check-in settings
  .put(protect, updateUserCheckInSetting); // Update or add check-in setting

userRouter.delete(
  "/settings/check-ins/:relationshipType",
  protect,
  deleteUserCheckInSetting
); // Delete a specific check-in setting

// Route for resetting check-in settings to default (protected)
userRouter.post("/settings/check-ins/reset", protect, resetUserCheckInSettings); // Reset check-in settings

export default userRouter;
