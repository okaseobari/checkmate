class ScheduleLogic {
  constructor(userSettings, contacts = []) {
    this.contacts = contacts;
    this.schedule = [];
    this.userSettings = userSettings;
  }

  refresh() {
    this.schedule = this.generate();
  }

  getSchedule() {
    return this.schedule;
  }

  // Adds multiple contacts and refreshes the schedule once
  setContacts(contacts) {
    this.contacts = contacts;
    this.refresh();
  }

  getContacts() {
    return this.contacts;
  }

  // Adds a new contact and refreshes the schedule
  addContact(contact) {
    this.contacts.push(contact);
    this.refresh();
  }

  // Removes a contact by name and updates the schedule
  removeContact(contactName) {
    this.contacts = this.contacts.filter(
      (contact) => contact.name !== contactName
    );
    this.refresh();
  }

  // Updates an existing contact's details and refreshes the schedule if necessary
  updateContact(contactName, newDetails) {
    const contactIndex = this.contacts.findIndex(
      (contact) => contact.name === contactName
    );

    if (contactIndex !== -1) {
      const {
        name,
        adjustableWeight,
        importantEvents,
        relationship,
        eligibleDays,
      } = newDetails;
      const contact = this.contacts[contactIndex];

      contact.name = name ?? contact.name;
      contact.importantEvents = importantEvents ?? contact.importantEvents;
      contact.relationship = relationship ?? contact.relationship;
      contact.adjustableWeight = adjustableWeight ?? contact.adjustableWeight;
      contact.eligibleDays = eligibleDays ?? contact.eligibleDays;

      if (this.requiresRecalculation(newDetails)) {
        this.refresh();
      }
    }
  }

  // Updates or adds a check-in setting for a relationship type and refreshes the schedule
  updateSetting(relationshipType, occurrencesPerMonth, eligibleDays) {
    const settingIndex = this.userSettings.findIndex(
      (setting) => setting.relationshipType === relationshipType
    );

    if (settingIndex >= 0) {
      this.userSettings[settingIndex].occurrencesPerMonth = occurrencesPerMonth;
      this.userSettings[settingIndex].eligibleDays = eligibleDays;
    } else {
      this.userSettings.push({
        relationshipType,
        occurrencesPerMonth,
        eligibleDays,
      });
    }

    this.refresh();
  }

  // Checks if recalculation of the schedule is needed
  requiresRecalculation({
    adjustableWeight,
    relationship,
    importantEvents,
    eligibleDays,
  }) {
    return !!(
      adjustableWeight !== undefined ||
      relationship !== undefined ||
      importantEvents !== undefined ||
      eligibleDays !== undefined
    );
  }

  // Generates a schedule for all contacts based on the remaining eligible days in the current and next month
  generate() {
    const currentDate = new Date();
    const remainingDaysCurrentMonth =
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      ).getDate() -
      currentDate.getDate() +
      1;
    const daysNextMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 2,
      0
    ).getDate();
    const totalDays = remainingDaysCurrentMonth + daysNextMonth;
    const lastCheckInDateByContact = {};
    const newSchedule = [];

    this.contacts.forEach((contact) => {
      this.scheduleImportantEvents(
        contact,
        currentDate,
        totalDays,
        newSchedule
      );
    });

    this.contacts.forEach((contact) => {
      this.scheduleGeneralCheckIns(
        contact,
        currentDate,
        totalDays,
        lastCheckInDateByContact,
        newSchedule
      );
    });

    this.schedule = newSchedule.sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
    return this.schedule;
  }

  // Helper function to schedule important events for a contact
  scheduleImportantEvents(contact, currentDate, totalDays, schedule) {
    (contact.importantEvents || []).forEach((event) => {
      const eventCheckIn = this.scheduleEventCheckIn(
        contact,
        event,
        currentDate,
        totalDays
      );
      if (eventCheckIn) {
        schedule.push({ ...eventCheckIn, contactId: contact._id });
      }
    });
  }

  // Helper function to schedule general check-ins for a contact
  scheduleGeneralCheckIns(
    contact,
    currentDate,
    totalDays,
    lastCheckInDateByContact,
    schedule
  ) {
    const monthlyFrequency =
      this.getMonthlyFrequency(contact) * contact.adjustableWeight;
    const eligibleDays = this.getEligibleDays(contact);

    // Count eligible days available within the total period
    const maxEligibleCheckIns = this.countEligibleDaysAcrossMonths(
      eligibleDays,
      currentDate
    );

    // Limit check-ins to the minimum of the requested frequency and available eligible days
    const checkIns = Math.min(monthlyFrequency, maxEligibleCheckIns);

    for (let i = 0; i < checkIns; i++) {
      const checkInDate = this.getNextValidDate(
        currentDate,
        totalDays,
        eligibleDays,
        lastCheckInDateByContact[contact.name]
      );

      if (checkInDate) {
        const dayKey = this.formatDateToLocal(checkInDate);
        schedule.push({
          contactId: contact._id,
          name: contact.name,
          date: dayKey,
          event: "General Check-in",
        });

        lastCheckInDateByContact[contact.name] = checkInDate;
      }
    }
  }

  formatDateToLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-based
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Helper function to count eligible days across the current and next month
  countEligibleDaysAcrossMonths(eligibleDays, startDate) {
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

  // Gets the eligible days for the contact based on user settings
  getEligibleDays(contact) {
    const setting = this.userSettings.find(
      (s) => s.relationshipType === contact.relationship
    );
    return (
      setting?.eligibleDays || [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ]
    );
  }

  // Finds the next valid check-in date based on eligible days and spacing rules
  getNextValidDate(currentDate, totalDays, eligibleDays, lastCheckInDate) {
    const startDate = new Date(currentDate);
    for (let i = 0; i < totalDays; i++) {
      const potentialDate = new Date(startDate);
      potentialDate.setDate(startDate.getDate() + i);
      const dayName = potentialDate.toLocaleString("en-US", {
        weekday: "long",
      });

      if (
        eligibleDays.includes(dayName) &&
        this.isSpacedOut(potentialDate, lastCheckInDate)
      ) {
        return potentialDate;
      }
    }
    return null;
  }

  // Validates spacing between check-ins
  isSpacedOut(potentialDate, lastCheckInDate) {
    return !lastCheckInDate || (potentialDate - lastCheckInDate) / 86400000 > 1;
  }

  // Schedules an important event check-in for a contact
  scheduleEventCheckIn(contact, event, startDate, totalDays) {
    const eventDate = this.getFormattedEventDate(event.eventDate);
    const eventThisYear = new Date(
      startDate.getFullYear(),
      eventDate.getMonth(),
      eventDate.getDate()
    );

    if (this.isEventWithinPeriod(eventThisYear, startDate, totalDays)) {
      return {
        name: contact.name,
        date: eventThisYear.toISOString().split("T")[0],
        note: `${event.eventName} Check-in`,
      };
    }
    return null;
  }

  // Helper function to format event date correctly
  getFormattedEventDate(eventDate) {
    return new Date(eventDate);
  }

  // Checks if the event falls within the given period
  isEventWithinPeriod(eventDate, startDate, totalDays) {
    return (
      eventDate >= startDate &&
      eventDate <= new Date(startDate.getTime() + totalDays * 86400000)
    );
  }

  // Gets the monthly frequency of check-ins based on relationship type
  getMonthlyFrequency(contact) {
    const setting = this.userSettings.find(
      (s) => s.relationshipType === contact.relationship
    );
    return setting ? setting.occurrencesPerMonth : 1;
  }
}

export default ScheduleLogic;
