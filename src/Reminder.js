export class Reminder {
    constructor(schedule) {
        this.schedule = schedule;
    }

    // Method to check if a contact needs to be contacted today
    checkReminders() {
        const today = new Date().toISOString().split('T')[0];  // Get today's date in YYYY-MM-DD format
        let remindersForToday = this.schedule.filter(entry => entry.date === today);

        if (remindersForToday.length > 0) {
            remindersForToday.forEach(entry => {
                console.log(`Reminder: You need to check on ${entry.name} today. What we talked about: ${entry.whatWeTalkedAbout.join(', ')}`);
            });
        } else {
            console.log("No reminders for today.");
        }
    }
}