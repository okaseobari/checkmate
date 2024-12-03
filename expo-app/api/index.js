/**
 * @file index.js
 * @description Main entry point for the CheckMate API server. This file initializes the Express server,
 * connects to the MongoDB database, sets up API routes, and configures background jobs and queue visualizations.
 */

import dotenv from "dotenv";
dotenv.config();

// Import middleware and utility libraries
import bodyParser from "body-parser";
import chalk from "chalk"; 
import cors from "cors"; // For enabling Cross-Origin Resource Sharing
import express from "express"; 

// Import database connection function
import connectDB from "./db/connect.js";

// Import route handlers for various API endpoints
import contactRoutes from "./routes/ContactRoute.js";
import conversationRoutes from "./routes/ConversationRoute.js";
import LLMRoutes from "./routes/LLMRoute.js";
import scheduleRoutes from "./routes/ScheduleRoute.js";
import userRoutes from "./routes/UserRoute.js";

// Import worker scripts to initialize background workers
import "./workers/embeddingWorker.js";
import "./workers/preferenceExtractionWorker.js";

// Import BullMQ (Redis-based queue) and Bull Board for queue management
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter.js";
import { ExpressAdapter } from "@bull-board/express";

// Import task queues
import {
  embeddingQueue,
  preferenceExtractionQueue,
} from "./services/queueService.js";

// Import job scripts to initialize scheduled tasks
import "./jobs/checkInReminder.js";

const { PORT = 3000, MONGO_URI, QUEUE_VISUALIZER_PORT = 4000 } = process.env;
const log = console.log;

const app = express();

// Apply middleware to the app
app.use(bodyParser.json());
app.use(cors());

app.use("/api/v1/conversation", conversationRoutes);
app.use("/api/v1/schedule", scheduleRoutes);
app.use("/api/v1/contact", contactRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/llm", LLMRoutes); // Routes for LLM-related actions (e.g., AI integrations)

// BullMQ Visualizer setup for monitoring and managing queues
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues"); 

createBullBoard({
  queues: [
    new BullMQAdapter(embeddingQueue), 
    new BullMQAdapter(preferenceExtractionQueue),
  ],
  serverAdapter, // Link the server adapter to the visualizer
});

// Add Bull Board UI route to the app
app.use("/admin/queues", serverAdapter.getRouter());

/**
 * @function start
 * @description Connects to the database, starts the Express server, and initializes the Bull Board visualizer.
 */
const start = async () => {
  try {
    // Connect to the MongoDB database
    await connectDB(MONGO_URI);

    // Start the main server
    app.listen(PORT, "0.0.0.0", () => {
      log(chalk.blue(`Server running at http://10.0.0.206:${PORT}/`)); // Local IP
    });

    // Set up a separate Express app for the Bull Board visualizer
    const visualizerApp = express();
    visualizerApp.use("/admin/queues", serverAdapter.getRouter()); // Add Bull Board routes
    visualizerApp.listen(QUEUE_VISUALIZER_PORT, () => {
      log(
        chalk.yellow(
          `Queue Visualizer running at http://10.0.0.206:${QUEUE_VISUALIZER_PORT}/admin/queues`
        )
      );
      log(chalk.blue(`Ensure Redis is running on port 6379 (default).`)); // Reminder for Redis
    });
  } catch (error) {
    log(chalk.red(`Error starting the server: ${error}`));
  }
};

start();
