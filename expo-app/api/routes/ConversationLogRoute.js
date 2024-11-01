import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  addConversation,
  getConversations,
  getAllConversations,
  deleteConversations,
  generateConversationLogEmbedding,
} from "../controllers/conversationLogController.js";

const conversationLogRouter = express.Router();

// Protect all routes under this router
conversationLogRouter.use(protect);

// Route to get all conversations
conversationLogRouter.route("/").get(getAllConversations);

// Route to get, add, or delete conversations for a specific contact
conversationLogRouter
  .route("/:contactId")
  .get(getConversations) // Get all conversations for a specific contact
  .post(addConversation) // Add a conversation to the log for a specific contact
  .delete(deleteConversations); // Delete all conversations for a specific contact

conversationLogRouter.put(
  "/generate-embeddings/:contactId/conversation/:conversationId",
  generateConversationLogEmbedding
);

export default conversationLogRouter;
