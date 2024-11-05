import mongoose from "mongoose";

// Define conversation schema for individual entries
const conversationSchema = new mongoose.Schema({
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
  date: {
    type: Date,
    default: Date.now,
  },
  checkInDetails: {
    type: Map,
    of: String,
  },
  embeddings: {
    type: [Number],
    default: [],
  },
});

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
