const mongoose = require("mongoose");

// Schedule Entry Schema (for each check-in for a contact)
const scheduleEntrySchema = new mongoose.Schema({
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Contact", // Reference to the contact
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
    ref: "User", // Link the schedule to a specific user
    required: true,
  },
  entries: [scheduleEntrySchema], // Array of schedule entries for the user's contacts
});

// Schema Methods

// Method to find or create a schedule for a user
scheduleSchema.statics.findOrCreateSchedule = async function (userId) {
  let schedule = await this.findOne({ userId });
  if (!schedule) {
    schedule = await this.create({ userId, entries: [] });
  }
  return schedule;
};

// Method to add or update schedule entries
scheduleSchema.methods.addOrUpdateEntries = async function (newEntries) {
  // Map existing entries by contactId and date for quick lookup
  const existingEntriesMap = new Map(
    this.entries.map((entry) => [
      `${entry.contactId}-${entry.checkInDate.toISOString()}`,
      entry,
    ])
  );

  // Iterate over new entries to update or add entries
  newEntries.forEach((newEntry) => {
    const key = `${newEntry.contactId}-${newEntry.checkInDate.toISOString()}`;
    if (existingEntriesMap.has(key)) {
      const existingEntry = existingEntriesMap.get(key);
      if (existingEntry.event !== newEntry.event) {
        existingEntry.event = newEntry.event;
      }
    } else {
      // Add the new entry if it doesn't exist
      existingEntriesMap.set(key, newEntry);
    }
  });

  // Convert the map back to an array and update the schedule entries
  this.entries = Array.from(existingEntriesMap.values());
  await this.save();
};

// Method to remove a schedule entry by ID
scheduleSchema.methods.removeEntry = async function (entryId) {
  this.entries = this.entries.filter(
    (entry) => entry._id.toString() !== entryId
  );
  await this.save();
};

const Schedule = mongoose.model("Schedule", scheduleSchema);
module.exports = Schedule;
