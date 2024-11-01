import dotenv from "dotenv";
dotenv.config();

import { Worker } from "bullmq";
import axios from "axios";
import { redisOptions } from "../config/redisOptions.js";
import ConversationLog from "../models/ConversationLogModel.js";

// Helper function to format logs with a consistent style
const logWithTimestamp = (message, jobId = "") => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [Job ${jobId}] ${message}`);
};

// Worker to process embedding jobs
const embeddingWorker = new Worker(
  "embeddingQueue",
  async (job) => {
    const {
      contactId,
      conversationLogId,
      conversationIndex,
      conversationHistoryId,
      authToken,
    } = job.data;
    logWithTimestamp(
      `Started processing for conversation log ${conversationLogId}`,
      job.id
    );

    try {
      // Fetch the conversation log
      const conversationLog = await ConversationLog.findById(conversationLogId);
      if (!conversationLog) {
        throw new Error(
          `ConversationLog with ID ${conversationLogId} not found`
        );
      }

      const conversation =
        conversationLog.conversationHistory[conversationIndex];
      if (!conversation) {
        throw new Error(`Conversation at index ${conversationIndex} not found`);
      }

      // Prepare the authorization token
      const token = authToken.startsWith("Bearer ")
        ? authToken
        : `Bearer ${authToken}`;

      // Make the PUT request to generate embeddings
      const apiUrl = `${process.env.BASE_URL}/conversation-log/generate-embeddings/${contactId}/conversation/${conversationHistoryId}`;
      const response = await axios.put(
        apiUrl,
        {},
        { headers: { Authorization: token } }
      );

      // Log the response status and message
      logWithTimestamp(
        `API response: ${response.status} ${response.statusText}`,
        job.id
      );
      logWithTimestamp(`API message: ${response.data.message}`, job.id);

      // Validate the response
      if (response.status !== 200 || !response.data.message) {
        throw new Error(
          "Unexpected API response: Embedding generation may not have completed successfully"
        );
      }

      // Update conversation to reflect that the embedding generation request was processed
      conversation.embeddingsGenerated = true;
      await conversationLog.save();

      logWithTimestamp(
        `Embedding generation request confirmed for conversation log ${conversationLogId}`,
        job.id
      );
    } catch (error) {
      logWithTimestamp(`Failed: ${error.message}`, job.id);
      throw error; // Ensure the job is retried if it fails
    }
  },
  {
    connection: redisOptions,
    settings: { retryProcessDelay: 5000 },
  }
);

// Monitor job events with cleaner logs
embeddingWorker.on("completed", (job) => {
  logWithTimestamp("Completed successfully", job.id);
});

embeddingWorker.on("failed", (job, err) => {
  logWithTimestamp(`Failed: ${err.message}`, job.id);
});

// Graceful shutdown handling with clear logs
process.on("SIGTERM", handleShutdown);
process.on("SIGINT", handleShutdown);

async function handleShutdown() {
  logWithTimestamp("Shutdown signal received: closing worker");
  await embeddingWorker.close();
  process.exit(0);
}
