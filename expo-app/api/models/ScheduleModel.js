const mongoose = require("mongoose");

// Schedule Entry Schema (for each check-in for a contact)
const scheduleEntrySchema = new mongoose.Schema({
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact', // Reference to the contact
    required: true,
  },
  checkInDate: {
    type: Date,
    required: true, // Date of the check-in
  },
  event: {
    type: String, // Event name, e.g., "Birthday", "General Check-in"
    default: "General Check-in",
  },
});

// Schedule Schema for the User
const scheduleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Link the schedule to a specific user
    required: true,
  },
  entries: [scheduleEntrySchema], // Array of schedule entries for the user's contacts
});

const Schedule = mongoose.model('Schedule', scheduleSchema);
module.exports = Schedule;