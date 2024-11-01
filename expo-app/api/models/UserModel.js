import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { RELATIONSHIP_TYPES } from "../utils/constants.js";
import { randomBytes } from "node:crypto";

const ALL_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Default check-in settings
const DEFAULT_CHECKIN_SETTINGS = [
  {
    relationshipType: RELATIONSHIP_TYPES.FAMILY,
    occurrencesPerMonth: 4,
    eligibleDays: ALL_DAYS,
  },
  {
    relationshipType: RELATIONSHIP_TYPES.FRIEND,
    occurrencesPerMonth: 2,
    eligibleDays: ALL_DAYS,
  },
  {
    relationshipType: RELATIONSHIP_TYPES.ACQUAINTANCE,
    occurrencesPerMonth: 1,
    eligibleDays: ALL_DAYS,
  },
];

// Schema for monthly check-in settings
const monthlyCadenceSchema = new mongoose.Schema({
  relationshipType: {
    type: String,
    required: true,
  },
  occurrencesPerMonth: {
    type: Number,
    min: 1,
    max: 30,
    required: true,
  },
  eligibleDays: {
    type: [String],
    enum: ALL_DAYS,
    default: ALL_DAYS, // Default to all days being eligible
  },
});

// Main User schema
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
  checkInSettings: {
    type: [monthlyCadenceSchema],
    default: DEFAULT_CHECKIN_SETTINGS,
  },
});

// Method to set a new password
UserSchema.methods.setPassword = async function (password) {
  this.password = await bcrypt.hash(password, 10);
};

// Method to verify a password
UserSchema.methods.verifyPassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

// Method to generate a password reset token
UserSchema.methods.generatePasswordResetToken = function () {
  this.resetPasswordToken = randomBytes(32).toString("hex");
  this.resetPasswordExpiry = Date.now() + 3600000; // 1 hour from now
};

// Method to clear the password reset token
UserSchema.methods.clearPasswordResetToken = function () {
  this.resetPasswordToken = undefined;
  this.resetPasswordExpiry = undefined;
};

// Method to update or add a check-in setting for a relationship type
UserSchema.methods.updateCheckInSetting = function (
  relationshipType,
  occurrencesPerMonth,
  eligibleDays
) {
  const settingIndex = this.checkInSettings.findIndex(
    (setting) => setting.relationshipType === relationshipType
  );

  if (settingIndex >= 0) {
    this.checkInSettings[settingIndex].occurrencesPerMonth =
      occurrencesPerMonth;
    this.checkInSettings[settingIndex].eligibleDays = eligibleDays.length
      ? eligibleDays
      : ALL_DAYS;
  } else {
    this.checkInSettings.push({
      relationshipType,
      occurrencesPerMonth,
      eligibleDays: eligibleDays.length ? eligibleDays : ALL_DAYS,
    });
  }
};

// Method to delete a check-in setting for a relationship type
UserSchema.methods.deleteCheckInSetting = function (relationshipType) {
  this.checkInSettings = this.checkInSettings.filter(
    (setting) => setting.relationshipType !== relationshipType
  );
};

// Method to reset the check-in settings to the default values
UserSchema.methods.resetCheckInSettings = function () {
  this.checkInSettings = [...DEFAULT_CHECKIN_SETTINGS];
};

// Check if the model is already compiled to prevent OverwriteModelError
const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;
