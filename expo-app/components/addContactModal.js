import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Button,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
} from "react-native";
import axiosInstance from "../services/axiosInstance";

const AddContactModal = ({
  visible,
  onClose,
  onAddContact,
  contactToEdit,
  onEditContact,
}) => {
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("Friend");
  const [adjustableWeight, setAdjustableWeight] = useState(1);
  const [loading, setLoading] = useState(false);
  const isEditing = contactToEdit !== null;

  // Pre-fill the form if we're in edit mode
  useEffect(() => {
    if (isEditing) {
      setName(contactToEdit.name);
      setRelationship(contactToEdit.relationship);
      setAdjustableWeight(contactToEdit.adjustableWeight);
    } else {
      setName("");
      setRelationship("Friend");
      setAdjustableWeight(1);
    }
  }, [contactToEdit, visible]);

  // Handle Add or Edit Contact API call
  const handleSaveContact = async () => {
    if (!name) {
      Alert.alert("Error", "Please enter a name.");
      return;
    }

    const contactData = {
      name,
      relationship,
      adjustableWeight,
    };

    setLoading(true);

    try {
      if (isEditing) {
        await axiosInstance.put(`/contact/${contactToEdit._id}`, contactData); // Edit API call
        onEditContact({ ...contactData, _id: contactToEdit._id });
      } else {
        const response = await axiosInstance.post("/contact", contactData); // Add API call
        onAddContact(response.data);
      }
      onClose(); // Close the modal
    } catch (error) {
      console.error("Error saving contact:", error);
      Alert.alert("Error", "Could not save contact. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {isEditing ? "Edit Contact" : "Add New Contact"}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Name"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.sectionTitle}>Relationship:</Text>
          <TextInput
            style={styles.input}
            placeholder="Relationship"
            value={relationship}
            onChangeText={setRelationship}
          />

          <Text style={styles.sectionTitle}>Adjustable Weight:</Text>
          <TextInput
            style={styles.input}
            placeholder="1-5"
            value={adjustableWeight.toString()}
            onChangeText={(text) => setAdjustableWeight(Number(text))}
            keyboardType="numeric"
          />

          <View style={styles.buttonContainer}>
            <Button
              title={
                loading
                  ? "Saving..."
                  : isEditing
                  ? "Save Contact"
                  : "Add Contact"
              }
              onPress={handleSaveContact}
              disabled={loading}
            />
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    marginHorizontal: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  buttonContainer: {
    marginTop: 20,
  },
  cancelText: {
    marginTop: 10,
    textAlign: "center",
    color: "red",
    textDecorationLine: "underline",
  },
});

export default AddContactModal;
