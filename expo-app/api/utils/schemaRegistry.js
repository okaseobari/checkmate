export const schemaRegistry = {
  contacts: {
    description: "Stores information about user contacts.",
    fields: {
      userId: "ObjectId (Reference to the User collection)",
      name: "String (Name of the contact)",
      relationship: "String (Relationship type: Family, Friend, etc.)",
      birthday: {
        description: "Birthday details of the contact.",
        fields: {
          month: "Number (Month of the birthday, 1-12)",
          day: "Number (Day of the birthday, 1-31)",
        },
      },
      adjustableWeight: "Number (Weight assigned to prioritize check-ins)",
      importantEvents: [
        {
          description: "Significant events related to the contact.",
          fields: {
            eventName: "String (Name of the event)",
            eventDate: "Date (When the event occurs)",
          },
        },
      ],
      lastCheckInDate:
        "Date (The last time the user checked in with this contact)",
    },
  },
  conversations: {
    description: "Stores check-in details and logs for user contacts.",
    fields: {
      userId: "ObjectId (Reference to the User collection)",
      contactId: "ObjectId (Reference to the Contact collection)",
      checkInDetails: {
        description: "Map containing details of the check-in.",
        fields: {
          note: "String (Stores information on what was discussed during the check-in)",
          media:
            "Array of URLs (Links to images or videos shared during the check-in)",
          audio: "URL (Link to an audio note shared during the check-in)",
        },
      },
      date: "Date (When the check-in occurred)",
    },
  },
  schedule: {
    description: "Manages the user's schedule for checking in with contacts.",
    fields: {
      userId: "ObjectId (Reference to the User collection)",
      entries: [
        {
          description: "Individual check-in entries for the user's contacts.",
          fields: {
            contactId: "ObjectId (Reference to the Contact collection)",
            checkInDate: "Date (Scheduled date for the check-in)",
            event:
              "String (Name of the event, e.g., Birthday, General Check-in)",
          },
        },
      ],
    },
  },
};
