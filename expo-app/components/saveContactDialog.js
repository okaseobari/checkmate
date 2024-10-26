import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  FlatList,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Slider } from "react-native-awesome-slider";
import { useSharedValue } from "react-native-reanimated";
import axiosInstance from "../services/axiosInstance";

const SaveContactDialog = ({ visible, onClose, onSubmit, contactToEdit }) => {
  const {
    control,
    reset,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
    setError,
    clearErrors,
    watch,
  } = useForm({
    defaultValues: {
      name: contactToEdit?.name || "",
      adjustableWeight: contactToEdit?.adjustableWeight || 1,
      relationship: contactToEdit?.relationship || "Friend",
      whatWeTalkedAbout: contactToEdit?.whatWeTalkedAbout || "",
    },
  });

  // // Watch form values
  // const formValues = watch();

  // // Log form values on each render
  // useEffect(() => {
  //   console.log(contactToEdit);
  //   console.log("Current form values:", formValues);
  //   console.log("--------------");
  // }, [formValues]);

  // Reset form whenever `contactToEdit` or `visible` changes
  useEffect(() => {
    if (visible) {
      reset({
        name: contactToEdit?.name || "",
        relationship: contactToEdit?.relationship || "Friend",
        adjustableWeight: contactToEdit?.adjustableWeight || 1,
        whatWeTalkedAbout: contactToEdit?.whatWeTalkedAbout || "",
        startDate: contactToEdit?.startDate || new Date(),
        importantEvents: contactToEdit?.importantEvents || [],
        currentEvent: {
          eventName: "",
          eventDate: new Date(),
        },
      });
    }
  }, [visible, contactToEdit, reset]);

  const [importantEvents, setImportantEvents] = useState(
    contactToEdit?.importantEvents || []
  );
  const [currentEvent, setCurrentEvent] = useState({
    eventName: "",
    eventDate: new Date(),
  });
  const [startDate, setStartDate] = useState(new Date());
  const [selectedRelationship, setSelectedRelationship] = useState(
    contactToEdit?.relationship || "Friend"
  );

  const progress = useSharedValue(contactToEdit?.adjustableWeight || 1);
  const min = useSharedValue(1);
  const max = useSharedValue(5);
  const [showDatePicker, setShowDatePicker] = useState(false);

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

  const deleteEvent = (index) => {
    setImportantEvents(importantEvents.filter((_, i) => i !== index));
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || currentEvent.eventDate;
    setShowDatePicker(false);
    setCurrentEvent({ ...currentEvent, eventDate: currentDate });
  };

  const checkDuplicateName = async (name) => {
    try {
      const response = await axiosInstance.get(
        `/contact/check-duplicate/${name}`
      );
      if (response.status === 200) {
        clearErrors("name");
      }
    } catch (error) {
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

  const handleFormSubmit = async (data) => {
    const finalData = { ...data, importantEvents, startDate };
    onSubmit(finalData);
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (isSubmitSuccessful) {
      resetForm();
    }
  }, [isSubmitSuccessful]);

  const resetForm = () => {
    reset();
    setImportantEvents([]);
    setCurrentEvent({ eventName: "", eventDate: new Date() });
    setStartDate(new Date());
    progress.value = 1; // Reset slider value
  };

  if (!visible) return null;

  return (
    <View className=" bg-white">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-5">
        <TouchableOpacity onPress={onClose}>
          <Text className="text-red-500 text-lg">X</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold">
          {contactToEdit ? "Edit Contact" : "New Contact"}
        </Text>
        <TouchableOpacity onPress={handleSubmit(handleFormSubmit)}>
          <Text className="text-blue-500 text-base">SAVE</Text>
        </TouchableOpacity>
      </View>

      {/* Name Input */}
      <Text>Name:</Text>
      <Controller
        control={control}
        name="name"
        rules={{ required: true }}
        render={({ field: { onChange, value, onBlur } }) => (
          <TextInput
            className="h-10 border border-gray-300 rounded mb-4 px-3"
            placeholder="Enter name"
            value={value}
            onChangeText={onChange}
            onBlur={() => {
              onBlur();
              checkDuplicateName(value);
            }}
          />
        )}
      />
      {errors.name && (
        <Text className="text-red-500">{errors.name.message}</Text>
      )}

      {/* Relationship Picker */}
      <Text>Relationship:</Text>
      <Controller
        control={control}
        name="relationship"
        defaultValue={selectedRelationship}
        render={({ field: { onChange, value } }) => (
          <Picker
            selectedValue={value}
            onValueChange={(itemValue) => {
              onChange(itemValue);
              setSelectedRelationship(itemValue);
            }}
            className="h-10 border border-gray-300 rounded mb-4 px-3"
          >
            <Picker.Item label="Family" value="Family" />
            <Picker.Item label="Friend" value="Friend" />
            <Picker.Item label="Acquaintance" value="Acquaintance" />
            <Picker.Item label="Other" value="Other" />
          </Picker>
        )}
      />

      {/* Date Picker */}
      <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
        className="border border-gray-300 rounded p-3 mt-4"
      >
        <Text className="text-black">
          Event Date: {currentEvent.eventDate.toDateString()}
        </Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={currentEvent.eventDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {/* Adjustable Weight Slider */}
      <Text>Adjustable Weight:</Text>
      <Controller
        control={control}
        name="adjustableWeight"
        render={({ field: { onChange } }) => (
          <Slider
            className="w-full h-10"
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

      {/* What We Talked About */}
      <Text>What We Talked About:</Text>
      <Controller
        control={control}
        name="whatWeTalkedAbout"
        render={({ field: { onChange, value } }) => (
          <TextInput
            className="h-24 border border-gray-300 rounded mb-4 px-3"
            placeholder="Enter details about your conversation"
            value={value}
            onChangeText={onChange}
            multiline
          />
        )}
      />

      {/* Important Events Section */}
      <View>
        <Text>Add Important Event:</Text>
        <View className="flex-row items-center mb-4">
          <TextInput
            className="h-10 border border-gray-300 rounded mb-4 px-3"
            placeholder="Event name"
            value={currentEvent.eventName}
            onChangeText={(text) =>
              setCurrentEvent({ ...currentEvent, eventName: text })
            }
          />
          <Pressable onPress={addEvent} disabled={!currentEvent.eventName}>
            <Ionicons
              name="add-circle-outline"
              size={24}
              color={currentEvent.eventName ? "blue" : "gray"}
            />
          </Pressable>
        </View>
      </View>

      {/* List of Added Events */}
      <FlatList
        data={importantEvents}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View className="flex-row justify-between items-center mb-4">
            <Text>{`${item.eventName} on ${item.eventDate}`}</Text>
            <Pressable onPress={() => deleteEvent(index)}>
              <Ionicons name="close-circle-outline" size={24} color="red" />
            </Pressable>
          </View>
        )}
      />
    </View>
  );
};

export default SaveContactDialog;
