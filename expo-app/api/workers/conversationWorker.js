import dotenv from "dotenv";
dotenv.config();

import { redisOptions } from "../config/redisOptions.js";
import { Worker } from "bullmq";
import Conversation from "../models/ConversationModel.js";
import LLMService from "../services/LLMService.js";

// Helper function to format logs with a consistent style
const logWithTimestamp = (message, jobId = "") => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [Worker: conversation] [Job ${jobId}] ${message}`);
};

// Worker to process embedding jobs
const embeddingWorker = new Worker(
  "embeddingQueue",
  async (job) => {
    const { conversationId } = job.data;
    logWithTimestamp(
      `Started processing for conversation ${conversationId}`,
      job.id
    );

    try {
      // Fetch the conversation from the database
      const conversation = await Conversation.findOne({ _id: conversationId });

      if (!conversation) {
        throw new Error(`Conversation with ID ${conversationId} not found`);
      }

   

      logWithTimestamp(
        `Embeddings generated and saved successfully for conversation ${conversationId}`,
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
  console.log("Shutdown signal received: closing embedding worker...");
  await embeddingWorker.close();
  process.exit(0);
}
