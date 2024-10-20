import { RELATIONSHIP_TYPES } from "./constants.js";

export default class Contact {
    constructor(name, relationship, startDate = new Date(), lastContacted = null, whatWeTalkedAbout = [], followUpItems = [], adjustableWeight = 1, importantEvents = []) {
        this._name = name;
        this._relationship = relationship;
        this._startDate = startDate ? new Date(startDate) : new Date();  // Ensure startDate is always a valid date
        this._lastContacted = lastContacted;
        this._whatWeTalkedAbout = whatWeTalkedAbout;  // List of topics discussed
        this._adjustableWeight = adjustableWeight; // New dial to increase or decrease frequency
        this._importantEvents = importantEvents;
    }

    // Dynamically calculate the frequency (monthly-based) based on relationship type and the adjustable weight
    get frequency() {
        const baseFrequency = this._getBaseFrequency();
        return baseFrequency * this._adjustableWeight; // Scale the base frequency by the adjustable weight
    }

    // Get base frequency based on relationship type (monthly-based)
    _getBaseFrequency() {
        const monthsSinceStart = this._monthsSinceStart();

        switch (this._relationship) {
            case RELATIONSHIP_TYPES.FAMILY:
                return 4; // Family members checked weekly, so 4 times per month
            case RELATIONSHIP_TYPES.FRIEND:
                return 2; // Friends checked twice per month
            case RELATIONSHIP_TYPES.ACQUAINTANCE:
                return monthsSinceStart < 2 ? 2 : 1; // New acquaintances checked twice per month, once per month otherwise
            case RELATIONSHIP_TYPES.GIRLFRIEND:
                return this.randomizeFrequency();  // Spontaneous scheduling for girlfriends, e.g., 3-5 times per month
        }
    }

    // Calculate how many months have passed since the contact was added
    _monthsSinceStart() {
        const today = new Date();
        return (today.getFullYear() - this._startDate.getFullYear()) * 12 + (today.getMonth() - this._startDate.getMonth());
    }

    // Randomize the frequency for a girlfriend (e.g., between 3-5 check-ins per month)
    randomizeFrequency() {
        return Math.floor(Math.random() * 3) + 3;  // Random frequency for girlfriend (3 to 5 times per month)
    }

    // Getters
    get name() { return this._name; }
    get relationship() { return this._relationship; }
    get startDate() { return this._startDate; }
    get lastContacted() { return this._lastContacted; }
    get whatWeTalkedAbout() { return this._whatWeTalkedAbout; }
    get adjustableWeight() { return this._adjustableWeight; } // Get adjustable weight
    getEventDate(eventName) {
        const event = this._importantEvents.find(event => event.eventName === eventName);
        return event ? event.eventDate : null;
    }
    get importantEvents() { return this._importantEvents; }


    // Setters
    set name(newName) { this._name = newName; }
    set relationship(newRelationship) { this._relationship = newRelationship; }
    set startDate(newStartDate) { this._startDate = newStartDate; }
    set lastContacted(newDate) { this._lastContacted = newDate; }
    set whatWeTalkedAbout(newTopics) { this._whatWeTalkedAbout = newTopics; }
    set adjustableWeight(newWeight) { this._adjustableWeight = newWeight; } // Set adjustable weight
    addImportantEvent(eventName, eventDate) {
        this._importantEvents.push({ eventName, eventDate });
    }
    removeImportantEvent(eventName) {
        this._importantEvents = this._importantEvents.filter(event => event.eventName !== eventName);
    }

    // Add a new topic to the discussed list
    addWhatWeTalkedAbout(topic) {
        this._whatWeTalkedAbout.push(topic);
    }

    // Update last contacted to today
    updateLastContacted() {
        this._lastContacted = new Date();
    }
}