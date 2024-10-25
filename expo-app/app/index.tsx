import AddContactForm from "@/components/addContactForm";
import Login from "@/components/login";
import { useState } from "react";
import { Text, View, TextInput, StyleSheet, Button } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import React from "react";
// import { NavigationContainer } from '@react-navigation/native';
// import { createStackNavigator } from '@react-navigation/stack';
// import Login from './screens/Login'; // Assuming your Login component is in screens folder
// import Home from './screens/Home'; // Example Home screen

export default function Index() {
  const [title, setTitle] = useState<string>("");

  const handlePostContact = () => {
    console.log(title);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{  height: 1000 }}>
        <Login />
        <AddContactForm />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  input: {
    borderWidth: 3,
    borderColor: "gray",
    padding: 15,
  },
});
