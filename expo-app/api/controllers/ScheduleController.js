const ScheduleCollection = require("../models/ScheduleModel");
const Contact = require("../models/ContactModel");
const ScheduleLogic = require("../services/ScheduleLogic");
const User = require("../models/UserModel");

// Retrieve the user's schedule, including contact names
const getUserSchedule = async (req, res) => {
  try {
    const userId = req.user._id;

    const schedule = await ScheduleCollection.findOne({ userId }).populate({
      path: "entries.contactId",
      select: "name",
    });

    if (!schedule)
      return res
        .status(404)
        .json({ message: "Schedule not found for this user." });

    res.status(200).json(schedule.entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Regenerate the user's schedule
const regenerateSchedule = async (req, res) => {
  try {
    const userId = req.user._id;
    const newSchedule = await generateSchedule(userId);
    res.status(200).json(newSchedule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate the schedule for a user based on user settings and contacts
const generateSchedule = async (userId) => {
  try {
    // Fetch user and contacts concurrently
    const [contacts, user] = await Promise.all([
      Contact.find({ userId }),
      User.findById(userId),
    ]);

    // Check if data was found
    if (!contacts.length) throw new Error("No contacts found for this user.");
    if (!user) throw new Error("User not found.");

    // Extract user settings
    const userSettings = user.checkInSettings;

    // Initialize ScheduleLogic instance with user settings and add contacts
    const scheduleInstance = new ScheduleLogic(userSettings, contacts);

    // Generate new schedule entries based on the contacts and user settings
    const newEntries = createScheduleEntries(scheduleInstance);

    // Sort new entries before storing them
    newEntries.sort(
      (a, b) => new Date(a.checkInDate) - new Date(b.checkInDate)
    );

    // Fetch the user's existing schedule or create a new one
    const existingSchedule = await getOrCreateSchedule(userId);

    // Clean up entries from deleted contacts and merge new entries
    const updatedEntries = mergeAndUpdateEntries(
      existingSchedule.entries,
      newEntries,
      contacts
    );

    // Save the sorted schedule entries directly
    existingSchedule.entries = updatedEntries;
    await existingSchedule.save();

    return existingSchedule.entries;
  } catch (error) {
    throw new Error(`Error regenerating schedule: ${error.message}`);
  }
};

// Helper function to create schedule entries from the schedule logic instance
const createScheduleEntries = (scheduleInstance) => {
  return scheduleInstance.generate().map((entry) => ({
    contactId: entry.contactId,
    checkInDate: new Date(entry.date),
    event: entry.note || "General Check-in",
  }));
};

// Helper function to fetch or create the schedule for the user
const getOrCreateSchedule = async (userId) => {
  return await ScheduleCollection.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId, entries: [] } },
    { new: true, upsert: true }
  );
};

// Helper function to merge and update schedule entries
const mergeAndUpdateEntries = (existingEntries, newEntries, contacts) => {
  // Map existing entries by contactId and date for quick lookup
  const existingEntriesMap = new Map(
    existingEntries.map((entry) => [
      `${entry.contactId}-${entry.checkInDate.toISOString()}`,
      entry,
    ])
  );

  // Filter and update entries
  newEntries.forEach((newEntry) => {
    const key = `${newEntry.contactId}-${newEntry.checkInDate.toISOString()}`;
    if (existingEntriesMap.has(key)) {
      // Update the event if it differs
      const existingEntry = existingEntriesMap.get(key);
      if (existingEntry.event !== newEntry.event) {
        existingEntry.event = newEntry.event;
      }
    } else {
      // Add new entries if they don’t exist
      existingEntriesMap.set(key, newEntry);
    }
  });

  return Array.from(existingEntriesMap.values());
};

// Update a specific check-in by checkInId
const updateCheckIn = async (req, res) => {
  try {
    const { checkInId } = req.params;
    const { checkInDate, event } = req.body;
    const userId = req.user._id;

    // Validate the check-in date
    const newDate = new Date(checkInDate);
    if (isNaN(newDate)) {
      return res.status(400).json({ message: "Invalid date format." });
    }

    // Find and update the specific check-in
    const schedule = await ScheduleCollection.findOneAndUpdate(
      { userId, "entries._id": checkInId },
      {
        $set: {
          "entries.$.checkInDate": newDate,
          "entries.$.event": event || "General Check-in",
        },
      },
      { new: true }
    );

    if (!schedule) {
      return res.status(404).json({ message: "Check-in not found." });
    }

    // Find the updated check-in entry
    const updatedCheckIn = schedule.entries.find(
      (entry) => entry._id.toString() === checkInId
    );

    res.status(200).json(updatedCheckIn);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a specific check-in entry
const deleteCheckIn = async (req, res) => {
  try {
    const { checkInId } = req.params;
    const userId = req.user._id;

    // Find the schedule and attempt to remove the specific check-in
    const schedule = await ScheduleCollection.findOneAndUpdate(
      { userId },
      { $pull: { entries: { _id: checkInId } } },
      { new: true }
    );

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found." });
    }

    res.status(200).json({
      message: "Check-in deleted successfully.",
      schedule: schedule.entries,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUserSchedule,
  regenerateSchedule,
  generateSchedule,
  updateCheckIn,
  deleteCheckIn,
};
