const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const connectDB = require("./db/connect");
const contactRoutes = require("./routes/ContactRoute");
const userRoutes = require("./routes/UserRoute");
const scheduleRoutes = require("./routes/ScheduleRoute");
const conversationLogRoutes = require("./routes/ConversationLogRoute");
require("dotenv").config(); // Ensure environment variables like JWT_SECRET are available

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
