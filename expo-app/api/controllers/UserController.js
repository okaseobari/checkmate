import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";

// Generate JWT token for authentication
const generateAuthToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "300d",
  });
};

// Register a new user
const registerUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Create a new user with hashed password and default check-in settings
    const newUser = new User({ email });
    await newUser.setPassword(password);
    await newUser.save();

    // Generate JWT token for authentication
    const token = generateAuthToken(newUser._id);

    res.status(201).json({ user: newUser, token });
  } catch (error) {
    console.error("Error registering user:", error); // Log the error for debugging
    res.status(500).json({ message: "Server error during registration" });
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.verifyPassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token for authentication
    const token = generateAuthToken(user._id);

    res.status(200).json({ user, token });
  } catch (error) {
    console.error("Error logging in user:", error); // Log the error for debugging
    res.status(500).json({ message: "Server error during login" });
  }
};

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error); // Log the error for debugging
    res.status(500).json({ message: "Server error fetching profile" });
  }
};

// Update user profile (excluding push token management)
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Specify allowed fields for updates
    const allowedUpdates = ["email"];
    allowedUpdates.forEach((field) => {
      if (req.body.hasOwnProperty(field)) {
        user[field] = req.body[field];
      }
    });

    await user.save();
    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error("Error updating user profile:", error); // Log the error for debugging
    res.status(500).json({ message: "Server error updating profile" });
  }
};

// Add a push token
const addPushToken = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { pushToken } = req.body;
    if (!pushToken || typeof pushToken !== "string") {
      return res.status(400).json({ message: "Invalid push token" });
    }

    if (user.pushTokens.includes(pushToken)) {
      return res.status(409).json({ message: "Push token already exists" });
    }

    user.pushTokens.push(pushToken);
    await user.save();

    res.status(200).json({ message: "Push token added successfully" });
  } catch (error) {
    console.error("Error adding push token:", error); // Log the error for debugging
    res.status(500).json({ message: "Server error adding push token" });
  }
};

// Remove a push token
const removePushToken = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { pushToken } = req.body;
    if (!pushToken || typeof pushToken !== "string") {
      return res.status(400).json({ message: "Invalid push token" });
    }

    user.pushTokens = user.pushTokens.filter((token) => token !== pushToken);
    await user.save();

    res.status(200).json({ message: "Push token removed successfully" });
  } catch (error) {
    console.error("Error removing push token:", error); // Log the error for debugging
    res.status(500).json({ message: "Server error removing push token" });
  }
};

// Get user's check-in settings
const getUserCheckInSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user.checkInSettings);
  } catch (error) {
    console.error("Error fetching check-in settings:", error); // Log the error for debugging
    res
      .status(500)
      .json({ message: "Server error fetching check-in settings" });
  }
};

// Update or add a check-in setting for the user
const updateUserCheckInSetting = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      relationshipType,
      occurrencesPerMonth,
      eligibleDays = [],
    } = req.body;

    if (!Array.isArray(eligibleDays)) {
      return res
        .status(400)
        .json({ message: "Eligible days must be an array." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.updateCheckInSetting(
      relationshipType,
      occurrencesPerMonth,
      eligibleDays
    );
    await user.save();

    res.status(200).json(user.checkInSettings);
  } catch (error) {
    console.error("Error updating check-in settings:", error); // Log the error for debugging
    res
      .status(500)
      .json({ message: "Server error updating check-in settings" });
  }
};

// Delete a check-in setting for a user
const deleteUserCheckInSetting = async (req, res) => {
  try {
    const { relationshipType } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.deleteCheckInSetting(relationshipType);
    await user.save();

    res.status(200).json({
      message: "Check-in setting deleted successfully",
      settings: user.checkInSettings,
    });
  } catch (error) {
    console.error("Error deleting check-in setting:", error); // Log the error for debugging
    res.status(500).json({ message: "Server error deleting check-in setting" });
  }
};

// Reset user's check-in settings to defaults
const resetUserCheckInSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.resetCheckInSettings();
    await user.save();

    res.status(200).json({
      message: "Check-in settings reset to defaults successfully",
      settings: user.checkInSettings,
    });
  } catch (error) {
    console.error("Error resetting check-in settings:", error); // Log the error for debugging
    res
      .status(500)
      .json({ message: "Server error resetting check-in settings" });
  }
};

// Request Password Reset
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ message: "No user found with this email." });
    }

    user.generatePasswordResetToken();
    await user.save();

    // const resetURL = `http://localhost:3000/reset-password/${user.resetPasswordToken}`;
    // await sendEmail({
    //   to: user.email,
    //   subject: 'Password Reset',
    //   text: `You requested a password reset. Click this link to reset your password: ${resetURL}`,
    // });

    res.status(200).json({ message: "Password reset email sent." });
  } catch (error) {
    console.error("Error requesting password reset:", error); // Log the error for debugging
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// Reset Password with Token
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required." });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    await user.setPassword(password);
    user.clearPasswordResetToken();
    await user.save();

    res.status(200).json({ message: "Password reset successful." });
  } catch (error) {
    console.error("Error resetting password:", error); // Log the error for debugging
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

export {
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
};
