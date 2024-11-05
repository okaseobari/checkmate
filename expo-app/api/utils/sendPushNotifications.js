import axios from "axios";

const sendPushNotification = async (expoPushToken, title, body, data) => {
  try {
    const message = {
      to: expoPushToken,
      sound: "default",
      title,
      body,
      data,
    };

    const response = await axios.post(
      "https://exp.host/--/api/v2/push/send",
      message,
      {
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Push notification sent successfully:", response.data);
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
};

export default sendPushNotification;
