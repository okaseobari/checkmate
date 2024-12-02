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
  birthday: {
    month: { type: Number, min: 1, max: 12 }, // Month without year
    day: { type: Number, min: 1, max: 31 },   // Day of the month
  },
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
  learnedAttributes: {
    type: Map,
    of: String,
    default: {}
  },
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

const Contact = mongoose.model("Contact", contactSchema);

export default Contact;
