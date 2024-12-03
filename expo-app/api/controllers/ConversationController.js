import Conversation from "../models/ConversationModel.js";
import {
  embeddingQueue,
  preferenceExtractionQueue,
} from "../services/queueService.js";
import { generateCheckInNotificationMessage } from "../utils/checkInMessageGenerator.js";

// Add a conversation
const addConversation = async (req, res) => {
  const userId = req.user._id;
  const { contactId } = req.params;
  const { checkInDetails } = req.body;

  try {
    const newConversation = await Conversation.create({
      userId,
      contactId,
      checkInDetails,
    });

    embeddingQueue.add("generateEmbeddings", {
      conversation: newConversation,
    });

    preferenceExtractionQueue.add("extractPreferences", {
      conversation: newConversation,
    });

    res.status(201).json({ message: "Conversation added successfully" });
  } catch (error) {
    console.error(`Error adding conversation: ${error.message}`);
    res.status(500).json({ message: "Failed to add conversation" });
  }
};

// Get a specific conversation by ID
const getConversationById = async (req, res) => {
  const userId = req.user._id;
  const { conversationId } = req.params;

  try {
    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId,
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    res.status(200).json(conversation);
  } catch (error) {
    console.error(`Error fetching conversation: ${error.message}`);
    res.status(500).json({ message: "Failed to fetch conversation" });
  }
};

// Get all conversations for a specific contact
const getConversationsForContact = async (req, res) => {
  const userId = req.user._id;
  const { contactId } = req.params;

  try {
    const conversations = await Conversation.find({ userId, contactId });

    if (!conversations.length) {
      return res.status(404).json({ message: "No conversation history found" });
    }

    res.status(200).json(conversations);
  } catch (error) {
    console.error(`Error fetching conversations: ${error.message}`);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
};

// Get all conversations for a user
const getAllConversationsForUser = async (req, res) => {
  const userId = req.user._id;

  try {
    const conversations = await Conversation.find({ userId });

    if (!conversations.length) {
      return res
        .status(404)
        .json({ message: "No conversation history found for the user" });
    }

    res.status(200).json(conversations);
  } catch (error) {
    console.error(`Error fetching conversations: ${error.message}`);
    res.status(500).json({ message: "Failed to fetch conversation history" });
  }
};

// Delete a specific conversation by ID
const deleteConversationById = async (req, res) => {
  const userId = req.user._id;
  const { conversationId } = req.params;

  try {
    const result = await Conversation.deleteOne({
      _id: conversationId,
      userId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    res.status(200).json({ message: "Conversation deleted successfully" });
  } catch (error) {
    console.error(`Error deleting conversation: ${error.message}`);
    res.status(500).json({ message: "Failed to delete conversation" });
  }
};

// Delete all conversations for a specific contact
const deleteConversationsForContact = async (req, res) => {
  const userId = req.user._id;
  const { contactId } = req.params;

  try {
    const result = await Conversation.deleteMany({ userId, contactId });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ message: "No conversation history found to delete" });
    }

    res.status(200).json({
      message: "All conversation history for the contact deleted successfully",
    });
  } catch (error) {
    console.error(`Error deleting conversations: ${error.message}`);
    res.status(500).json({ message: "Failed to delete conversation history" });
  }
};

// Delete all conversations for a user
const deleteAllConversationsForUser = async (req, res) => {
  const userId = req.user._id;

  try {
    const result = await Conversation.deleteMany({ userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: "No conversation history found to delete for the user",
      });
    }

    res.status(200).json({
      message: "All conversation history for the user deleted successfully",
    });
  } catch (error) {
    console.error(`Error deleting conversations: ${error.message}`);
    res.status(500).json({ message: "Failed to delete conversation history" });
  }
};

// Generate a personalized message for a contact
const generateCheckInNotificationMessageForContact = async (req, res) => {
  try {
    const userId = req.user._id;
    const { contactId } = req.params;

    const { notificationHeader, notificationMessage } =
      await generateCheckInNotificationMessage(userId, contactId);

    res.status(200).json({ notificationHeader, notificationMessage });
  } catch (error) {
    console.error(`Error generating personalized message: ${error.message}`);
    res.status(500).json({ message: "Failed to generate message" });
  }
};

export {
  addConversation,
  deleteAllConversationsForUser,
  deleteConversationById,
  deleteConversationsForContact,
  generateCheckInNotificationMessageForContact,
  getAllConversationsForUser,
  getConversationById,
  getConversationsForContact,
};
