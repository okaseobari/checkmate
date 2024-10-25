import React, { useState, useEffect } from "react";
import { View, Button, FlatList, Text, StyleSheet, Alert } from "react-native";
import AddContactModal from "../../components/addContactModal"; // Import the sliding drawer
import { FontAwesome } from "@expo/vector-icons";
import axiosInstance from "../../services/axiosInstance"; // Import axios for API requests

const ContactScreen = () => {
  const [contacts, setContacts] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contactToEdit, setContactToEdit] = useState(null);

  // Fetch contacts from the API
  const fetchContacts = async () => {
    setLoading(true); // Show loading indicator
    try {
      const response = await axiosInstance.get("/contact"); // API call to get contacts
      const userContacts = response.data.contacts; // Assuming response contains contacts array
      setContacts(userContacts); // Set the contacts to state
    } catch (error) {
      console.error("Error fetching contacts:", error);
      Alert.alert("Error", "Unable to fetch contacts. Please try again later.");
    } finally {
      setLoading(false); // Hide loading indicator
    }
  };

  // Fetch contacts on component mount
  useEffect(() => {
    fetchContacts();
  }, []);

  // Handle adding a new contact and updating the list
  const handleAddContact = (newContact) => {
    setContacts([...contacts, newContact]); // Add the new contact to the list
  };

  // Handle editing a contact and updating the list
  const handleEditContact = (updatedContact) => {
    setContacts(
      contacts.map((contact) =>
        contact._id === updatedContact._id ? updatedContact : contact
      )
    ); // Update contact in the list
    setContactToEdit(null); // Clear contact to edit
  };

  // Handle deleting a contact
  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`/contact/${id}`); // API call to delete contact
      setContacts(contacts.filter((contact) => contact._id !== id)); // Remove from list
      Alert.alert("Success", "Contact deleted successfully.");
    } catch (error) {
      console.error("Error deleting contact:", error);
      Alert.alert("Error", "Could not delete contact. Please try again.");
    }
  };

  const renderContactItem = ({ item }) => (
    <View style={styles.contactItem}>
      <Text>{item.name}</Text>
      <View style={styles.iconContainer}>
        <FontAwesome
          name="edit"
          size={24}
          color="blue"
          onPress={() => {
            setContactToEdit(item); // Set the contact to edit
            setIsModalVisible(true); // Open modal
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

  console.log(contacts)

  return (
    <View style={styles.container}>
      {loading ? (
        <Text>Loading contacts...</Text>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item._id.toString()}
          renderItem={renderContactItem}
          ListEmptyComponent={<Text>No contacts available</Text>}
        />
      )}

      {/* Modal for Adding or Editing Contacts */}
      <AddContactModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onAddContact={handleAddContact}
        onEditContact={handleEditContact}
        contactToEdit={contactToEdit} // Pass the contact to edit
      />

      <Button
        title="Add Contact"
        onPress={() => {
          setContactToEdit(null); // Clear any existing contact data
          setIsModalVisible(true);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60
  },
  contactItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  iconContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 60, // Ensure enough space for icons
  },
});

export default ContactScreen;
