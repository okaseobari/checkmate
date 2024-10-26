const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Link to the User model
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  relationship: {
    type: String,
    enum: ["Family", "Friend", "Acquaintance", "Girlfriend", "Other"], // Standardize relationship types
    default: "Other",
  },
  adjustableWeight: {
    type: Number,
    default: 1, // Default weight for scheduling frequency
  },
  importantEvents: [
    {
      eventName: { type: String },
      eventDate: { type: Date },
    },
  ],
  lastCheckInDate: {
    type: Date,
    default: null, // Date of the most recent check-in
  },
});

const Contact = mongoose.model("Contact", contactSchema);
module.exports = Contact;
