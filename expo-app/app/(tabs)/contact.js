import { FontAwesome } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  SafeAreaView,
  Text,
  View,
} from "react-native";
import SaveContactDialog from "../../components/saveContactDialog";
import useStore from "../../store/useStore";

const ContactScreen = () => {
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [contactToEdit, setContactToEdit] = useState(null);

  const {
    contacts,
    fetchContacts,
    addContact,
    updateContact,
    deleteContact,
    loading,
  } = useStore();

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleAddOrUpdateContact = async (contactData) => {
    try {
      if (contactToEdit) {
        // Update existing contact
        await updateContact(contactToEdit._id, contactData);
      } else {
        // Add new contact
        await addContact(contactData);
      }
      setIsDialogVisible(false);
      setContactToEdit(null);
    } catch (error) {
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
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 p-5 pt-12">
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
