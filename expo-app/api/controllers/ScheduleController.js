const Contact = require("../models/ContactModel");
const ConversationLog = require("../models/ConversationLogModel");
const Schedule = require("../models/ScheduleModel");
const ScheduleLogic = require("../services/ScheduleLogic");
const User = require("../models/UserModel");

// Retrieve the user's schedule, including contact names
const getUserSchedule = async (req, res) => {
  try {
    const userId = req.user._id;

    const schedule = await Schedule.findOne({ userId }).populate({
      path: "entries.contactId",
      select: "name",
    });

    if (!schedule) {
      return res
        .status(404)
        .json({ message: "Schedule not found for this user." });
    }

    res.status(200).json(schedule.entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Regenerate the user's schedule
const regenerateSchedule = async (req, res) => {
  try {
    const userId = req.user._id;

    // Generate the schedule entries
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

    if (!user) throw new Error("User not found.");

    // If no contacts, return an empty schedule
    if (!contacts.length) {
      return [];
    }

    const userSettings = user.checkInSettings;
    const scheduleInstance = new ScheduleLogic(userSettings, contacts);

    // Generate new schedule entries
    const newEntries = createScheduleEntries(scheduleInstance);

    // Fetch or create the user's schedule using the schema method
    const schedule = await Schedule.findOrCreateSchedule(userId);

    // Add or update schedule entries using the schema method
    await schedule.addOrUpdateEntries(newEntries);

    return schedule.entries;
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

    // Find and update the specific check-in using the schema method
    const schedule = await Schedule.findOneAndUpdate(
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

    // Find the schedule and remove the specific check-in using the schema method
    const schedule = await Schedule.findOneAndUpdate(
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

// Log that a user has checked in with a contact
const logCheckIn = async (req, res) => {
  const userId = req.user._id;
  const { contactId } = req.params;
  const { checkInDetails } = req.body;

  try {
    // Atomically update the lastCheckInDate of the contact and validate existence
    const contact = await Contact.findOneAndUpdate(
      { _id: contactId, userId },
      { $set: { lastCheckInDate: new Date() } },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({ message: "Contact not found." });
    }

    // Find or create the conversation log for the user and contact
    const log = await ConversationLog.findOrCreateLog(userId, contactId);

    // Add the check-in details to the conversation log using the schema method
    await log.addConversation(checkInDetails);

    res.status(201).json({ message: "Check-in logged successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  deleteCheckIn,
  generateSchedule,
  getUserSchedule,
  logCheckIn,
  regenerateSchedule,
  updateCheckIn,
};
