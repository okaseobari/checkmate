import { FontAwesome } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from "react-native";
import axiosInstance from "../../services/axiosInstance";
import useStore from "../../store/useStore";

const ScheduleScreen = () => {
  const { schedule, fetchUserSchedule, loading } = useStore();
  const [selectedCheckIn, setSelectedCheckIn] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchUserSchedule();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchUserSchedule();
    } catch (error) {
      console.error("Error refreshing contacts:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Handle Check-in
  const handleCheckIn = async (checkInId) => {
    try {
      await axiosInstance.put(`/schedule/checkIn/${checkInId}`);
      fetchUserSchedule(); // Refresh schedule after check-in
      Alert.alert("Checked in successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to check in. Please try again.");
    }
  };

  // Render individual schedule entries
  const renderScheduleItem = ({ item }) => (
    <View className="flex-row justify-between items-center py-3 border-b border-gray-300">
      <Text className="text-lg">{item.contactId.name}</Text>
      <View className="flex-row justify-between w-20">
        <TouchableOpacity onPress={() => handleCheckIn(item._id)}>
          <FontAwesome name="check-circle" size={24} color="green" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedCheckIn(item)}>
          <FontAwesome name="comment" size={24} color="blue" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    // TODO: remove bg-white
    <SafeAreaView className="flex-1 p-5 pt-12 bg-white">
      <Text className="text-2xl font-bold mb-4">Schedule</Text>
      {loading ? (
        <Text className="text-lg text-center">Loading schedule...</Text>
      ) : (
        <FlatList
          data={schedule}
          keyExtractor={(item) => item._id.toString()}
          renderItem={renderScheduleItem}
          ListEmptyComponent={
            <Text className="text-center">No scheduled check-ins</Text>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
      {/* Placeholder for logging dialog */}
      {selectedCheckIn && (
        <ConversationDialog
          checkIn={selectedCheckIn}
          onClose={() => setSelectedCheckIn(null)}
          onSave={(conversation) => {
            // Append the conversation log or update backend as needed
          }}
        />
      )}
    </SafeAreaView>
  );
};

export default ScheduleScreen;
