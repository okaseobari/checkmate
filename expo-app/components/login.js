import AsyncStorage from "@react-native-async-storage/async-storage"; // For storing the token securely
import { useNavigation } from "@react-navigation/native"; // For navigation
import axios from "axios";
import React, { useState } from "react";
import {
  Alert,
  Button,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const LoginScreen = () => {
  const [email, setEmail] = useState("okaseshopping@gmail.com");
  const [password, setPassword] = useState("1234");
  const [error, setError] = useState(null);
  const [isResetting, setIsResetting] = useState(false);
  const navigation = useNavigation(); // React Navigation hook for navigation

  const handleLogin = async () => {
    try {
      const response = await axios.post(
        "http://localhost:3000/api/v1/user/login",
        {
          email,
          password,
        }
      );

      const token = response.data.token;

      // Store the token in AsyncStorage
      await AsyncStorage.setItem("token", token);

      // Navigate to the home screen or dashboard
      // navigation.navigate('Home');
    } catch (err) {
      setError("Login failed. Please check your credentials.");
      Alert.alert(
        "Login Error",
        "Login failed. Please check your credentials."
      );
      console.error("Login error:", err);
    }
  };

  const handlePasswordReset = async () => {
    try {
      setIsResetting(true); // Set loading state
      await axios.post("http://localhost:3000/api/v1/user/reset-password", {
        email,
      });
      Alert.alert(
        "Password Reset",
        "Please check your email for password reset instructions."
      );
    } catch (err) {
      setError("Password reset failed. Please try again.");
      Alert.alert("Reset Error", "Password reset failed. Please try again.");
      console.error("Password reset error:", err);
    } finally {
      setIsResetting(false); // Clear loading state
    }
  };

  return (
    <View className="flex-1 justify-center p-5">
      <Text className="text-2xl font-bold mb-5 text-center">Login</Text>
      {error && <Text className="text-red-500 mb-3 text-center">{error}</Text>}
      <TextInput
        className="h-10 border border-gray-300 rounded mb-3 px-3"
        placeholder="Email"
        value={email}
        onChangeText={(text) => setEmail(text)}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        className="h-10 border border-gray-300 rounded mb-3 px-3"
        placeholder="Password"
        value={password}
        onChangeText={(text) => setPassword(text)}
        secureTextEntry
      />
      <Button title="Login" onPress={handleLogin} />

      <TouchableOpacity
        onPress={handlePasswordReset}
        disabled={isResetting}
        className="mt-4 items-center"
      >
        <Text className="text-blue-500 underline">
          {isResetting ? "Sending..." : "Forgot Password?"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginScreen;
