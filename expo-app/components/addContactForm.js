import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker"; // Import Picker
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Button,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Slider } from "react-native-awesome-slider";
import { useSharedValue } from "react-native-reanimated";

export default function AddContactForm() {
  const {
    control,
    reset,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
    setError,
    clearErrors,
  } = useForm({
    defaultValues: {
      name: "",
      adjustableWeight: 1,
      whatWeTalkedAbout: "",
    },
  });

  const [importantEvents, setImportantEvents] = useState([]);
  const [currentEvent, setCurrentEvent] = useState({
    eventName: "",
    eventDate: new Date(),
  });
  const [startDate, setStartDate] = useState(new Date());
  const [selectedRelationship, setSelectedRelationship] = useState("Friend");

  const progress = useSharedValue(1);
  const min = useSharedValue(1);
  const max = useSharedValue(5);

  // Function to add important events
  const addEvent = () => {
    if (currentEvent.eventName) {
      setImportantEvents([
        ...importantEvents,
        {
          eventName: currentEvent.eventName,
          eventDate: currentEvent.eventDate.toISOString().split("T")[0],
        },
      ]);
      setCurrentEvent({ eventName: "", eventDate: new Date() });
    }
  };

  // Function to delete an important event
  const deleteEvent = (index) => {
    setImportantEvents(importantEvents.filter((_, i) => i !== index));
  };

  const checkDuplicateName = async (name) => {
    try {
      const response = await axios.get(
        `http://localhost:3000/api/v1/contact/check-duplicate/${name}`
      );

      // If no duplicate is found, the response status will be 200
      if (response.status === 200) {
        clearErrors("name"); // Clear any previous errors
      }
    } catch (error) {
      // If a duplicate is found, the server should return a 400 error
      if (error.response && error.response.status === 400) {
        setError("name", {
          type: "duplicate",
          message: error.response.data.message,
        });
      } else {
        console.error("Error checking duplicate name:", error);
      }
    }
  };

  const onSubmit = async (data) => {
    const finalData = { ...data, importantEvents, startDate };
    console.log("Contact submitted:", finalData);

    try {
      const response = await axios.post(
        "http://localhost:3000/api/v1/contact",
        finalData
      );
      if (response.status === 200) {
        console.log("Contact created successfully:", response.data);
        resetForm();
      }
    } catch (error) {
      // If a duplicate is found, the server should return a 400 error
      if (error.response && error.response.status === 400) {
        setError("name", {
          type: "duplicate",
          message: error.response.data.message,
        });
      } else {
        // Handle other errors (optional)
        console.error("Error adding contact:", error);
      }
    }
  };

  useEffect(() => {
    if (isSubmitSuccessful) {
      resetForm();
    }
  }, [isSubmitSuccessful]);

  // Function to reset the form
  const resetForm = () => {
    reset();
    setImportantEvents([]);
    setCurrentEvent({ eventName: "", eventDate: new Date() });
    setStartDate(new Date());
    progress.value = 1; // Reset slider value
  };

  return (
    <View style={styles.container}>
      {/* Name Input */}
      <Text>Name:</Text>
      <Controller
        control={control}
        name="name"
        rules={{ required: true }}
        render={({ field: { onChange, value, onBlur } }) => (
          <TextInput
            style={[
              styles.input,
              errors.name && styles.inputError, // Apply error style if there's an error
            ]}
            onChangeText={onChange}
            value={value}
            placeholder="Enter name"
            onBlur={() => {
              onBlur(); // Notify react-hook-form of blur event
              if (value) {
                checkDuplicateName(value); // Check for duplicates on blur
              }
            }}
          />
        )}
      />
      {errors.name && <Text style={styles.error}>{errors.name.message}</Text>}

      {/* Relationship Picker */}
      <Text>Relationship:</Text>
      <Controller
        control={control}
        name="relationship"
        defaultValue={selectedRelationship} // Set default value for the controller
        render={({ field: { onChange, value } }) => (
          <Picker
            selectedValue={value}
            onValueChange={(itemValue) => {
              onChange(itemValue);
              setSelectedRelationship(itemValue); // Update local state as well
            }}
            style={styles.picker} // Add styling for the picker
          >
            <Picker.Item label="Family" value="Family" />
            <Picker.Item label="Friend" value="Friend" />
            <Picker.Item label="Acquaintance" value="Acquaintance" />
            <Picker.Item label="Other" value="Other" />
          </Picker>
        )}
      />

      {/* Start Date Input */}
      <View style={styles.startDateContainer}>
        <Text>Start Date:</Text>
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            if (selectedDate) {
              setStartDate(selectedDate);
            }
          }}
        />
      </View>

      {/* Adjustable Weight Slider */}
      <Text>Adjustable Weight:</Text>
      <Controller
        control={control}
        name="adjustableWeight"
        render={({ field: { onChange } }) => (
          <Slider
            style={styles.slider}
            progress={progress}
            minimumValue={min}
            maximumValue={max}
            onValueChange={(value) => {
              progress.value = value;
              onChange(value);
            }}
          />
        )}
      />

      {/* What We Talked About (Textarea) */}
      <Text>What We Talked About:</Text>
      <Controller
        control={control}
        name="whatWeTalkedAbout"
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={[styles.input, styles.textArea]}
            onChangeText={onChange}
            value={value}
            placeholder="Enter details about your conversation"
            multiline={true} // Enable multiline input for textarea
            numberOfLines={4} // Set number of lines for the textarea
          />
        )}
      />

      {/* Important Events Section */}
      <View>
        <Text>Add Important Event:</Text>
        <View style={styles.eventInputContainer}>
          <TextInput
            style={styles.input}
            value={currentEvent.eventName}
            placeholder="Event name"
            onChangeText={(text) =>
              setCurrentEvent({ ...currentEvent, eventName: text })
            }
          />

          {/* Important Event Date Input (similar to Start Date) */}
          <DateTimePicker
            value={currentEvent.eventDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              if (selectedDate) {
                setCurrentEvent({ ...currentEvent, eventDate: selectedDate });
              }
            }}
          />

          {/* Add Event Button */}
          <Pressable
            onPress={addEvent}
            disabled={!currentEvent.eventName}
            style={({ pressed }) => [
              { opacity: pressed ? 0.5 : 1 },
              { opacity: !currentEvent.eventName ? 0.5 : 1 },
            ]}
          >
            <Ionicons
              name="add-circle-outline"
              size={24}
              color={currentEvent.eventName ? "blue" : "gray"}
            />
          </Pressable>
        </View>
      </View>

      {/* Display List of Added Events */}
      <FlatList
        data={importantEvents}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.eventItem}>
            <Text>{`${item.eventName} on ${item.eventDate}`}</Text>
            <Pressable
              onPress={() => deleteEvent(index)}
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
            >
              <Ionicons name="close-circle-outline" size={24} color="red" />
            </Pressable>
          </View>
        )}
      />

      {/* Submit Button */}
      <Button title="Add Contact" onPress={handleSubmit(onSubmit)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  input: {
    borderWidth: 1,
    padding: 8,
    marginBottom: 10,
  },
  inputError: {
    borderColor: "red",
  },
  textArea: {
    height: 80, // Set height for textarea
  },
  error: {
    color: "red",
  },
  eventItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  eventInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  addDateButton: {
    borderWidth: 1,
    borderColor: "gray",
    padding: 8,
    marginRight: 10,
  },
  datePicker: {},
  slider: {
    width: "100%",
    height: 40,
  },
  startDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  startDateDisplay: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "gray",
    padding: 8,
    marginLeft: 10, // Add some space between the label and the date
  },
});
