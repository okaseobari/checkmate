const express = require("express");
const contactRouter = express.Router();
const { protect } = require("../middleware/authMiddleware");

// Import contact controller functions
const {
  addContact,
  checkDuplicateName,
  deleteContact,
  getAllContacts,
  getContact,
  logCheckIn,
  updateContact,
} = require("../controllers/ContactController");

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

module.exports = contactRouter;
