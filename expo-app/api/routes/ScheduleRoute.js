import express from "express";
import {
  deleteCheckIn,
  getUserSchedule,
  regenerateSchedule,
  updateCheckIn,
} from "../controllers/ScheduleController.js";
import { protect } from "../middleware/authMiddleware.js";

const scheduleRouter = express.Router();

// Protect all routes under this router
scheduleRouter.use(protect);

// Routes for schedule actions
scheduleRouter.route("/").get(getUserSchedule); // Fetch the schedule for a specific user

scheduleRouter.route("/generate").post(regenerateSchedule); // Generate the entire schedule for a user

scheduleRouter
  .route("/check-in/:checkInId")
  .put(updateCheckIn) // Update a specific check-in for a user
  .delete(deleteCheckIn); // Delete a specific check-in for a user

export default scheduleRouter;
