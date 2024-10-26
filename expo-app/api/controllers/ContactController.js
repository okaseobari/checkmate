const Contact = require("../models/ContactModel");
const ConversationLog = require("../models/ConversationLogModel");
const { generateSchedule } = require("./ScheduleController"); // Import ScheduleController

// Get all contacts for a specific user
const getAllContacts = async (req, res) => {
  try {
    const userId = req.user._id;
    const contacts = await Contact.find({ userId }); // Fetch all contacts for the user directly
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

    // Check for duplicate contact name
    const existingContact = await Contact.findOne({ userId, name });
    if (existingContact) {
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

const updateContact = async (req, res) => {
  try {
    const userId = req.user._id;
    const contactId = req.params.contactId;

    // Update the contact with the new data and ensure it belongs to the user
    const updatedContact = await Contact.findOneAndUpdate(
      { _id: contactId, userId },
      { ...req.body },
      { new: true }
    );

    if (!updatedContact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    // Regenerate the user's schedule asynchronously
    generateSchedule(userId);

    res.status(200).json(updatedContact);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteContact = async (req, res) => {
  try {
    const userId = req.user._id;
    const contactId = req.params.contactId;

    // Remove the contact and ensure it belongs to the user
    const deletedContact = await Contact.findOneAndDelete({
      _id: contactId,
      userId,
    });

    if (!deletedContact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    // Regenerate the user's schedule asynchronously
    generateSchedule(userId);

    res.status(200).json({ message: "Contact deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const checkDuplicateName = async (req, res) => {
  try {
    const { name } = req.params;
    const userId = req.user._id;

    // Check for duplicate name within the user's contacts
    const duplicateContact = await Contact.findOne({
      userId,
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });

    if (duplicateContact) {
      return res.status(400).json({ message: `You already added ${name}` });
    }

    res.status(200).json({ message: "Name is available." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update last check-in date and add a new conversation to the log
const updateCheckIn = async (req, res) => {
  try {
    const { contactId, whatWeTalkedAbout } = req.body;
    const userId = req.user._id;

    const contact = await Contact.findOne({ _id: contactId, userId });
    if (!contact) return res.status(404).json({ message: "Contact not found" });

    // Update last check-in date
    contact.lastCheckInDate = new Date();
    await contact.save();

    // Add conversation to the log
    const log = await ConversationLog.findOneAndUpdate(
      { userId, contactId },
      {
        $push: {
          conversationHistory: { date: new Date(), content: whatWeTalkedAbout },
        },
      },
      { upsert: true, new: true }
    );

    res
      .status(200)
      .json({ message: "Check-in and conversation updated successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update check-in and conversation" });
  }
};

module.exports = {
  checkDuplicateName,
  addContact,
  deleteContact,
  getAllContacts,
  getContact,
  updateContact,
  updateCheckIn,
};
