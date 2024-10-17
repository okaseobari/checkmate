import { Contact } from "./Contact.js";
import { Schedule } from "./Schedule.js";
import { Reminder } from "./Reminder.js";
import { RELATIONSHIP_TYPES } from "./constants.js";
import fs from "fs";

const scheduleManager = new Schedule();
const contacts = [
  new Contact("Mom ❤️", RELATIONSHIP_TYPES.FAMILY),
  new Contact("Okaka 🥰", RELATIONSHIP_TYPES.FAMILY, null, null, [], null, 1, "Nov.11.2024"),
  new Contact("Dave 😎", RELATIONSHIP_TYPES.FAMILY, null, null, [], null, 1, "Oct.20.2024"),
  // new Contact("Bright", RELATIONSHIP_TYPES.FRIEND),
  // new Contact("Yinka", RELATIONSHIP_TYPES.FRIEND),
  // new Contact("Dennis", RELATIONSHIP_TYPES.FRIEND),
  // new Contact("Diana", RELATIONSHIP_TYPES.FRIEND, null, null, [], null, 1.2),
  // new Contact("Esther", RELATIONSHIP_TYPES.FRIEND),
  // new Contact("Helliiiii 🌶️P", RELATIONSHIP_TYPES.FRIEND),
  // new Contact("Segun", RELATIONSHIP_TYPES.ACQUAINTANCE),
  // new Contact("Onyi 😍", RELATIONSHIP_TYPES.GIRLFRIEND),
];
// Add each contact to the scheduleManager
contacts.forEach((contact) => {
  scheduleManager.addContact(contact);
});

const stream = fs.createWriteStream("output.json");
const printSchedule = (s) =>
  s.forEach((item) => {
    stream.write(JSON.stringify(item) + "\n"); // Write each item on a new line
  });
const schedule = scheduleManager.generate(30); // Generate a 30-day schedule

const mom = contacts[0];

contacts.forEach((contact) => {
  stream.write(contact.name + JSON.stringify(contact.frequency) + " times per month \n");
});



printSchedule(schedule);

stream.end();

// let contactx = new Contact("Esther Nwogu", RELATIONSHIP_TYPES.FAMILY, null);
// scheduleManager.addContact(contactx);
// schedule = scheduleManager.refresh(30);
// console.log(schedule);

let reminderSystem = new Reminder(schedule);
// reminderSystem.checkReminders();
