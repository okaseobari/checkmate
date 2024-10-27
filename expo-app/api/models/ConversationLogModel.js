const mongoose = require("mongoose");

const conversationLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: true,
  },
  conversationHistory: [
    {
      date: { type: Date, default: Date.now },
      checkInDetails: { type: Map, of: String }, // Dynamic key-value pairs
    },
  ],
});

const ConversationLog = mongoose.model("ConversationLog", conversationLogSchema);
module.exports = ConversationLog;