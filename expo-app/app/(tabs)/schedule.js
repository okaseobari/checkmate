import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  Button,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const ScheduleScreen = () => {
  return (
    <GestureHandlerRootView style={{ ...styles.headerImage, flex: 1 }}>
      <Text>Schedule</Text>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  headerImage: {
    color: "#808080",
    bottom: -90,
  },
  titleContainer: {
    flexDirection: "row",
    gap: 8,
  },
});

export default ScheduleScreen;
