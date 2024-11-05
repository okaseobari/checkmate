import Contact from "../models/ContactModel.js";
import Conversation from "../models/ConversationModel.js";
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
    const { name, relationship, adjustableWeight, importantEvents } = req.body;

    // Check for duplicate contact name using the schema method
    const isDuplicate = await Contact.isDuplicateName(userId, name);
    if (isDuplicate) {
      return res.status(400).json({ message: `You already added ${name}` });
    }

    // Create and save the new contact
    const newContact = await Contact.create({
      userId,
      name,
      relationship,
      adjustableWeight,
      importantEvents,
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
    console.error(`Error logging check-in: ${error.message}`);
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

export {
  addContact,
  checkDuplicateName,
  deleteContact,
  getAllContacts,
  getContact,
  logCheckIn,
  updateCheckIn,
  updateContact,
};
