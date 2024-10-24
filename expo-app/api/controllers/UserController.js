const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUserSchedule,
  updateUserSchedule,
  deleteUserScheduleEntry, // New function to handle schedule entry deletion
};
