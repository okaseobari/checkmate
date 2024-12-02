import Conversation from "../models/ConversationModel.js";
import Contact from "../models/ContactModel.js"; // Import Contact model to fetch all contact IDs if needed

/**
 * Fetches conversations based on contact IDs and other filters.
 * Handles cases where `entity` is "all" by omitting `contactId` from the query.
 *
 * @param {Object} params - The parameters for fetching conversations.
 * @param {Array<string>|null} params.contactIds - The IDs of contacts to fetch conversations for.
 * @param {string} params.userId - The ID of the user requesting the data.
 * @param {Object} params.filters - Additional filters like `date`.
 * @param {number|null} params.limit - Limit the number of results.
 * @param {boolean} params.single - Whether to fetch only the most recent conversation.
 * @returns {Array|Object} - List of conversations or a single conversation.
 */
export const fetchConversations = async ({
  contactIds = null,
  userId,
  filters = {},
  limit = null,
  single = false,
}) => {
  if (!userId) {
    throw new Error("User ID is required to fetch conversations.");
  }

  // If `contactIds` is provided but invalid, throw an error
  if (contactIds && (!Array.isArray(contactIds) || contactIds.length === 0)) {
    throw new Error(
      "Invalid or empty contactIds. Unable to fetch conversations."
    );
  }

  // Fields to exclude from the response
  const excludeFields = "-embeddings -userId -createdAt -updatedAt -_id -__v";

  // Build query
  const query = {
    ...(contactIds ? { contactId: { $in: contactIds } } : {}), // Filter by contactId if provided
    userId, // Always filter by userId
    ...(filters.date && { date: filters.date }), // Include date filter if provided
  };

  console.log("[fetchConversations] Query:", query);

  try {
    if (single) {
      // Fetch the most recent conversation
      return await Conversation.findOne(query)
        .sort({ date: -1 })
        .select(excludeFields)
        .populate("contactId", "name");
    }

    const conversations = await Conversation.find(query)
      .sort({ date: -1 })
      .limit(limit || 0) // Use limit if provided, otherwise fetch all
      .select(excludeFields)
      .populate("contactId", "name");

    return conversations;
  } catch (error) {
    console.error("[fetchConversations] Error:", error.message);
    throw new Error("Failed to fetch conversations. Please try again.");
  }
};
