import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import sendEmail from "../utils/sendEmail.js";

// Register a new user
const registerUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the email already exists
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Create a new user with hashed password and default check-in settings
    const newUser = new User({ email });
    await newUser.setPassword(password);
    await newUser.save();

    // Generate JWT token for authentication
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(201).json({ user: newUser, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.verifyPassword(password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token for authentication
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({ user, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user._id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
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

    // Validate eligibleDays if provided
    if (eligibleDays && !Array.isArray(eligibleDays)) {
      return res
        .status(400)
        .json({ message: "Eligible days must be an array." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update or add the check-in setting, including eligible days
    user.updateCheckInSetting(
      relationshipType,
      occurrencesPerMonth,
      eligibleDays
    );

    await user.save();

    res.status(200).json(user.checkInSettings);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
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

    const resetURL = `http://localhost:3000/reset-password/${user.resetPasswordToken}`;
    await sendEmail({
      to: user.email,
      subject: "Password Reset",
      text: `You requested a password reset. Click this link to reset your password: ${resetURL}`,
    });

    res.status(200).json({ message: "Password reset email sent." });
  } catch (error) {
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// Reset Password with Token
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
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

    res.status(200).json({
      message:
        "Password reset successful. You can now log in with your new password.",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

export {
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
};
