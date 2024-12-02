import express from "express";
import {
  addContact,
  checkDuplicateName,
  deleteContact,
  generateContactInsights,
  getAllContacts,
  getContact,
  logCheckIn,
  updateContact,
} from "../controllers/ContactController.js";
import { protect } from "../middleware/authMiddleware.js";

const contactRouter = express.Router();

// Protect all routes under this router
contactRouter.use(protect);

// Route for checking if a contact name is duplicated for a user
contactRouter.get("/check-duplicate/:name", checkDuplicateName);

// Get all contacts for a user, create a contact
contactRouter
  .route("/")
  .get(getAllContacts) // Get all contacts for a user
  .post(addContact); // Create a new contact for a user

// Get, update, or delete a contact by contact ID for a specific user
contactRouter
  .route("/:contactId")
  .get(getContact) // Get a specific contact for a user
  .put(updateContact) // Update a specific contact for a user
  .delete(deleteContact); // Delete a specific contact for a user

// Route for logging a check-in
contactRouter.put("/:contactId/log-checkin", logCheckIn);

// Route for generating contact insights
contactRouter.get("/:contactId/insights", generateContactInsights); // Generate insights for a contact

export default contactRouter;
