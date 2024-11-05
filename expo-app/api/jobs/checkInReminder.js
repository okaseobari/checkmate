import chalk from "chalk";
import cron from "node-cron";
import Schedule from "../models/ScheduleModel.js";
import User from "../models/UserModel.js";
import { generateCheckInNotificationMessage } from "../utils/checkInMessageGenerator.js";
import sendPushNotification from "../utils/sendPushNotifications.js";

const log = console.log;

cron.schedule("* 8 * * *", async () => {
  try {
    // Get the current date in 'YYYY-MM-DD' format for comparison
    const currentDate = new Date().toISOString().split("T")[0];

    // Log the activation of the cron job
    log(
      chalk.yellow(`[${new Date().toISOString()}]`) +
        chalk.green(" Cron activated")
    );

    // Fetch schedules with entries that have a check-in date matching the current date
    const schedules = await Schedule.find({
      "entries.checkInDate": {
        $gte: new Date(currentDate),
        $lt: new Date(
          new Date(currentDate).setDate(new Date(currentDate).getDate() + 1)
        ),
      },
    }).populate("entries.contactId", "name"); // Populate only the name field of the contact

    // Collect unique user IDs to avoid redundant database queries
    const userIds = [
      ...new Set(schedules.map((schedule) => schedule.userId.toString())),
    ];

    // Fetch user data in bulk and create a map for quick access
    const users = await User.find({ _id: { $in: userIds } }).select(
      "pushTokens"
    );
    const userMap = new Map();
    users.forEach((user) => userMap.set(user._id.toString(), user));

    // Iterate over schedules and their entries to send notifications
    for (const schedule of schedules) {
      const user = userMap.get(schedule.userId.toString());

      if (user && user.pushTokens.length > 0) {
        for (const entry of schedule.entries) {
          // Check if the entry's check-in date matches the current date
          if (entry.checkInDate.toISOString().split("T")[0] === currentDate) {
            // Send push notifications to all stored tokens for the user
            for (const pushToken of user.pushTokens) {
              try {
                const { notificationHeader, notificationMessage } =
                  await generateCheckInNotificationMessage(
                    user._id,
                    entry.contactId._id
                  );

                await sendPushNotification(
                  pushToken,
                  notificationHeader,
                  notificationMessage ||
                    `You have a ${entry.event} scheduled for today with ${entry.contactId.name}`,
                  { type: "check-in", contactId: entry.contactId._id }
                );
              } catch (notificationError) {
                console.error(
                  `Failed to send notification to token ${pushToken}:`,
                  notificationError
                );
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Error in scheduled push notification job:", error);
  }
});
