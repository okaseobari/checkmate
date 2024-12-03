// services/queueService.js
import { Queue } from "bullmq";
import { redisOptions } from "../config/redisOptions.js"; // Ensure you have Redis configuration

export const embeddingQueue = new Queue("embeddingQueue", {
  connection: redisOptions,
});

export const preferenceExtractionQueue = new Queue("preferenceExtractionQueue", {
  connection: redisOptions,
});
