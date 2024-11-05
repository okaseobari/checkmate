import { FontAwesome } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  SafeAreaView,
  Text,
  View,
  RefreshControl,
} from "react-native";
import SaveContactDialog from "../../components/saveContactDialog";
import useStore from "../../store/useStore";
import usePushNotifications from "../../hooks/usePushNotifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ContactScreen = () => {
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [contactToEdit, setContactToEdit] = useState(null);
  const { requestPermissions } = usePushNotifications();

  const {
    addContact,
    contacts,
    deleteContact,
    fetchContacts,
    loading,
    updateContact,
  } = useStore();
  // State for refreshing
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  // Function to handle refreshing
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchContacts();
    } catch (error) {
      console.error("Error refreshing contacts:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleAddOrUpdateContact = async (contactData) => {
    try {
      if (contactToEdit) {
        await updateContact(contactToEdit._id, contactData);
      } else {
        // Add new contact
        await addContact(contactData);
        // Helper function to manage the prompt flag
        const managePromptFlag = async (hasPrompted) => {
          try {
            if (!hasPrompted) {
              //TODO: curate a better alert message
              Alert.alert(
                "Stay Connected",
                "Would you like to receive reminders for your check-ins?",
                [
                  { text: "Not Now", style: "cancel" },
                  {
                    text: "Enable Notifications",
                    onPress: async () => {
                      await requestPermissions();
                      await AsyncStorage.setItem(
                        "hasPromptedForNotifications",
                        "true"
                      );
                    },
                  },
                ]
              );
            }
          } catch (error) {
            console.error("Error managing notification prompt flag:", error);
          }
        };

        // Check if the user has been prompted for notifications before
        const hasPrompted = await AsyncStorage.getItem(
          "hasPromptedForNotifications"
        );
        await managePromptFlag(hasPrompted === "true"); // Pass a boolean
      }

      setIsDialogVisible(false);
      setContactToEdit(null);
    } catch (error) {
      console.log("Failed to save contact: " + error);
      Alert.alert("Error", "Failed to save contact. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    Alert.alert(
      "Delete Confirmation",
      "Are you sure you want to delete this contact?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "OK", onPress: async () => await deleteContact(id) },
      ]
    );
  };

  const renderContactItem = ({ item }) => (
    <View className="flex-row justify-between items-center py-3 border-b border-gray-300">
      <Text className="text-lg">{item.name}</Text>
      <View className="flex-row justify-between w-16">
        <FontAwesome
          name="edit"
          size={24}
          color="blue"
          onPress={() => {
            setContactToEdit(item);
            setIsDialogVisible(true);
          }}
        />
        <FontAwesome
          name="trash"
          size={24}
          color="red"
          onPress={() => handleDelete(item._id)}
        />
      </View>
    </View>
  );

  return (
    // TODO: remove bg-white
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 p-5 pt-12 bg-white">
        {loading ? (
          <Text className="text-lg text-center">Loading contacts...</Text>
        ) : (
          <FlatList
            data={contacts}
            keyExtractor={(item) => item._id.toString()}
            renderItem={renderContactItem}
            ListEmptyComponent={
              <Text className="text-center">No contacts available</Text>
            }
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}

        {/* Full-Screen Dialog for Adding or Editing Contacts */}
        <SaveContactDialog
          visible={isDialogVisible}
          onClose={() => {
            setIsDialogVisible(false);
            setContactToEdit(null);
          }}
          onSubmit={handleAddOrUpdateContact}
          contactToEdit={contactToEdit}
        />

        <Button
          title="Add Contact"
          onPress={() => {
            setContactToEdit(null);
            setIsDialogVisible(true);
          }}
        />
      </View>
    </SafeAreaView>
  );
};

export default ContactScreen;
