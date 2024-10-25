const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpiry: {
    type: Date,
  },
  // Other user fields...
});

// Check if the model is already compiled to prevent OverwriteModelError
const User = mongoose.models.User || mongoose.model("User", UserSchema);

module.exports = User;
