import Contact from "../models/ContactModel.js";
import chalk from "chalk";

/**
 * Fetches contact details based on the provided parameters.
 * Handles "all" contacts for a user or filters by specific criteria.
 * Always includes the "name" field in the result.
 * Triggers clarification if specific requested contacts are not found.
 *
 * @param {Object} params - Parameters for fetching contacts.
 * @param {string} params.userId - The ID of the user requesting the resolution.
 * @param {Object} [params.filters] - Optional filters for fetching specific contacts.
 * @param {Array<string>} [params.fields] - Fields to include in the result.
 * @returns {Array|Object} Resolved contacts or a clarification response.
 */
export const fetchContacts = async ({ userId, filters = {}, fields = [] }) => {
  if (!userId) {
    throw new Error("User ID is required to fetch contacts.");
  }

  console.log("[fetchContacts] Resolving contacts...");

  // Always include the "name" field in the query
  const projection = [...fields, "name"]; // Ensure "name" is always included

  // Build the query
  const query = { userId, ...filters };

  try {
    const contacts = await Contact.find(query)
      .select(projection.join(" "))
      .lean();

    console.log(
      chalk.green(`[fetchContacts] Resolved ${contacts.length} contacts.`)
    );

    // Check for missing contacts if filters include specific IDs
    if (filters._id && Array.isArray(filters._id.$in)) {
      const foundIds = contacts.map((contact) => contact._id.toString());
      const missingIds = filters._id.$in.filter((id) => !foundIds.includes(id));

      if (missingIds.length > 0) {
        return {
          clarificationNeeded: true,
          message: `The following contacts were not found: ${missingIds.join(
            ", "
          )}. Please refine your query.`,
          options: [],
        };
      }
    }

    return contacts;
  } catch (error) {
    console.error(
      chalk.red.bold("[fetchContacts] Failed to fetch contacts:"),
      error.message
    );
    throw new Error("Failed to fetch contacts. Please try again.");
  }
};

/**
 * Fetches contact IDs based on the provided parameters or retrieves all IDs.
 * Handles "all" contacts for a user or filters by specific criteria.
 * Triggers clarification if specific requested contacts are not found.
 *
 * @param {Object} params - Parameters for fetching contact IDs.
 * @param {string} params.userId - The ID of the user requesting the resolution.
 * @param {Object} [params.filters] - Optional filters for fetching specific contacts.
 * @returns {Array|Object} Resolved contact IDs or a clarification response.
 */
export const fetchContactIds = async ({ userId, filters = {} }) => {
  try {
    // Fetch contacts using the updated fetchContacts function
    const contacts = await fetchContacts({
      userId,
      filters,
      fields: ["_id"], // Only fetch IDs
    });

    // If clarification is needed, return the clarification response
    if (contacts.clarificationNeeded) {
      console.warn(
        chalk.yellow(
          `[fetchContactIds] Clarification needed: ${contacts.message}`
        )
      );
      return contacts;
    }

    // Map contact IDs and return
    const contactIds = contacts.map((contact) => contact._id.toString());
    console.log(
      chalk.green(
        `[fetchContactIds] Resolved ${contactIds.length} contact IDs.`
      )
    );
    return contactIds;
  } catch (error) {
    console.error(
      chalk.red.bold("[fetchContactIds] Failed to fetch contact IDs:"),
      error.message
    );
    throw new Error("Failed to fetch contact IDs. Please try again.");
  }
};
