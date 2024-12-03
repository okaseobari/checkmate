import dotenv from "dotenv";
dotenv.config();

import { Worker } from "bullmq";
import chalk from "chalk"; // Import chalk for colored logs
import { redisOptions } from "../config/redisOptions.js";
import Contact from "../models/ContactModel.js";
import { callLLM } from "../services/LLMService.js";

// Helper function to format logs with a consistent style
const logWithTimestamp = (message, jobId = "", logType = "info") => {
  const timestamp = new Date().toISOString();
  const baseLog = `[${timestamp}] [Worker: preferenceExtraction] [Job ${jobId}]`;
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

// Worker to process preference extraction jobs
const preferenceExtractionWorker = new Worker(
  "preferenceExtractionQueue",
  async (job) => {
    const { conversation } = job.data;
    const { contactId, _id: conversationId } = conversation;

    logWithTimestamp(
      `Started processing preference extraction for conversation ${conversationId}`,
      job.id,
      "info"
    );

    try {
      // Step 1: Fetch the conversation from the database
      if (!conversation) {
        const errorMessage = `Conversation with ID ${conversationId} not found`;
        logWithTimestamp(errorMessage, job.id, "error");
        throw new Error(errorMessage);
      }

      logWithTimestamp(
        `Fetched conversation for ID ${conversationId}. Proceeding with preference extraction.`,
        job.id,
        "info"
      );

      // Step 2: Extract preferences using the LLM via `callLLM`
      logWithTimestamp(`Calling LLM to extract preferences...`, job.id, "info");
      const prompt = `
        You are an AI assistant tasked with extracting preferences from a conversation.
        The conversation is provided as a 'note'. Focus on hobbies, interests, activities, likes/dislikes, and preferred items. 
        Return preferences as a JSON object with key-value pairs. Values can be strings or arrays of strings.

        Example Conversation:
        "I love hiking, camping, and playing the guitar. I really dislike rainy days."

        Example Response:
        {
          "hobbies": ["hiking", "camping", "playing guitar"],
          "dislikes": ["rainy days"]
        }

        Conversation to analyze:
        ${conversation.checkInDetails.note}
      `;

      const llmResponse = await callLLM(prompt);

      let extractedPreferences;
      try {
        extractedPreferences = JSON.parse(llmResponse); // Ensure valid JSON
        logWithTimestamp(
          `Preferences successfully extracted: ${JSON.stringify(
            extractedPreferences
          )}`,
          job.id,
          "success"
        );
      } catch (error) {
        const errorMessage = "LLM response is not valid JSON";
        logWithTimestamp(errorMessage, job.id, "error");
        throw new Error(errorMessage);
      }

      // Step 3: Update preferences using the schema method
      const updatedContact = await Contact.findByIdAndUpdate(
        contactId,
        { $set: { preferences: extractedPreferences } },
        { new: true }
      );

      if (!updatedContact) {
        const errorMessage = `Contact with ID ${contactId} not found`;
        logWithTimestamp(errorMessage, job.id, "error");
        throw new Error(errorMessage);
      }

      logWithTimestamp(
        `Preferences updated successfully for contact ${updatedContact.name}.`,
        job.id,
        "success"
      );
    } catch (error) {
      logWithTimestamp(
        `Failed processing job: ${error.message}`,
        job.id,
        "error"
      );
      throw error; // Ensure the job is retried if it fails
    }
  },
  {
    connection: redisOptions,
    settings: { retryProcessDelay: 5000 }, // Retry delay for failed jobs
  }
);

// Worker lifecycle event listeners
preferenceExtractionWorker.on("waiting", (jobId) => {
  logWithTimestamp(`Job is waiting: ${jobId}`, "", "info");
});

preferenceExtractionWorker.on("active", (job) => {
  logWithTimestamp(`Job is now active: ${job.id}`, "", "info");
});

preferenceExtractionWorker.on("stalled", (job) => {
  logWithTimestamp(`Job is stalled: ${job.id}`, "", "warning");
});

preferenceExtractionWorker.on("completed", (job) => {
  logWithTimestamp(`Job completed successfully`, job.id, "success");
});

preferenceExtractionWorker.on("failed", (job, err) => {
  logWithTimestamp(`Job failed: ${err.message}`, job.id, "error");
});

// Graceful shutdown handling with clear logs
process.on("SIGTERM", handleShutdown);
process.on("SIGINT", handleShutdown);

async function handleShutdown() {
  logWithTimestamp("Shutdown signal received. Closing worker...", "", "info");
  await preferenceExtractionWorker.close();
  process.exit(0);
}
