import dotenv from "dotenv";
dotenv.config();

import bodyParser from "body-parser";
import chalk from "chalk";
import cors from "cors";
import express from "express";
import connectDB from "./db/connect.js";
import contactRoutes from "./routes/ContactRoute.js";
import conversationRoutes from "./routes/ConversationRoute.js";
import LLMRoutes from "./routes/LLMRoute.js";
import scheduleRoutes from "./routes/ScheduleRoute.js";
import userRoutes from "./routes/UserRoute.js";
import "./workers/embeddingWorker.js";

import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter.js";
import { ExpressAdapter } from "@bull-board/express";
import { embeddingQueue } from "./services/queueService.js";

import "./jobs/checkInReminder.js";

// Destructure environment variables with fallback values
const { PORT = 3000, MONGO_URI, QUEUE_VISUALIZER_PORT = 4000 } = process.env;
const log = console.log;

// Create main Express app
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Register API routes
app.use("/api/v1/conversation", conversationRoutes);
app.use("/api/v1/schedule", scheduleRoutes);
app.use("/api/v1/contact", contactRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/llm", LLMRoutes);

// BullMQ Visualizer setup
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [new BullMQAdapter(embeddingQueue)],
  serverAdapter,
});

app.use("/admin/queues", serverAdapter.getRouter());

// Start the application
const start = async () => {
  try {
    // Connect to the database
    await connectDB(MONGO_URI);

    // Start the main server using your local IP
    app.listen(PORT, "0.0.0.0", () => {
      log(chalk.blue(`Server running at http://10.0.0.206:${PORT}/`));
    });

    // Start the BullMQ visualizer on a separate port
    const visualizerApp = express();
    visualizerApp.use("/admin/queues", serverAdapter.getRouter());
    visualizerApp.listen(QUEUE_VISUALIZER_PORT, () => {
      log(
        chalk.yellow(
          `Queue Visualizer running at http://10.0.0.206:${QUEUE_VISUALIZER_PORT}/admin/queues`
        )
      );
      log(chalk.blue(`Ensure Redis is running on port 6379 (default).`));
    });
  } catch (error) {
    log(chalk.red(`Error starting the server: ${error}`));
  }
};

start();
