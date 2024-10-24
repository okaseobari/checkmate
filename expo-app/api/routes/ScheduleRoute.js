const express = require("express");
const scheduleRouter = express.Router();
const {
  getUserSchedule,
  regenerateSchedule,
  updateCheckIn,
  deleteCheckIn,
} = require("../controllers/ScheduleController");
const { protect } = require("../middleware/authMiddleware");

// Protect all routes under this router
scheduleRouter.use(protect);

// Routes for schedule actions
scheduleRouter.route("/").get(getUserSchedule); // Fetch the schedule for a specific user

scheduleRouter.route("/generate").post(regenerateSchedule); // Generate the entire schedule for a user

scheduleRouter
  .route("/check-in/:checkInId")
  .put(updateCheckIn) // Update a specific check-in for a user
  .delete(deleteCheckIn); // Delete a specific check-in for a user

module.exports = scheduleRouter;
