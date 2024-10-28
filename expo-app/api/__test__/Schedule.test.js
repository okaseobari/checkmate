const ScheduleLogic = require("../services/ScheduleLogic");
const { RELATIONSHIP_TYPES } = require("../utils/constants");

formatDateToLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

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

    const formattedEventDate = formatDateToLocal(eventDate1);
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
      importantEvents: [{ eventName: "Anniversary", eventDate: eventDate1 }],
      name: "Jake",
      relationship: RELATIONSHIP_TYPES.FRIEND,
    };

    scheduleManager.addContact(contact);
    const generatedSchedule = scheduleManager.generate();

    const formattedEventDate = formatDateToLocal(eventDate1)
    const anniversaryCheckIn = generatedSchedule.find(
      (checkIn) =>
        checkIn.date === formattedEventDate &&
        checkIn.note === "Anniversary Check-in"
    );

    expect(anniversaryCheckIn).toBeDefined();
    expect(anniversaryCheckIn.name).toBe("Jake");
  });

  test("handles bidirectional weight adjustments for the same relationship type", () => {
    const contact = {
      _id: "9",
      name: "Emma",
      relationship: RELATIONSHIP_TYPES.FAMILY,
      adjustableWeight: 1,
    };

    scheduleManager.addContact(contact);

    // Initial schedule and check-ins
    const setting = userSettings.find(
      (s) => s.relationshipType === contact.relationship
    );
    const totalEligibleDays = scheduleManager.countEligibleDaysAcrossMonths(
      setting.eligibleDays,
      new Date()
    );

    // Adjust weights and validate schedule updates
    scheduleManager.updateContact("Emma", { adjustableWeight: 2 });
    const updatedSchedule = scheduleManager.getSchedule();
    const increasedCheckIns = updatedSchedule.filter(
      (checkIn) => checkIn.name === "Emma"
    );

    const increasedExpectedCheckIns = Math.min(
      setting.occurrencesPerMonth * 2,
      totalEligibleDays
    );

    expect(increasedCheckIns.length).toBe(increasedExpectedCheckIns);

    scheduleManager.updateContact("Emma", { adjustableWeight: 0.5 });
    const decreasedCheckIns = scheduleManager
      .getSchedule()
      .filter((checkIn) => checkIn.name === "Emma");

    const decreasedExpectedCheckIns = Math.min(
      setting.occurrencesPerMonth * 0.5,
      totalEligibleDays
    );

    expect(decreasedCheckIns.length).toBe(decreasedExpectedCheckIns);
  });

  test("updates contact details and affects the schedule correctly", () => {
    const contact = {
      _id: "8",
      name: "Alice",
      relationship: RELATIONSHIP_TYPES.FRIEND,
      adjustableWeight: 1,
    };

    scheduleManager.addContact(contact);

    const initialSchedule = scheduleManager.getSchedule();
    expect(initialSchedule.some((checkIn) => checkIn.name === "Alice")).toBe(
      true
    );

    scheduleManager.updateContact("Alice", { name: "Alicia" });
    const scheduleAfterNameChange = scheduleManager.getSchedule();
    expect(scheduleAfterNameChange).toEqual(initialSchedule);

    scheduleManager.updateContact("Alicia", {
      relationship: RELATIONSHIP_TYPES.FAMILY,
    });
    const scheduleAfterRelationshipChange = scheduleManager.getSchedule();
    const newSetting = userSettings.find(
      (s) => s.relationshipType === RELATIONSHIP_TYPES.FAMILY
    );

    const expectedCheckIns =
      newSetting.occurrencesPerMonth * contact.adjustableWeight;
    const familyCheckIns = scheduleAfterRelationshipChange.filter(
      (checkIn) => checkIn.name === "Alicia"
    );

    expect(familyCheckIns.length).toBeLessThanOrEqual(expectedCheckIns);

    familyCheckIns.forEach((checkIn) => {
      const checkInDay = new Date(
        checkIn.date.replace(/-/g, "/").replace(/T.+/, "")
      ).toLocaleString("en-US", {
        weekday: "long",
      });
      expect(newSetting.eligibleDays).toContain(checkInDay);
    });
  });
});
