import express from "express";
import {
  deleteUserCheckInSetting,
  getUserCheckInSettings,
  getUserProfile,
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPassword,
  resetUserCheckInSettings,
  updateUserCheckInSetting,
  updateUserProfile,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const userRouter = express.Router();

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

export default userRouter;
