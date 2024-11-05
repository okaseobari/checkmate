import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Constants from "expo-constants";

const axiosInstance = axios.create({
  baseURL: Constants.expoConfig?.extra?.API_BASE_URL,
});

// Add Authorization token to request headers
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token"); // Retrieve the token from AsyncStorage

      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error retrieving token from AsyncStorage:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
