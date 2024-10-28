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

// Schema methods

// Add a conversation entry for a specific user and contact
conversationLogSchema.methods.addConversation = async function (checkInDetails) {
  this.conversationHistory.push({ checkInDetails });
  return this.save();
};

// Static method to find or create a conversation log
conversationLogSchema.statics.findOrCreateLog = async function (userId, contactId) {
  let log = await this.findOne({ userId, contactId });

  if (!log) {
    log = await this.create({
      userId,
      contactId,
      conversationHistory: [],
    });
  }

  return log;
};

// Static method to get all logs for a user
conversationLogSchema.statics.getAllLogsForUser = async function (userId) {
  return this.find({ userId });
};

// Static method to get log for a specific contact
conversationLogSchema.statics.getLogForContact = async function (userId, contactId) {
  return this.findOne({ userId, contactId });
};

const ConversationLog = mongoose.model("ConversationLog", conversationLogSchema);
module.exports = ConversationLog;