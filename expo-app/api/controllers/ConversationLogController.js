const ConversationLog = require("../models/ConversationLogModel");

// Add a conversation to the log
const addConversation = async (req, res) => {
  const userId = req.user._id;
  const { contactId } = req.params;
  const { checkInDetails } = req.body;

  try {
    // Find or create the conversation log for the user and contact
    const log = await ConversationLog.findOrCreateLog(userId, contactId);

    // Add a new conversation entry with check-in details
    await log.addConversation(checkInDetails);

    res.status(201).json({ message: "Conversation added" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all conversations for a specific contact
const getConversations = async (req, res) => {
  const userId = req.user._id;
  const { contactId } = req.params;

  try {
    const log = await ConversationLog.getLogForContact(userId, contactId);

    if (!log) {
      return res.status(404).json({ message: "No conversation history found" });
    }

    res.status(200).json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all conversations for all contacts of a user
const getAllConversations = async (req, res) => {
  const userId = req.user._id;

  try {
    const logs = await ConversationLog.getAllLogsForUser(userId);

    if (!logs.length) {
      return res
        .status(404)
        .json({ message: "No conversation history found for any contact." });
    }

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addConversation,
  getConversations,
  getAllConversations,
};
