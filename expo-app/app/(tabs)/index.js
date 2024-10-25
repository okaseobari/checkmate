import AsyncStorage from "@react-native-async-storage/async-storage"; // For storing the token securely
import { useNavigation } from "@react-navigation/native"; // For navigation
import axios from "axios";
import React, { useState } from "react";
import {
  Alert,
  Button,
  StyleSheet,
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
    <View style={styles.container}>
      <Text style={styles.heading}>Login</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={(text) => setEmail(text)}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={(text) => setPassword(text)}
        secureTextEntry
      />
      <Button title="Login" onPress={handleLogin} />

      <TouchableOpacity
        onPress={handlePasswordReset}
        disabled={isResetting}
        style={styles.forgotButton}
      >
        <Text style={styles.forgotText}>
          {isResetting ? "Sending..." : "Forgot Password?"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  error: {
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
  forgotButton: {
    marginTop: 15,
    alignItems: "center",
  },
  forgotText: {
    color: "#007BFF",
    textDecorationLine: "underline",
  },
});

export default LoginScreen;
