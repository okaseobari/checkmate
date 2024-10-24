const express = require("express");
const conversationLogRouter = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  addConversation,
  getConversations,
  getAllConversations,
} = require("../controllers/conversationLogController");

// Protect all routes under this router
conversationLogRouter.use(protect);

// Route to get all conversations or add a conversation for a specific contact
conversationLogRouter.route("/").get(getAllConversations);

// Route to get conversations for a specific contact or add a conversation
conversationLogRouter
  .route("/:contactId")
  .get(getConversations) // Get all conversations for a specific contact
  .post(addConversation); // Add a conversation to the log for a specific contact

module.exports = conversationLogRouter;
