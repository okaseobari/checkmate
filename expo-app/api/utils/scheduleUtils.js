import Schedule from "../models/ScheduleModel.js";

/**
 * Fetches the schedule data based on provided parameters.
 * Handles fetching the full schedule, next check-in, or check-ins for specific contacts.
 *
 * @param {Object} params - The parameters for fetching the schedule.
 * @param {string} params.userId - The ID of the user requesting the schedule.
 * @param {Array<string>} [params.contactIds] - The IDs of contacts to filter by.
 * @param {boolean} [params.nextCheckIn] - Whether to fetch the next check-in.
 * @returns {Array|Object|string} The schedule data or a specific entry.
 */
export const fetchSchedule = async ({
  userId,
  contactIds = [],
  nextCheckIn = false,
}) => {
  if (!userId) {
    throw new Error("User ID is required to fetch the schedule.");
  }

  // Build the base query
  const query = { userId };

  // If contactIds are provided and not empty, add them to the query
  if (contactIds.length && contactIds[0].toLowerCase() !== "all") {
    query["entries.contactId"] = { $in: contactIds };
  }

  // Fetch the schedule based on the query
  const schedule = await Schedule.findOne(query)
    .select("entries")
    .populate("entries.contactId", "name");
  if (!schedule || !schedule.entries.length) {
    throw new Error("No schedule found for this user.");
  }

  const entries = schedule.entries;

  // Handle next check-in if requested
  if (nextCheckIn) {
    const nextCheckInEntry = entries
      .filter((entry) => new Date(entry.checkInDate) >= new Date())
      .sort((a, b) => new Date(a.checkInDate) - new Date(b.checkInDate))[0];

    return nextCheckInEntry || "No upcoming check-ins.";
  }

  // Return entries filtered by contact IDs if specified
  if (contactIds.length && contactIds[0].toLowerCase() !== "all") {
    return entries.filter((entry) =>
      contactIds.includes(entry.contactId.toString())
    );
  }

  // Return all entries if no specific filters are applied
  return entries;
};
