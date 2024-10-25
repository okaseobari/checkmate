const { randomBytes } = require("node:crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");
const User = require("../models/userModel");

// Register a new user
const registerUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = await User.create({
      email,
      password: hashedPassword,
    });

    // Generate JWT token for authentication
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(201).json({
      user: newUser,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare the provided password with the hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token for authentication
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    console.log("user successfully logged in");

    res.status(200).json({
      user,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

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
    const userId = req.user._id;
    const updatedData = req.body;

    const user = await User.findByIdAndUpdate(userId, updatedData, {
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

// Get user's schedule (specific to the user)
const getUserSchedule = async (req, res) => {
  try {
    const userId = req.user._id;

    // Retrieve the user's schedule embedded in the user model
    const user = await User.findById(userId);
    if (!user || !user.schedule || user.schedule.length === 0) {
      return res
        .status(404)
        .json({ message: "No schedule found for this user" });
    }

    res.status(200).json(user.schedule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add or update a user's schedule entry
const updateUserSchedule = async (req, res) => {
  try {
    const userId = req.user._id;
    const { scheduleEntry } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update or add the schedule entry
    const index = user.schedule.findIndex(
      (entry) => entry.contactId.toString() === scheduleEntry.contactId
    );
    if (index >= 0) {
      user.schedule[index] = scheduleEntry; // Update existing entry
    } else {
      user.schedule.push(scheduleEntry); // Add new entry
    }

    await user.save();

    res.status(200).json(user.schedule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a schedule entry for a user
const deleteUserScheduleEntry = async (req, res) => {
  try {
    const userId = req.user._id;
    const { contactId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove the schedule entry for the given contact
    user.schedule = user.schedule.filter(
      (entry) => entry.contactId.toString() !== contactId
    );

    await user.save();

    res.status(200).json({
      message: "Schedule entry deleted successfully",
      schedule: user.schedule,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Request Password Reset
const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ message: "No user found with this email." });
    }

    // Generate reset token and its expiration time
    const resetToken = randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    // Save the token and expiry in the user's document
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = resetTokenExpiry;
    await user.save();

    // Send email with reset token
    const resetURL = `http://localhost:3000/reset-password/${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: "Password Reset",
      text: `You requested a password reset. Click this link to reset your password: ${resetURL}`,
    });

    res.status(200).json({ message: "Password reset email sent." });
  } catch (error) {
    console.error("Password reset request error:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// Reset Password with Token
const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() }, // Ensure the token hasn't expired
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    // Hash the new password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user's password and clear the reset token and expiry
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;

    await user.save();

    res.status(200).json({
      message:
        "Password reset successful. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

module.exports = {
  deleteUserScheduleEntry,
  getUserProfile,
  getUserSchedule,
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPassword,
  updateUserProfile,
  updateUserSchedule,
};
