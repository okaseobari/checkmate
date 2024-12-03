import Contact from "../models/ContactModel.js";
import Conversation from "../models/ConversationModel.js";
import { callLLM } from "../services/LLMService.js";
import { generateSchedule } from "./ScheduleController.js";

// Get all contacts for a specific user
const getAllContacts = async (req, res) => {
  try {
    const userId = req.user._id;
    const contacts = await Contact.find({ userId });
    res.status(200).json(contacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new contact and regenerate the user's schedule
const addContact = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, relationship, adjustableWeight, recurringEvents, importantEvents } = req.body;

    // Check for duplicate contact name using the schema method
    const isDuplicate = await Contact.isDuplicateName(userId, name);
    if (isDuplicate) {
      return res.status(400).json({ message: `You already added ${name}` });
    }

    // Create and save the new contact
    const newContact = await Contact.create({
      adjustableWeight,
      recurringEvents,
      importantEvents,
      name,
      relationship,
      userId,
    });

    // Regenerate the user's schedule asynchronously
    generateSchedule(userId);

    res.status(201).json(newContact);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single contact by ID
const getContact = async (req, res) => {
  try {
    const userId = req.user._id;
    const contactId = req.params.contactId;

    // Fetch the contact by ID and ensure it belongs to the user
    const contact = await Contact.findOne({ _id: contactId, userId });
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    res.status(200).json(contact);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a contact's details and regenerate the schedule
const updateContact = async (req, res) => {
  try {
    const userId = req.user._id;
    const contactId = req.params.contactId;

    const contact = await Contact.findOne({ _id: contactId, userId });
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    // Update contact details using the schema method
    const updatedContact = await contact.updateContactDetails(req.body);

    // Regenerate the user's schedule asynchronously
    generateSchedule(userId);

    res.status(200).json(updatedContact);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a contact and its associated conversations, then regenerate the schedule
const deleteContact = async (req, res) => {
  try {
    const userId = req.user._id;
    const contactId = req.params.contactId;

    // Find and delete the contact
    const contact = await Contact.findOneAndDelete({ _id: contactId, userId });
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    await Conversation.deleteOne({ userId, contactId });

    // Regenerate the user's schedule asynchronously
    generateSchedule(userId);

    res.status(200).json({
      message: "Contact and associated conversations deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Check if a name is already used for a contact
const checkDuplicateName = async (req, res) => {
  try {
    const { name } = req.params;
    const userId = req.user._id;

    // Check for duplicate name within the user's contacts
    const isDuplicate = await Contact.isDuplicateName(userId, name);
    if (isDuplicate) {
      return res.status(400).json({ message: `You already added ${name}` });
    }

    res.status(200).json({ message: "Name is available." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Log a check-in and add a new conversation to the log
const logCheckIn = async (req, res) => {
  try {
    const userId = req.user._id;
    const { contactId } = req.params;
    const { checkInDetails } = req.body;
    const authToken = req.headers.authorization;

    const contact = await Contact.findOne({ _id: contactId, userId });
    if (!contact) return res.status(404).json({ message: "Contact not found" });

    // Update the last check-in date
    contact.lastCheckInDate = new Date();
    await contact.save();

    let message;
    if (checkInDetails && Object.keys(checkInDetails).length > 0) {
      // Add the dynamic check-in details to the conversation log if present
      const log = await Conversation.findOrCreateLog(userId, contactId);
      await log.addConversation(checkInDetails, authToken);
      message =
        "Check-in logged with conversation details and last check-in date updated successfully.";
    } else {
      message =
        "Check-in date updated successfully without conversation details.";
    }

    res.status(200).json({ message });
  } catch (error) {
    res.status(500).json({ message: "Failed to log check-in" });
  }
};

// Update the check-in date and conversation details
const updateCheckIn = async (req, res) => {
  try {
    const { contactId, checkInDetails } = req.body;
    const userId = req.user._id;
    const authToken = req.headers.authorization;

    const contact = await Contact.findOne({ _id: contactId, userId });
    if (!contact) return res.status(404).json({ message: "Contact not found" });

    // Update the last check-in date using the schema method
    await contact.updateLastCheckInDate();

    // Add conversation to the log
    const log = await Conversation.findOrCreateLog(userId, contactId);
    await log.addConversation(checkInDetails, authToken);

    res.status(200).json({
      message: "Check-in and conversation updated successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update check-in and conversation" });
  }
};

// Generate personalized insights for a contact
const generateContactInsights = async (req, res) => {
  try {
    const userId = req.user._id;
    const { contactId } = req.params;

    // 1. Fetch the contact details
    const contact = await Contact.findOne({ _id: contactId, userId });
    if (!contact) return res.status(404).json({ message: "Contact not found" });

    // 2. Fetch the conversation history for the contact
    const conversations = await Conversation.find({ userId, contactId })
      .select("checkInDetails date -_id")
      .sort({ date: -1 }); // Sort by most recent

    // 3. Summarize recent conversations
    const conversationSummary = conversations.length
      ? conversations
          .map(
            (conv) =>
              `${new Date(conv.date).toDateString()}: ${
                conv.checkInDetails.note || "No details available"
              }`
          )
          .join("\n")
      : "No recent conversations found.";

    // 4. Extract recurring events (e.g., birthdays, anniversaries)
    const recurringEventsSummary = contact.recurringEvents.length
      ? contact.recurringEvents
          .map(
            (event) =>
              `${event.eventName}: Month ${event.month}, Day ${event.day}`
          )
          .join("\n")
      : "No recurring events on file.";

    // 5. Summarize fixed-date events (e.g., housewarmings)
    const fixedEventsSummary = contact.importantEvents.length
      ? contact.importantEvents
          .map(
            (event) =>
              `${new Date(event.eventDate).toDateString()}: ${event.eventName}`
          )
          .join("\n")
      : "No fixed events on file.";

    // 6. Extract last check-in date
    const lastCheckInDate = contact.lastCheckInDate
      ? new Date(contact.lastCheckInDate).toDateString()
      : "No prior check-ins.";

    // 7. Prepare the prompt for the LLM
    const prompt = `
      Generate personalized insights for the user about their contact ${contact.name}.
      Consider the following information:

      - Relationship: ${contact.relationship}
      - Recurring Events:
        ${recurringEventsSummary}
      - Fixed Events:
        ${fixedEventsSummary}
      - Last Check-In Date: ${lastCheckInDate}
      - Recent Conversations:
        ${conversationSummary}

      Ensure each insight is a separate bullet point and keep the language concise and user-friendly.
    `;

    // 8. Call the LLM service
    const insights = await callLLM(prompt);

    // 9. Return the insights to the client
    res.status(200).json({
      contact: {
        name: contact.name,
        relationship: contact.relationship,
        recurringEvents: contact.recurringEvents,
        fixedEvents: contact.importantEvents,
        lastCheckInDate,
        recentConversations: conversationSummary,
      },
      insights,
    });
  } catch (error) {
    console.error(`Error generating contact insights: ${error.message}`);
    res.status(500).json({ message: "Failed to generate insights" });
  }
};

// Update preferences for a contact
const updatePreferences = async (req, res) => {
  try {
    const { contactId } = req.params;
    const { preferences } = req.body; // Preferences to be updated
    const userId = req.user._id;

    // Find the contact by ID and ensure it belongs to the user
    const contact = await Contact.findOne({ _id: contactId, userId });
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    // Use the schema method to update preferences
    contact.updatePreferences(preferences);

    // Save the updated contact
    await contact.save();
    console.log(
      `[ContactController] Preferences updated successfully for contact ${contact.name}.`
    );

    res
      .status(200)
      .json({ message: "Preferences updated successfully.", contact });
  } catch (error) {
    console.error(
      `[ContactController] Error updating preferences: ${error.message}`
    );
    res.status(500).json({ message: "Failed to update preferences." });
  }
};

export {
  addContact,
  checkDuplicateName,
  deleteContact,
  generateContactInsights,
  getAllContacts,
  getContact,
  logCheckIn,
  updateCheckIn,
  updateContact,
  updatePreferences,
};
