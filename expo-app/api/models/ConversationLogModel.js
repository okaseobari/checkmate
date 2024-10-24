const mongoose = require("mongoose");

const conversationLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true, // Tied to the user
  },
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Contact", // Tied to a specific contact
    required: true,
  },
  conversationHistory: [
    {
      date: { type: Date, default: Date.now }, // Date of the conversation
      content: String, // Details of the conversation
    },
  ],
});

const ConversationLog = mongoose.model(
  "ConversationLog",
  conversationLogSchema
);
module.exports = ConversationLog;
