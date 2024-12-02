import chalk from "chalk";

/**
 * Formats supporting data for LLM consumption by structuring contact, conversation, and schedule details.
 *
 * The function performs the following:
 * - Groups conversations by contact ID for clarity and token efficiency.
 * - Groups schedules by contact ID for better traceability.
 * - Formats each contact's details, attaching relevant conversations and schedule entries.
 * - Returns a structured object that includes:
 *    - A list of formatted contacts.
 *    - A summary with total counts of contacts, conversations, and schedules.
 *    - Complete content of contacts, conversations, and schedules if available.
 *
 * Logs:
 * - Key stages of execution for debugging and clarity.
 * - Intermediate and final outputs in a readable format using chalk.
 *
 * @param {Object} data - The input data containing contact, conversation, and schedule details.
 * @param {Array} data.contactDetails - List of contacts with their details.
 * @param {Array} data.conversationDetails - List of conversations with their details.
 * @param {Array} data.scheduleDetails - List of schedule entries with their details.
 *
 * @returns {Object} - The formatted data for LLM, including:
 * - `contacts`: List of contacts with their conversations and schedules.
 * - `summary`: Total number of contacts, conversations, and schedules.
 * - `content`: Full content of contacts, conversations, and schedules if available.
 */
export const formatSupportingData = ({
  contactDetails,
  conversationDetails,
  scheduleDetails,
}) => {
  console.log(
    chalk.green.bold(
      "[formatSupportingData] Starting to format supporting data..."
    )
  );

  // Group conversations by contactId for clarity and optimization
  console.log(
    chalk.blue("[formatSupportingData] Grouping conversations by contactId...")
  );
  const groupedConversations = conversationDetails.reduce(
    (acc, conversation) => {
      const contactId = conversation.contactId?._id.toString();
      const note =
        conversation.checkInDetails.get("note") || "No details available";

      if (!acc[contactId]) {
        acc[contactId] = [];
      }

      acc[contactId].push({
        date: conversation.date.toISOString(),
        note,
      });

      return acc;
    },
    {}
  );

  // Group schedules by contactId for traceability
  console.log(
    chalk.blue("[formatSupportingData] Grouping schedules by contactId...")
  );
  const groupedSchedules = scheduleDetails.reduce((acc, schedule) => {
    const contactId = schedule.contactId.toString();

    if (!acc[contactId]) {
      acc[contactId] = [];
    }

    acc[contactId].push({
      checkInDate: schedule.checkInDate.toISOString(),
      importantEvents: schedule.importantEvents || [],
    });

    return acc;
  }, {});

  // Format contact details and attach grouped conversations and schedules
  console.log(
    chalk.blue("[formatSupportingData] Formatting contact details...")
  );
  const formattedData = contactDetails.map((contact) => {
    const contactId = contact._id.toString();

    return {
      id: contactId,
      name: contact.name,
      birthday: contact.birthday
        ? { month: contact.birthday.month, day: contact.birthday.day }
        : null,
      lastCheckInDate: contact.lastCheckInDate
        ? contact.lastCheckInDate.toISOString()
        : null,
      conversations: groupedConversations[contactId] || [],
      schedules: groupedSchedules[contactId] || [],
    };
  });

  // Create the final supplemental data object
  const supplementalData = {
    contacts: formattedData,
    summary: {
      totalContacts: formattedData.length,
      totalConversations: conversationDetails.length,
      totalSchedules: scheduleDetails.length,
    },
    content: {
      contacts: contactDetails,
      conversations: conversationDetails,
      schedules: scheduleDetails,
    },
  };

  // console.log(
  //   chalk.green.bold("[formatSupportingData] Formatted Data:"),
  //   JSON.stringify(supplementalData, null, 2)
  // );

  return supplementalData;
};
