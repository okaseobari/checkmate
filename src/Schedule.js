import { RELATIONSHIP_TYPES } from "./constants.js";

export default class Schedule {
    constructor() {
        this.contacts = []; // Store the contacts
        this.schedule = []; // Store the generated schedule
        this.maxCheckInsPerDay = 1; // Limit the number of check-ins per day for each contact
    }

    // Add a contact to the contact list
    addContact(contact) {
        this.contacts.push(contact);
    }

    // Remove a contact by name
    removeContact(contactName) {
        const initialLength = this.contacts.length;
        this.contacts = this.contacts.filter(contact => contact.name !== contactName);

        if (this.contacts.length === initialLength) {
            console.log(`Contact with the name "${contactName}" not found.`);
        } else {
            console.log(`Contact with the name "${contactName}" has been removed.`);
        }
    }

    // Getter to retrieve all contacts
    get getContacts() {
        return this.contacts;
    }

    // Generate a schedule for the current contacts over a specified number of days
    generate(totalDays) {
        let currentDate = new Date(); // Start from the current date
        this.schedule = [];

        // Map to track how many check-ins are scheduled for each day
        const checkInsPerDay = {};
        const lastCheckInDateByContact = {}; // Track last check-in date to prevent consecutive-day check-ins

        // Total number of check-ins per contact based on their frequency and adjustable weight
        this.contacts.forEach(contact => {
            // First, ensure check-in on the contact's birthday if within the time period
            if (contact.birthday) {
                const birthdayCheckIn = this.scheduleBirthdayCheckIn(contact, currentDate, totalDays, checkInsPerDay);
                if (birthdayCheckIn) this.schedule.push(birthdayCheckIn);
            }

            const baseFrequency = this.getMonthlyFrequency(contact); // The base frequency per month
            const adjustedFrequency = baseFrequency * contact.adjustableWeight; // Adjust based on weight

            let contactCheckIns = Math.ceil(adjustedFrequency * (totalDays / 30)); // Calculate the number of check-ins based on totalDays

            // Distribute check-ins evenly across the total number of days
            for (let i = 0; i < contactCheckIns; i++) {
                let checkInDate = this.findAvailableDateForContact(
                    currentDate,
                    totalDays,
                    checkInsPerDay,
                    contact,
                    lastCheckInDateByContact
                );
                this.schedule.push({
                    name: contact.name,
                    date: checkInDate.toISOString().split("T")[0],  // Store the date as a string (YYYY-MM-DD)
                    whatWeTalkedAbout: contact.whatWeTalkedAbout,
                });
            }
        });

        // Sort the schedule by date for easier readability
        this.schedule.sort((a, b) => new Date(a.date) - new Date(b.date));

        return this.schedule; // Return the sorted schedule
    }

    //TODO remove this when date picker is added
    // Helper function to format a date as YYYY-MM-DD
    formatDate(date) {
        // Check if the passed value is already a Date object, if not, try to convert it to a Date
        const validDate = (date instanceof Date) ? date : new Date(date);

        // Check if the date is valid
        if (!isNaN(validDate)) {
            return validDate.toISOString().split('T')[0];
        } else {
            console.error("Invalid date provided:", date);
            return null;
        }
    }

     // Schedule a birthday check-in if the birthday falls within the time period
     scheduleBirthdayCheckIn(contact, startDate, totalDays, checkInsPerDay) {
        const birthday = this.formatDate(contact.birthday);
        const birthdayThisYear = new Date(Date.UTC(startDate.getUTCFullYear(), new Date(birthday).getUTCMonth(), new Date(birthday).getUTCDate()));
        const endDate = new Date(startDate);
        endDate.setUTCDate(startDate.getUTCDate() + totalDays);

        // Ensure birthday is within the time period
        if (birthdayThisYear >= startDate && birthdayThisYear <= endDate) {
            const dayKey = birthdayThisYear.toISOString().split("T")[0]; // Format date as YYYY-MM-DD
            const checkInsOnDay = checkInsPerDay[dayKey] || 0;

            // Schedule the birthday check-in
            if (checkInsOnDay < this.maxCheckInsPerDay) {
                checkInsPerDay[dayKey] = checkInsOnDay + 1; // Mark the birthday as a check-in day
                return {
                    name: contact.name,
                    date: birthdayThisYear.toISOString().split("T")[0],
                    whatWeTalkedAbout: contact.whatWeTalkedAbout,
                    note: "Birthday Check-in",
                };
            }
        }
        return null; // No birthday check-in scheduled
    }

    // Find an available date that doesn't exceed the max check-ins per day and ensures no consecutive-day check-ins for the same contact
    findAvailableDateForContact(
        startDate,
        totalDays,
        checkInsPerDay,
        contact,
        lastCheckInDateByContact
    ) {
        let maxAttempts = 50; // To prevent infinite loops in rare cases
        let checkInDate;

        do {
            // Randomly pick a day within the totalDays
            const randomOffset = Math.floor(Math.random() * totalDays);
            checkInDate = new Date(startDate);
            checkInDate.setDate(startDate.getDate() + randomOffset);

            const dayKey = checkInDate.toISOString().split("T")[0]; // Format date as YYYY-MM-DD
            const checkInsOnDay = checkInsPerDay[dayKey] || 0;

            // Ensure no consecutive-day check-ins for the same contact
            const lastCheckInDate = lastCheckInDateByContact[contact.name];
            const oneDayGap = !lastCheckInDate || this.calculateDayDifference(lastCheckInDate, checkInDate) > 1;

            if (checkInsOnDay < this.maxCheckInsPerDay && oneDayGap) {
                checkInsPerDay[dayKey] = checkInsOnDay + 1;
                lastCheckInDateByContact[contact.name] = checkInDate; // Update the last check-in date for this contact
                break;
            }

            maxAttempts--;
        } while (maxAttempts > 0);

        return checkInDate;
    }

    // Calculate the difference in days between two dates
    calculateDayDifference(lastDate, currentDate) {
        const timeDiff = Math.abs(currentDate - lastDate);
        return Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // Convert time difference to days
    }

    // Get the base frequency per month based on the relationship type
    getMonthlyFrequency(contact) {
        switch (contact.relationship) {
            case RELATIONSHIP_TYPES.FAMILY:
                return 4; // Family members checked weekly, so 4 times per month
            case RELATIONSHIP_TYPES.FRIEND:
                return 2; // Friends checked twice per month
            case RELATIONSHIP_TYPES.ACQUAINTANCE:
                return contact._monthsSinceStart() < 2 ? 2 : 1; // New acquaintances checked twice per month, once per month otherwise
            case RELATIONSHIP_TYPES.GIRLFRIEND:
                return this.randomizeGirlfriendFrequency(); // More flexible for girlfriends
        }
    }

    // Randomize the check-in frequency for a girlfriend (e.g., between 3-5 per month)
    randomizeGirlfriendFrequency() {
        return Math.floor(Math.random() * 3) + 3; // Random between 3 and 5
    }

    // Handle missed check-ins by updating the contact's last contacted date
    handleMissedCheckIn(contactName) {
        let contact = this.contacts.find(c => c.name === contactName);
        if (contact) {
            contact.updateLastContacted();
            console.log(
                `${contactName}'s missed check-in was handled. Last contacted updated to today.`
            );
        } else {
            console.log(`Contact ${contactName} not found.`);
        }
    }

    // Refresh the schedule when new contacts are added or if the schedule needs to be regenerated
    refresh(totalDays) {
        return this.generate(totalDays);
    }
}