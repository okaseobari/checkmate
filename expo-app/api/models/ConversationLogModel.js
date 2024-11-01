import mongoose from "mongoose";
import { embeddingQueue } from "../services/queueService.js";

const conversationLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Contact",
    required: true,
  },
  conversationHistory: [
    {
      date: { type: Date, default: Date.now },
      checkInDetails: { type: Map, of: String },
      embeddings: {
        type: [Number],
        default: [],
      },
    },
  ],
});

// Schema method to add a conversation
conversationLogSchema.methods.addConversation = async function (
  checkInDetails,
  authToken
) {
  const newConversation = {
    date: new Date(),
    checkInDetails,
  };

  // Push the new conversation entry to the history
  this.conversationHistory.push(newConversation);

  // Save the updated document
  const savedLog = await this.save();

  // Get the ID of the last conversation in the history (the newly added one)
  const conversationHistoryId =
    savedLog.conversationHistory[savedLog.conversationHistory.length - 1]._id;

  // Add a job to the queue
  await embeddingQueue.add("generateEmbeddings", {
    contactId: this.contactId,
    conversationLogId: this._id,
    conversationIndex: savedLog.conversationHistory.length - 1,
    conversationHistoryId,
    authToken,
  });

  return savedLog;
};

// Schema method to find or create a conversation log
conversationLogSchema.statics.findOrCreateLog = async function (
  userId,
  contactId
) {
  let log = await this.findOne({ userId, contactId });
  if (!log) {
    log = await this.create({ userId, contactId, conversationHistory: [] });
  }
  return log;
};

// Schema method to get all logs for a user
conversationLogSchema.statics.getAllLogsForUser = async function (userId) {
  return this.find({ userId }).populate({ path: "contactId", select: "name" });
};

// Schema method to get a log for a specific contact
conversationLogSchema.statics.getLogForContact = async function (
  userId,
  contactId
) {
  return this.findOne({ userId, contactId });
};

// Schema method to delete a log for a specific contact
conversationLogSchema.statics.deleteLogForContact = async function (
  userId,
  contactId
) {
  return this.deleteOne({ userId, contactId });
};

const ConversationLog = mongoose.model(
  "ConversationLog",
  conversationLogSchema
);

export default ConversationLog;
