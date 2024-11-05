import express from "express";
import {
  addConversation,
  deleteAllConversationsForUser,
  deleteConversationById,
  deleteConversationsForContact,
  generateCheckInNotificationMessageForContact,
  getAllConversationsForUser,
  getConversationById,
  getConversationsForContact,
} from "../controllers/ConversationController.js";
import { protect } from "../middleware/authMiddleware.js";

const conversationRouter = express.Router();

// Apply protection middleware to all routes in this router
conversationRouter.use(protect);

// Routes for managing conversations
conversationRouter
  .route("/")
  .get(getAllConversationsForUser) // Get all conversations for a user
  .delete(deleteAllConversationsForUser); // Delete all conversations for a user

conversationRouter
  .route("/contactId/:contactId")
  .get(getConversationsForContact) // Get conversations for a specific contact
  .post(addConversation) // Add a conversation to a specific contact's log
  .delete(deleteConversationsForContact); // Delete all conversations for a specific contact

// Route to delete a specific conversation by conversationId
conversationRouter
  .route("/conversationId/:conversationId")
  .get(getConversationById)
  .delete(deleteConversationById);

// Route to generate a personalized message
conversationRouter.get(
  "/contact/:contactId/checkIn-notification-message",
  generateCheckInNotificationMessageForContact
);

export default conversationRouter;
