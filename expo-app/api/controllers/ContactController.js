const Contact = require("../models/ContactModel");
const ConversationLog = require("../models/ConversationLogModel");
const { generateSchedule } = require("./ScheduleController"); // Import ScheduleController

// Get all contacts for a specific user
const getAllContacts = async (req, res) => {
  try {
    const userId = req.user._id;
    const contacts = await Contact.find({ userId }); // Find all contacts for the user
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

    // Find the user's contact list
    let userContactList = await Contact.findOne({ userId });
    if (!userContactList) {
      userContactList = await Contact.create({ userId, contacts: [] });
    }

    // Check if contact with the same name already exists for the user
    const existingContact = userContactList.contacts.find(
      (contact) => contact.name === name
    );
    if (existingContact) {
      return res.status(400).json({ message: `You already added ${name}` });
    }

    // Create the new contact
    const newContact = {
      name,
      relationship,
      adjustableWeight,
      importantEvents,
    };

    // Push the new contact into the user's contact list
    userContactList.contacts.push(newContact);

    // Save the updated contact list
    await userContactList.save();

    // Regenerate the user's schedule asynchronously (background process)
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
    const contactId = req.params.contactId; // Get the contact ID from the route params

    // Find the user's contact list
    const userContactList = await Contact.findOne({ userId });

    // If no contact list is found for the user
    if (!userContactList) {
      return res.status(404).json({ message: "User has no contacts" });
    }

    // Find the specific contact by ID in the contacts array
    const contact = userContactList.contacts.find(
      (contact) => contact._id.toString() === contactId
    );

    // If the contact is not found
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    // Return the contact
    res.status(200).json(contact);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateContact = async (req, res) => {
  try {
    const userId = req.user._id; // Get the user ID from the params
    const contactId = req.params.contactId; // Get the contact ID from the params

    // Find the user's contact list
    let userContactList = await Contact.findOne({ userId });
    if (!userContactList) {
      return res.status(404).json({ message: "User has no contacts" });
    }

    // Find the specific contact to update
    const contactIndex = userContactList.contacts.findIndex(
      (contact) => contact._id.toString() === contactId
    );

    if (contactIndex === -1) {
      return res.status(404).json({ message: "Contact not found" });
    }

    // Update the contact with the new data from the request body
    userContactList.contacts[contactIndex] = {
      ...userContactList.contacts[contactIndex]._doc, // Keep existing fields
      ...req.body, // Update with new fields
    };

    // Save the updated contact list
    await userContactList.save();

    // Regenerate the user's schedule asynchronously (background process)
    generateSchedule(userId);

    res.status(200).json(userContactList.contacts[contactIndex]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteContact = async (req, res) => {
  try {
    const userId = req.user._id; // Get the user ID from the params
    const contactId = req.params.contactId; // Get the contact ID from the params

    // Find the user's contact list
    let userContactList = await Contact.findOne({ userId });
    if (!userContactList) {
      return res.status(404).json({ message: "User has no contacts" });
    }

    // Find the specific contact to delete
    const contactIndex = userContactList.contacts.findIndex(
      (contact) => contact._id.toString() === contactId
    );

    if (contactIndex === -1) {
      return res.status(404).json({ message: "Contact not found" });
    }

    // Remove the contact from the list
    userContactList.contacts.splice(contactIndex, 1);

    // Save the updated contact list
    await userContactList.save();

    // Regenerate the user's schedule asynchronously (background process)
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

    // Find the user's contact list
    const userContactList = await Contact.findOne({ userId });

    // If no contacts found for the user
    if (!userContactList) {
      return res.status(200).json({ message: "Name is available." });
    }

    // Check if any contact in the list has the same name
    const duplicateContact = userContactList.contacts.find(
      (contact) => contact.name.toLowerCase() === name.toLowerCase()
    );

    // If a contact with the same name is found
    if (duplicateContact) {
      return res.status(400).json({ message: `You already added ${name}` });
    }

    // If no duplicate is found, the name is available
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

    // Add the conversation to the ConversationLog collection
    const log = await ConversationLog.findOne({ userId, contactId });
    if (log) {
      log.conversationHistory.push({
        date: new Date(),
        content: whatWeTalkedAbout,
      });
      await log.save();
    } else {
      await ConversationLog.create({
        userId,
        contactId,
        conversationHistory: [{ date: new Date(), content: whatWeTalkedAbout }],
      });
    }

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
