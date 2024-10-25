import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:3000/api/v1", // Ensure this baseURL is correctly formatted
});

// Add Authorization token to request headers
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      // const token = await AsyncStorage.getItem("token"); // Retrieve the token from AsyncStorage

      const token =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3MWFkNTRlMjczODZlZWMzNDY5OTZmNCIsImlhdCI6MTcyOTgzMDI4NSwiZXhwIjoxNzI5OTE2Njg1fQ.prdJdY4K26tnrc3nRSnr6tQtbAJm2MnHJLdAenceA8w";
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
