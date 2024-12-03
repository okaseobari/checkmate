import dotenv from "dotenv";
dotenv.config();

import { redisOptions } from "../config/redisOptions.js";
import { Worker } from "bullmq";
import chalk from "chalk"; // Import chalk for colored logs
import Conversation from "../models/ConversationModel.js";
import { getEmbeddings } from "../services/LLMService.js";

// Helper function to format logs with a consistent style
const logWithTimestamp = (message, jobId = "", logType = "info") => {
  const timestamp = new Date().toISOString();
  const baseLog = `[${timestamp}] [Worker: embedding] [Job ${jobId}]`;
  switch (logType) {
    case "info":
      console.log(chalk.blue(`${baseLog} ${message}`));
      break;
    case "success":
      console.log(chalk.green(`${baseLog} ${message}`));
      break;
    case "error":
      console.log(chalk.red(`${baseLog} ${message}`));
      break;
    case "warning":
      console.log(chalk.yellow(`${baseLog} ${message}`));
      break;
    default:
      console.log(`${baseLog} ${message}`);
  }
};

// Worker to process embedding jobs
const embeddingWorker = new Worker(
  "embeddingQueue",
  async (job) => {
    const { conversation } = job.data;
    const { _id: conversationId } = conversation;

    logWithTimestamp(
      `Started processing embeddings for conversation ${conversationId}`,
      job.id,
      "info"
    );

    try {
      // Fetch the conversation from the database
      const conversationRecord = await Conversation.findOne({
        _id: conversationId,
      });

      if (!conversationRecord) {
        const errorMessage = `Conversation with ID ${conversationId} not found`;
        logWithTimestamp(errorMessage, job.id, "error");
        throw new Error(errorMessage);
      }

      if (
        conversationRecord.embeddings &&
        conversationRecord.embeddings.length > 0
      ) {
        logWithTimestamp(
          `Embeddings already exist for conversation ${conversationId}`,
          job.id,
          "warning"
        );
        return;
      }

      // Prepare the details for embedding generation
      const formattedDetails = JSON.stringify(
        conversationRecord.checkInDetails
      );
      logWithTimestamp(
        `Generating embeddings for conversation ${conversationId}`,
        job.id,
        "info"
      );
      const embeddings = await getEmbeddings(formattedDetails);

      if (!embeddings || embeddings.length === 0) {
        const errorMessage = `Failed to generate embeddings for conversation ${conversationId}`;
        logWithTimestamp(errorMessage, job.id, "error");
        throw new Error(errorMessage);
      }

      // Save the embeddings to the conversation
      conversationRecord.embeddings = embeddings;
      await conversationRecord.save();

      logWithTimestamp(
        `Embeddings generated and saved successfully for conversation ${conversationId}`,
        job.id,
        "success"
      );
    } catch (error) {
      logWithTimestamp(`Failed: ${error.message}`, job.id, "error");
      throw error; // Ensure the job is retried if it fails
    }
  },
  {
    connection: redisOptions,
    settings: { retryProcessDelay: 5000 }, // Retry delay for failed jobs
  }
);

// Worker lifecycle event listeners with enhanced logging
embeddingWorker.on("waiting", (jobId) => {
  logWithTimestamp(`Job is waiting: ${jobId}`, "", "info");
});

embeddingWorker.on("active", (job) => {
  logWithTimestamp(`Job is now active: ${job.id}`, "", "info");
});

embeddingWorker.on("stalled", (job) => {
  logWithTimestamp(`Job is stalled: ${job.id}`, "", "warning");
});

embeddingWorker.on("completed", (job) => {
  logWithTimestamp(`Job completed successfully`, job.id, "success");
});

embeddingWorker.on("failed", (job, err) => {
  logWithTimestamp(`Job failed: ${err.message}`, job.id, "error");
});

// Graceful shutdown handling with clear logs
process.on("SIGTERM", handleShutdown);
process.on("SIGINT", handleShutdown);

async function handleShutdown() {
  logWithTimestamp(
    "Shutdown signal received: closing embedding worker...",
    "",
    "info"
  );
  await embeddingWorker.close();
  process.exit(0);
}
