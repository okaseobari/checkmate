import Contact from "../models/ContactModel.js";
import Schedule from "../models/ScheduleModel.js";
import User from "../models/UserModel.js";
import Scheduler from "../services/Scheduler.js";

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

    // Fetch or create the user's schedule using the schema method
    const schedule = await Schedule.findOrCreateSchedule(userId);

    // If no contacts, clear the schedule
    if (!contacts.length) {
      console.log("No contacts found, clearing schedule");
      schedule.entries = []; // Clear the entries
      await schedule.save(); // Save the changes
      return schedule.entries;
    }

    const userSettings = user.checkInSettings;
    const schedulerInstance = new Scheduler(userSettings, contacts);
    const newSchedule = schedulerInstance.generateSchedule(); // Let the Scheduler generate the schedule

    // Map the scheduler's output to the required format
    const newEntries = newSchedule.map((entry) => ({
      contactId: entry.contactId,
      checkInDate: new Date(entry.date), // Ensure date is a Date object
      event: entry.note || "General Check-in",
    }));

    // Filter out entries that reference contacts no longer present
    const validContactIds = new Set(
      contacts.map((contact) => contact._id.toString())
    );

    schedule.entries = schedule.entries.filter((entry) =>
      validContactIds.has(entry.contactId.toString())
    );

    // Add or update schedule entries using the schema method
    await schedule.addOrUpdateEntries(newEntries);

    return schedule.entries;
  } catch (error) {
    throw new Error(`Error regenerating schedule: ${error.message}`);
  }
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

export {
  deleteCheckIn,
  generateSchedule,
  getUserSchedule,
  regenerateSchedule,
  updateCheckIn,
};
