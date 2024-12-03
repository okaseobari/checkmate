import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  relationship: {
    type: String,
    enum: ["Family", "Friend", "Acquaintance", "Girlfriend", "Other"],
    default: "Friend",
  },
  adjustableWeight: {
    type: Number,
    default: 1,
  },
  recurringEvents: [
    {
      eventName: { type: String, required: true }, // E.g., "Birthday", "Anniversary"
      month: { type: Number, min: 1, max: 12, required: true },
      day: { type: Number, min: 1, max: 31, required: true },
    },
  ],
  importantEvents: [
    {
      eventName: { type: String },
      eventDate: { type: Date },
    },
  ],
  lastCheckInDate: {
    type: Date,
    default: null,
  },
  preferences: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
});

// Schema methods

// Method to check if a contact with the same name already exists for a user
contactSchema.statics.isDuplicateName = async function (userId, name) {
  const duplicate = await this.findOne({
    userId,
    name: { $regex: new RegExp(`^${name}$`, "i") },
  });
  return !!duplicate; // Returns true if a duplicate is found, false otherwise
};

// Method to add an important event to a contact
contactSchema.methods.addImportantEvent = async function (
  eventName,
  eventDate
) {
  this.importantEvents.push({ eventName, eventDate });
  return this.save();
};

// Method to remove an important event by name
contactSchema.methods.removeImportantEvent = async function (eventName) {
  this.importantEvents = this.importantEvents.filter(
    (event) => event.eventName !== eventName
  );
  return this.save();
};

// Method to update a contact’s details
contactSchema.methods.updateContactDetails = async function (updateData) {
  Object.assign(this, updateData);
  return this.save();
};

contactSchema.methods.updatePreferences = function (newPreferences) {
  // Ensure preferences is initialized
  if (!this.preferences) {
    this.preferences = new Map();
  }

  // Merge new preferences into existing ones
  for (const [key, value] of Object.entries(newPreferences)) {
    if (this.preferences.has(key)) {
      const existingValue = this.preferences.get(key);

      // Merge arrays (deduplicate) if the values are arrays
      if (Array.isArray(existingValue) && Array.isArray(value)) {
        this.preferences.set(key, [...new Set([...existingValue, ...value])]);
      }
      // Handle object merging
      else if (typeof existingValue === "object" && typeof value === "object") {
        this.preferences.set(key, { ...existingValue, ...value });
      }
      // For primitive values, merge only if the new value is different
      else if (existingValue !== value) {
        this.preferences.set(key, value);
      }
    } else {
      // Add new key-value pairs
      this.preferences.set(key, value);
    }
  }

  return this.save();
};

const Contact = mongoose.model("Contact", contactSchema);

export default Contact;
