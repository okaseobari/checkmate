import Schedule from "../src/Schedule";
import Contact from "../src/Contact";
import { RELATIONSHIP_TYPES } from "../src/constants";

describe("Schedule", () => {
  let scheduleManager;

  beforeEach(() => {
    scheduleManager = new Schedule();
  });

  test("should schedule an important event check-in for contacts with multiple events", () => {
    const currentDate = new Date();
    
    // Calculate future dates for the important events
    const importantEvent1 = new Date(currentDate);
    const importantEvent2 = new Date(currentDate);
    importantEvent1.setDate(currentDate.getDate() + 5);  // 5 days in the future
    importantEvent2.setDate(currentDate.getDate() + 10); // 10 days in the future

    const formattedImportantEventDate1 = importantEvent1.toISOString().split("T")[0]; // Format as YYYY-MM-DD
    const formattedImportantEventDate2 = importantEvent2.toISOString().split("T")[0];

    // Create contact with multiple important events
    const contactWithEvents = new Contact(
        "John",
        RELATIONSHIP_TYPES.FRIEND,
        null,
        null,
        [],
        [],
        1,
        [
            { eventName: "Birthday", eventDate: formattedImportantEventDate1 },
            { eventName: "Surgery", eventDate: formattedImportantEventDate2 }
        ]
    );
    
    scheduleManager.addContact(contactWithEvents);
    const generatedSchedule = scheduleManager.generate(30);

    // Check for birthday and surgery events in the schedule
    const birthdayCheckIn = generatedSchedule.find(checkIn => checkIn.date === formattedImportantEventDate1);
    const surgeryCheckIn = generatedSchedule.find(checkIn => checkIn.date === formattedImportantEventDate2);

    expect(birthdayCheckIn).toBeDefined();
    expect(birthdayCheckIn.name).toBe("John");
    expect(birthdayCheckIn.note).toBe("Birthday Check-in");

    expect(surgeryCheckIn).toBeDefined();
    expect(surgeryCheckIn.name).toBe("John");
    expect(surgeryCheckIn.note).toBe("Surgery Check-in");
});

  test("should not schedule the same contact on consecutive days", () => {
    const contact = new Contact(
      "David",
      RELATIONSHIP_TYPES.FRIEND,
      null,
      null,
      [],
      [],
      1
    );
    scheduleManager.addContact(contact);

    const generatedSchedule = scheduleManager.generate(30);

    let lastCheckInDate = null;
    let isValid = true;

    // Check if there are any consecutive-day check-ins
    generatedSchedule.forEach((checkIn) => {
      if (checkIn.name === "David") {
        const currentCheckInDate = new Date(checkIn.date);

        if (
          lastCheckInDate &&
          currentCheckInDate - lastCheckInDate === 24 * 60 * 60 * 1000
        ) {
          isValid = false; // Found consecutive check-ins
        }
        lastCheckInDate = currentCheckInDate;
      }
    });

    expect(isValid).toBe(true); // Expect no consecutive-day check-ins
  });

  test("should distribute check-ins based on frequency (Family weekly)", () => {
    const familyContact = new Contact("Mom", RELATIONSHIP_TYPES.FAMILY);
    scheduleManager.addContact(familyContact);

    const generatedSchedule = scheduleManager.generate(30);
    const momCheckIns = generatedSchedule.filter(
      (checkIn) => checkIn.name === "Mom"
    );

    // Family should be checked on 4 times in 30 days (once per week)
    expect(momCheckIns.length).toBe(4);
  });

  test("should distribute check-ins based on adjustable weight (higher frequency)", () => {
    const contact = new Contact(
      "Alice",
      RELATIONSHIP_TYPES.FRIEND,
      null,
      null,
      [],
      [],
      2
    ); // Higher weight
    scheduleManager.addContact(contact);

    const generatedSchedule = scheduleManager.generate(30); // Generate 30-day schedule
    const aliceCheckIns = generatedSchedule.filter(
      (checkIn) => checkIn.name === "Alice"
    );

    // Friends should normally be checked on twice a month, but with an adjustable weight of 2, expect 4 check-ins
    expect(aliceCheckIns.length).toBe(4);
  });

  test("should ensure no check-ins are scheduled on the same day for the same contact", () => {
    const contact = new Contact("Esther", RELATIONSHIP_TYPES.ACQUAINTANCE);
    scheduleManager.addContact(contact);

    const generatedSchedule = scheduleManager.generate(30);
    const dateTracker = {};

    let noSameDayCheckIns = true;

    generatedSchedule.forEach((checkIn) => {
      if (!dateTracker[checkIn.date]) {
        dateTracker[checkIn.date] = [];
      }
      dateTracker[checkIn.date].push(checkIn.name);

      // If the same contact is found more than once on the same day, set the flag to false
      if (
        dateTracker[checkIn.date].filter((name) => name === checkIn.name)
          .length > 1
      ) {
        noSameDayCheckIns = false;
      }
    });

    expect(noSameDayCheckIns).toBe(true); // Expect no multiple check-ins for the same contact on the same day
  });

  //TODO remove this when date picker is added
  test("should handle invalid or missing dates in formatDate gracefully", () => {
    const invalidDate = "Invalid Date String";
    const validDate = "2024-12-01";
    const formattedValidDate = scheduleManager.formatDate(validDate);

    // Call formatDate directly with an invalid date
    const formattedInvalidDate = scheduleManager.formatDate(invalidDate);

    expect(formattedInvalidDate).toBe(null); // Invalid date should return null
    expect(formattedValidDate).toBe("2024-12-01"); // Valid date should return properly formatted
  });
});
