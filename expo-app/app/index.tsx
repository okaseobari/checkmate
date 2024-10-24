import AddContactForm from "@/components/addContactForm";
import { useState } from "react";
import { Text, View, TextInput, StyleSheet, Button } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';


export default function Index() {
  const [title, setTitle] = useState<string>("");

  const handlePostContact = () => {
    console.log(title);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
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
