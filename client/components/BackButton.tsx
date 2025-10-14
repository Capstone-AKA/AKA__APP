import React from "react";
import { TouchableOpacity, StyleSheet, View, Platform, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

type BackButtonProps = {
  targetPath?: string; // 이동할 경로 (없으면 router.back() 실행)
};

export default function BackButton({ targetPath }: BackButtonProps) {
  const router = useRouter();

  const handlePress = () => {
    if (targetPath) {
      router.push(targetPath); // 지정된 경로로 이동
    } else {
      router.back(); // 이전 화면으로 이동
    }
  };

  return (
    <View style={styles.headerContent}>
      <TouchableOpacity style={styles.backButton} onPress={handlePress}>
        <Ionicons name="chevron-back" size={28} color="#000" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContent: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    paddingHorizontal: 10,
    paddingBottom: 20,
    marginTop: 0,
    backgroundColor: "#fff",
  },
  backButton: {
    paddingTop: 10,
  },
});
