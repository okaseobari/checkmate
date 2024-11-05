/**
 * Constructs detailed prompts for generating personalized messages and notification reminders using the LLM service.
 * @param {object} contact - The contact object containing name, importantDates, and lastCheckInDate.
 * @param {Array<object>} conversations - An array of conversation objects with date and checkInDetails.
 * @returns {object} - An object containing the full message prompt and the notification prompt for the LLM.
 */
export const buildPersonalizedMessagePrompt = (contact, conversations) => {
  // Ensure importantDates exists to prevent potential errors
  const importantDates = contact.importantDates || [];
  const now = new Date();

  // Separate past and upcoming important dates
  const pastEvents = importantDates.filter(
    (event) => new Date(event.date) < now
  );
  const upcomingEvents = importantDates.filter(
    (event) => new Date(event.date) >= now
  );

  // Extract and format recent conversations
  const conversationSummary = conversations.length
    ? conversations
        .map((conv) => {
          const note =
            conv.checkInDetails.get("note") || "No details available";
          return `${conv.date.toDateString()}: ${note}`;
        })
        .join("\n")
    : "No recent conversations found.";

  // Format past events
  const pastEventsSummary = pastEvents.length
    ? pastEvents
        .map(
          (event) =>
            `${new Date(event.date).toDateString()}: ${event.description}`
        )
        .join("\n")
    : "No significant past events.";

  // Format upcoming events
  const upcomingEventsSummary = upcomingEvents.length
    ? upcomingEvents
        .map(
          (event) =>
            `${new Date(event.date).toDateString()}: ${event.description}`
        )
        .join("\n")
    : "No upcoming events.";

  // Format last check-in date
  const lastCheckInDate = contact.lastCheckInDate
    ? `Last checked in on: ${new Date(contact.lastCheckInDate).toDateString()}`
    : "No prior check-in date available.";

  // Full message prompt for generating a check-in message
  //TODO do we need this
  const fullMessagePrompt = `
    Create a warm, thoughtful message for the user to send to ${contact.name} to strengthen their connection. Here are some details to consider:

    1. **Last Check-In Date**:
       ${lastCheckInDate}
  
    2. **Recent Conversations**:
       Mention significant topics from recent interactions, such as shared activities, achievements, or challenges. Here's a summary:
       ${conversationSummary}
  
    3. **Past Significant Events**:
       Acknowledge notable past events in ${contact.name}'s life to show thoughtfulness. Summary of past events:
       ${pastEventsSummary}
  
    4. **Upcoming Important Dates**:
       Reference upcoming plans or milestones ${contact.name} is looking forward to, like trips or celebrations. Summary of upcoming events:
       ${upcomingEventsSummary}
  
    Keep the message personal, empathetic, and engaging, and invite further conversation or show support as needed.
  `;

  // Notification prompt for generating a short reminder
  const notificationPrompt = `
  Create a lively, witty notification header and a concise message for the user to remind them to check in with ${contact.name}. The style should be informal, humorous, and reminiscent of Ryan Reynolds' Deadpool—sarcastic, charming, and playful. Use the details below:

  - **Last Check-In Date**: ${lastCheckInDate}
  - **Recent Conversations**: ${conversationSummary}
  - **Past Significant Events**: ${pastEventsSummary}
  - **Upcoming Important Dates**: ${upcomingEventsSummary}

  The output must fit within a phone notification bubble:
  - **Notification Header**: Under 28 characters.
  - **Notification Message**: Under 100 characters.

  Prioritize referencing recent conversations and upcoming events if space is limited. Include witty, engaging elements like emojis or playful language.

  Example format:
  Notification Header: [Generated Header]
  Notification Message: [Generated Message]

  Ensure the content is attention-grabbing, lighthearted, and encourages the user to reach out without repeating introductory phrases like "Hey" or "It's been a while."
`;

  return { fullMessagePrompt, notificationPrompt };
};

export default buildPersonalizedMessagePrompt;
