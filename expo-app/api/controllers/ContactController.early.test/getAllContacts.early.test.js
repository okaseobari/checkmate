// Unit tests for: getAllContacts

import Contact from "../../models/ContactModel.js";
import { getAllContacts } from "../ContactController";

jest.mock("../../models/ContactModel.js");

describe("getAllContacts() getAllContacts method", () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: {
        _id: "user123",
      },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe("Happy Path", () => {
    it("should return a list of contacts for the user", async () => {
      // Arrange: Mock the Contact.find method to return a list of contacts
      const mockContacts = [
        { name: "Alice", relationship: "Friend" },
        { name: "Bob", relationship: "Colleague" },
      ];
      Contact.find.mockResolvedValue(mockContacts);

      // Act: Call the getAllContacts function
      await getAllContacts(req, res);

      // Assert: Check that the response status is 200 and the contacts are returned
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockContacts);
    });
  });

  describe("Edge Cases", () => {
    it("should return an empty array if the user has no contacts", async () => {
      // Arrange: Mock the Contact.find method to return an empty array
      Contact.find.mockResolvedValue([]);

      // Act: Call the getAllContacts function
      await getAllContacts(req, res);

      // Assert: Check that the response status is 200 and an empty array is returned
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it("should handle errors and return a 500 status code", async () => {
      // Arrange: Mock the Contact.find method to throw an error
      const errorMessage = "Database error";
      Contact.find.mockRejectedValue(new Error(errorMessage));

      // Act: Call the getAllContacts function
      await getAllContacts(req, res);

      // Assert: Check that the response status is 500 and the error message is returned
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });
});

// End of unit tests for: getAllContacts
