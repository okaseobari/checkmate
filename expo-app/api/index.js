
import dotenv from "dotenv";
dotenv.config(); 

import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import connectDB from "./db/connect.js";
import contactRoutes from "./routes/ContactRoute.js";
import conversationLogRoutes from "./routes/ConversationLogRoute.js";
import LLMRoutes from "./routes/LLMRoute.js";
import scheduleRoutes from "./routes/ScheduleRoute.js";
import userRoutes from "./routes/UserRoute.js";
import './workers/embeddingWorker.js';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());


// Routes
app.use("/api/v1/conversation-log", conversationLogRoutes);
app.use("/api/v1/schedule", scheduleRoutes);
app.use("/api/v1/contact", contactRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/llm", LLMRoutes);

const start = async () => {
  try {
    // Connect to the database
    await connectDB(process.env.MONGO_URI);

    // Start the server
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}/`);
    });
  } catch (error) {
    console.log(error);
  }
};

start();
