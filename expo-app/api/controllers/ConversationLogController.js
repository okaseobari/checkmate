import ConversationLog from "../models/ConversationLogModel.js";
import LLMService from "../services/LLMService.js";

// Add a conversation to the log
const addConversation = async (req, res) => {
  const userId = req.user._id;
  const { contactId } = req.params;
  const { checkInDetails } = req.body;
  const authToken = req.headers.authorization;

  try {
    const log = await ConversationLog.findOrCreateLog(userId, contactId);
    await log.addConversation(checkInDetails, authToken);
    res.status(201).json({ message: "Conversation added" });
  } catch (error) {
    console.error(`Error adding conversation: ${error.message}`);
    res.status(500).json({ message: "Failed to add conversation" });
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
    console.error(`Error fetching conversations: ${error.message}`);
    res.status(500).json({ message: "Failed to fetch conversations" });
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
    console.error(`Error fetching all conversations: ${error.message}`);
    res.status(500).json({ message: "Failed to fetch conversation history" });
  }
};

// Delete all conversations for a specific contact
const deleteConversations = async (req, res) => {
  const userId = req.user._id;
  const { contactId } = req.params;

  try {
    const result = await ConversationLog.deleteLogForContact(userId, contactId);
    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ message: "No conversation history found to delete" });
    }
    res
      .status(200)
      .json({ message: "Conversation history deleted successfully" });
  } catch (error) {
    console.error(`Error deleting conversation: ${error.message}`);
    res.status(500).json({ message: "Failed to delete conversation history" });
  }
};

// Generate embeddings for a specific conversation
const generateConversationLogEmbedding = async (req, res) => {
  try {
    const userId = req.user._id;
    const { contactId, conversationId } = req.params;

    const log = await ConversationLog.findOne({ userId, contactId });
    if (!log) {
      return res.status(404).json({ message: "Conversation log not found" });
    }

    const conversation = log.conversationHistory.id(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (conversation.embeddings && conversation.embeddings.length > 0) {
      return res
        .status(400)
        .json({ message: "Embeddings already exist for this conversation" });
    }

    const formattedDetails = JSON.stringify(conversation.checkInDetails);
    const embeddings = await LLMService.getEmbeddings(formattedDetails);

    if (!embeddings || embeddings.length === 0) {
      return res.status(500).json({ message: "Failed to generate embeddings" });
    }

    conversation.embeddings = embeddings;
    await log.save();

    res
      .status(200)
      .json({ message: "Embeddings generated and saved successfully" });
  } catch (error) {
    console.error(`Error generating embeddings: ${error.message}`);
    res.status(500).json({ message: "Internal server error" });
  }
};

export {
  addConversation,
  getConversations,
  getAllConversations,
  deleteConversations,
  generateConversationLogEmbedding,
};
