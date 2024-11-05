import { AppState } from "react-native";
import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axiosInstance from "../services/axiosInstance";

const usePushNotifications = () => {
  const isRequestingToken = useRef(false);

  const handleTokenStorage = async (newToken) => {
    const storedToken = await AsyncStorage.getItem("pushToken");

    if (newToken && newToken !== storedToken) {
      await AsyncStorage.setItem("pushToken", newToken);
      await axiosInstance.put("/user/push-token/add", { pushToken: newToken });
      console.log("Updated push token sent to the server:", newToken);
    } else if (!newToken && storedToken) {
      await axiosInstance.put("/user/push-token/remove", {
        pushToken: storedToken,
      });
      await AsyncStorage.removeItem("pushToken");
      console.log("Push token removed from the server:", storedToken);
    }
  };

  const checkAndHandlePermissions = async () => {
    if (isRequestingToken.current) return; // Prevent duplicate requests

    isRequestingToken.current = true;
    try {
      const { status } = await Notifications.getPermissionsAsync();

      if (status === "granted") {
        const { data: newToken } = await Notifications.getExpoPushTokenAsync();
        await handleTokenStorage(newToken);
      } else {
        // If permissions are not granted, handle token removal
        await handleTokenStorage(null);
      }
    } catch (error) {
      console.error(
        "Error checking or updating push notification permissions:",
        error
      );
    } finally {
      isRequestingToken.current = false;
    }
  };

  useEffect(() => {
    // Initial check on mount
    checkAndHandlePermissions();

    // Listen for permission changes (optional, but recommended)
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        // Handle permission changes here (e.g., update token if granted)
        checkAndHandlePermissions();
      }
    );

    const appStateListener = AppState.addEventListener(
      "change",
      (nextAppState) => {
        if (nextAppState === "active") {
          checkAndHandlePermissions();
        }
      }
    );

    return () => {
      subscription.remove();
      appStateListener.remove();
    };
  }, []);

  return { requestPermissions: checkAndHandlePermissions };
};

export default usePushNotifications;
