const ScheduleLogic = require("../services/ScheduleLogic");
const { RELATIONSHIP_TYPES } = require("../utils/constants");

describe("Schedule Logic Tests", () => {
  let scheduleManager;
  let userSettings;

  beforeEach(() => {
    userSettings = [
      {
        relationshipType: RELATIONSHIP_TYPES.FAMILY,
        occurrencesPerMonth: 4,
        eligibleDays: ["Saturday"],
      },
      {
        relationshipType: RELATIONSHIP_TYPES.FRIEND,
        occurrencesPerMonth: 2,
        eligibleDays: ["Monday", "Tuesday", "Wednesday"],
      },
      {
        relationshipType: RELATIONSHIP_TYPES.ACQUAINTANCE,
        occurrencesPerMonth: 1,
        eligibleDays: ["Thursday"],
      },
    ];

    scheduleManager = new ScheduleLogic(userSettings);
  });

  test("schedules important event check-ins correctly", () => {
    const currentDate = new Date();

    // Ensure the event date is within the current month
    const eventDate1 = new Date(currentDate);
    eventDate1.setDate(currentDate.getDate() + 3);

    const contact = {
      _id: 1,
      name: "John",
      relationship: RELATIONSHIP_TYPES.FRIEND,
      importantEvents: [{ eventName: "Birthday", eventDate: eventDate1 }],
    };

    scheduleManager.addContact(contact);
    const generatedSchedule = scheduleManager.generate();

    const formattedEventDate = eventDate1.toISOString().split("T")[0];
    const birthdayCheckIn = generatedSchedule.find(
      (checkIn) =>
        checkIn.date === formattedEventDate &&
        checkIn.note === "Birthday Check-in"
    );

    expect(birthdayCheckIn).toBeDefined();
    expect(birthdayCheckIn.name).toBe("John");
    expect(birthdayCheckIn.contactId).toBe(contact._id);
  });

  test("reflects addition and removal of contacts", () => {
    const contact1 = {
      _id: "1",
      name: "John",
      relationship: RELATIONSHIP_TYPES.FRIEND,
      adjustableWeight: 1,
    };

    const contact2 = {
      _id: "2",
      name: "James",
      relationship: RELATIONSHIP_TYPES.FRIEND,
      adjustableWeight: 1,
    };

    scheduleManager.setContacts([contact1, contact2]);

    const initialSchedule = scheduleManager.getSchedule();
    expect(initialSchedule.some((checkIn) => checkIn.name === "John")).toBe(
      true
    );
    expect(initialSchedule.some((checkIn) => checkIn.name === "James")).toBe(
      true
    );

    scheduleManager.removeContact("James");
    const updatedSchedule = scheduleManager.getSchedule();

    expect(updatedSchedule.some((checkIn) => checkIn.name === "John")).toBe(
      true
    );
    expect(updatedSchedule.some((checkIn) => checkIn.name === "James")).toBe(
      false
    );
  });

  test("ensures no consecutive day check-ins for the same contact", () => {
    const contact = {
      name: "David",
      relationship: RELATIONSHIP_TYPES.FRIEND,
      eligibleDays: ["Monday", "Tuesday", "Wednesday"],
    };
    scheduleManager.addContact(contact);
    const generatedSchedule = scheduleManager.generate();

    const davidCheckIns = generatedSchedule.filter(
      (checkIn) => checkIn.name === "David"
    );

    for (let i = 1; i < davidCheckIns.length; i++) {
      const prevDate = new Date(davidCheckIns[i - 1].date);
      const currDate = new Date(davidCheckIns[i].date);
      const diffInDays = (currDate - prevDate) / (24 * 60 * 60 * 1000);
      expect(diffInDays).not.toBe(1);
    }
  });

  test("validates eligible days and frequency for each relationship type", () => {
    const contact = {
      _id: "4",
      name: "Mom",
      relationship: RELATIONSHIP_TYPES.FAMILY,
      adjustableWeight: 1,
    };

    scheduleManager.addContact(contact);
    const generatedSchedule = scheduleManager.generate();

    const setting = userSettings.find(
      (s) => s.relationshipType === contact.relationship
    );

    const maxCheckIns = setting.occurrencesPerMonth * contact.adjustableWeight;
    const contactCheckIns = generatedSchedule.filter(
      (checkIn) => checkIn.name === contact.name
    );

    expect(contactCheckIns.length).toBeLessThanOrEqual(maxCheckIns);

    contactCheckIns.forEach((checkIn) => {
      const checkInDay = new Date(
        checkIn.date.replace(/-/g, "/").replace(/T.+/, "")
      ).toLocaleString("en-US", {
        weekday: "long",
      });
      expect(setting.eligibleDays).toContain(checkInDay);
    });
  });

  test("ensures important events are scheduled even if outside eligible days", () => {
    const currentDate = new Date();
    const eventDate1 = new Date(currentDate);
    eventDate1.setDate(currentDate.getDate() + 3);

    const contact = {
      _id: 4,
      adjustableWeight: 1,
      eligibleDays: ["Monday", "Tuesday"],
      importantEvents: [{ eventName: "Anniversary", eventDate: eventDate1 }],
      name: "Jake",
      relationship: RELATIONSHIP_TYPES.FRIEND,
    };

    scheduleManager.addContact(contact);
    const generatedSchedule = scheduleManager.generate();

    const formattedEventDate = eventDate1.toISOString().split("T")[0];
    const anniversaryCheckIn = generatedSchedule.find(
      (checkIn) =>
        checkIn.date === formattedEventDate &&
        checkIn.note === "Anniversary Check-in"
    );

    expect(anniversaryCheckIn).toBeDefined();
    expect(anniversaryCheckIn.name).toBe("Jake");
  });

  test("handles adjustable weight and limits frequency based on available days", () => {
    // Define a contact of type ACQUAINTANCE with an adjustable weight
    const contact = {
      _id: "5",
      adjustableWeight: 3,
      name: "Tom",
      relationship: RELATIONSHIP_TYPES.ACQUAINTANCE,
    };

    // Add the contact to the schedule manager
    scheduleManager.addContact(contact);

    // Generate the schedule
    const generatedSchedule = scheduleManager.generate();

    // Filter the schedule to find check-ins for Tom
    const tomCheckIns = generatedSchedule.filter(
      (checkIn) => checkIn.name === "Tom"
    );

    // Retrieve the user setting for the ACQUAINTANCE relationship type
    const setting = userSettings.find(
      (s) => s.relationshipType === contact.relationship
    );
    const baseFrequency = setting.occurrencesPerMonth;
    const eligibleDays = setting.eligibleDays;

    // Count the total eligible days across the remaining current month and next month
    const totalEligibleDays = countEligibleDaysAcrossMonths(
      eligibleDays,
      new Date()
    );

    // Calculate the expected check-ins based on the base frequency and adjustable weight
    const maxCheckIns = baseFrequency * contact.adjustableWeight;
    const expectedCheckIns = Math.min(maxCheckIns, totalEligibleDays);

    // Validate that the number of check-ins matches the expected frequency
    expect(tomCheckIns.length).toBe(expectedCheckIns);

    // Validate that each check-in occurs on an eligible day based on user settings
    tomCheckIns.forEach((checkIn) => {
      const checkInDay = new Date(
        checkIn.date.replace(/-/g, "/").replace(/T.+/, "")
      ).toLocaleString("en-US", {
        weekday: "long",
      });
      expect(eligibleDays).toContain(checkInDay);
    });
  });

  test("handles situations with fewer eligible days left in the month and considers the next month", () => {
    const currentDate = new Date();
    currentDate.setDate(20);

    const contact = {
      _id: "7",
      name: "Sophia",
      relationship: RELATIONSHIP_TYPES.FAMILY,
      eligibleDays: ["Saturday"],
      adjustableWeight: 1,
    };

    scheduleManager.addContact(contact);
    const generatedSchedule = scheduleManager.generate();

    const sophiaCheckIns = generatedSchedule.filter(
      (checkIn) =>
        checkIn.name === contact.name && new Date(checkIn.date) >= currentDate
    );

    const remainingSaturdaysCount = countEligibleDaysAcrossMonths(
      ["Saturday"],
      currentDate
    );

    expect(sophiaCheckIns.length).toBeLessThanOrEqual(remainingSaturdaysCount);
  });

  function countEligibleDaysAcrossMonths(eligibleDays, startDate) {
    let count = 0;
    let currentDate = new Date(startDate);

    // Calculate the remaining days in the current month
    const remainingDaysInCurrentMonth =
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      ).getDate() -
      currentDate.getDate() +
      1;

    // Calculate the total days in the next month
    const totalDaysInNextMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 2,
      0
    ).getDate();

    // Total days to iterate through: remaining days in current month + full next month
    const totalDays = remainingDaysInCurrentMonth + totalDaysInNextMonth;

    // Iterate through the total number of days
    for (let i = 0; i < totalDays; i++) {
      const dayName = currentDate.toLocaleString("en-US", { weekday: "long" });

      // Check if the current day is an eligible day
      if (eligibleDays.includes(dayName)) {
        count++;
      }

      // Move to the next day
      currentDate.setDate(currentDate.getDate() + 1);

      // Check if we've moved to the next month
      const daysInNewMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      ).getDate();

      if (currentDate.getDate() > daysInNewMonth) {
        // Move to the first day of the next month
        currentDate.setMonth(currentDate.getMonth() + 1);
        currentDate.setDate(1);
      }
    }

    return count;
  }
});
