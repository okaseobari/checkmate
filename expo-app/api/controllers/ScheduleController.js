const Schedule = require("../models/ScheduleModel");
const Contact = require("../models/ContactModel");

// Get the schedule for a specific user, including the contact's name
const getUserSchedule = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find the schedule and populate the contactId with the name field
    const schedule = await Schedule.findOne({ userId }).populate({
      path: "entries.contactId", // Populate contactId in each entry
      select: "name", // Only get the name field from Contact
    });

    if (!schedule) {
      return res
        .status(404)
        .json({ message: "Schedule not found for this user." });
    }

    res.status(200).json(schedule.entries); // The entries will now include the contact name
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Regenerate the schedule for a specific user (dedicated endpoint)
const regenerateSchedule = async (req, res) => {
  try {
    const userId = req.user._id; // Get the user ID from the token

    // Regenerate the schedule
    const newSchedule = await generateSchedule(userId);

    // Return the new schedule
    res.status(200).json(newSchedule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to get check-in frequency based on relationship and weight
const getCheckInFrequency = (relationship, adjustableWeight) => {
  const baseFrequency = {
    Family: 4, // Weekly
    Friend: 2, // Twice a month
    Acquaintance: 1, // Once a month
    Girlfriend: 3, // Custom or flexible
  };
  return Math.ceil(baseFrequency[relationship] * adjustableWeight);
};

// Update a specific check-in by checkInId
const updateCheckIn = async (req, res) => {
  try {
    const userId = req.user._id;
    const checkInId = req.params.checkInId;
    const { checkInDate, event } = req.body;

    // Validate checkInDate as a proper date
    const newCheckInDate = new Date(checkInDate);
    if (isNaN(newCheckInDate.getTime())) {
      return res
        .status(400)
        .json({ message: "Invalid date format for checkInDate." });
    }

    const schedule = await Schedule.findOne({ userId });
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found." });
    }

    // Find the specific check-in to update by checkInId
    const checkInIndex = schedule.entries.findIndex(
      (checkIn) => checkIn._id.toString() === checkInId
    );

    if (checkInIndex === -1) {
      return res.status(404).json({ message: "Check-in not found." });
    }

    // Update check-in details
    schedule.entries[checkInIndex].event = event || "General Check-in";
    schedule.entries[checkInIndex].checkInDate = newCheckInDate;

    // Save updated schedule
    await schedule.save();

    res.status(200).json(schedule.entries[checkInIndex]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a specific check-in entry using checkInId
const deleteCheckIn = async (req, res) => {
  try {
    const userId = req.user._id;
    const checkInId = req.params.checkInId;

    const schedule = await Schedule.findOne({ userId });
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found." });
    }

    // Find the index of the check-in to be deleted using checkInId
    const checkInIndex = schedule.entries.findIndex(
      (checkIn) => checkIn._id.toString() === checkInId
    );

    if (checkInIndex === -1) {
      return res.status(404).json({ message: "Check-in not found." });
    }

    // Remove the check-in from the user's schedule
    schedule.entries.splice(checkInIndex, 1);

    // Save the updated schedule
    await schedule.save();

    res.status(200).json({
      message: "Check-in entry deleted successfully.",
      schedule: schedule.entries,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const generateSchedule = async (userId) => {
  try {
    // Fetch all individual contacts for the user
    const contacts = await Contact.find({ userId });
    if (!contacts.length) throw new Error("No contacts found for this user.");

    // Clear the user's existing schedule
    const schedule = await Schedule.findOneAndUpdate(
      { userId },
      { entries: [] },
      { new: true, upsert: true }
    );

    // Iterate over each contact and create check-ins
    contacts.forEach((contact) => {
      const baseCheckInDate = new Date();

      // Determine number of check-ins based on contact details
      const numberOfCheckIns = getCheckInFrequency(
        contact.relationship,
        contact.adjustableWeight
      );

      for (let i = 0; i < numberOfCheckIns; i++) {
        const checkInDate = new Date(baseCheckInDate);
        checkInDate.setDate(checkInDate.getDate() + i * 7); // Spread check-ins weekly

        // Ensure contactId is correctly assigned as an ObjectId from Contact
        schedule.entries.push({
          contactId: contact._id, // This should be the ObjectId from the Contact model
          checkInDate,
          event: "General Check-in",
        });
      }

      // Include important events as scheduled entries
      contact.importantEvents.forEach((event) => {
        schedule.entries.push({
          contactId: contact._id,
          checkInDate: event.eventDate,
          event: event.eventName,
        });
      });
    });

    await schedule.save();
    return schedule.entries;
  } catch (error) {
    throw new Error("Error regenerating schedule: " + error.message);
  }
};

module.exports = {
  deleteCheckIn,
  generateSchedule,
  getUserSchedule,
  regenerateSchedule,
  updateCheckIn,
};
