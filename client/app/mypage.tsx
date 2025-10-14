import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../contexts/useAuth";
import BackButton from "../components/BackButton";
import api from "../api/api"; 

export default function MyPage() {
  const { logout, updateUser, user } = useAuth();
  const router = useRouter();

  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [nicknameModalVisible, setNicknameModalVisible] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [newNickname, setNewNickname] = useState("");

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  // 비밀번호 변경
  const handleChangePassword = async () => {
    if (!newPassword) {
      Alert.alert("오류", "새 비밀번호를 입력해주세요.");
      return;
    }
    try {
      const res = await api.patch("/api/user/password", { newPassword });

      if (res.status === 200) {
        Alert.alert("성공", "비밀번호가 변경되었습니다.");
        setPasswordModalVisible(false);
        setNewPassword("");
      } else {
        Alert.alert("실패", "비밀번호 변경에 실패했습니다.");
      }
    } catch (err) {
      console.error("비밀번호 변경 실패:", err);
      Alert.alert("오류", "서버와 통신 중 문제가 발생했습니다.");
    }
  };

  // 닉네임 변경
  const handleChangeNickname = async () => {
    if (!newNickname) {
      Alert.alert("오류", "새 닉네임을 입력해주세요.");
      return;
    }
    try {
      const res = await api.patch("/api/user/nickname", { newNickname });

      if (res.status === 200) {
        Alert.alert("성공", "닉네임이 변경되었습니다.");
        updateUser({ nickname: newNickname }); 
        setNicknameModalVisible(false);
        setNewNickname("");
      } else {
        Alert.alert("실패", "닉네임 변경에 실패했습니다.");
      }
    } catch (err) {
      console.error("닉네임 변경 실패:", err);
      Alert.alert("오류", "서버와 통신 중 문제가 발생했습니다.");
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView>
        <BackButton targetPath="/home" />
      </SafeAreaView>

      <Text style={styles.header}>마이페이지</Text>
      <View style={styles.divider} />

      <TouchableOpacity style={styles.item} onPress={() => setPasswordModalVisible(true)}>
        <Text>비밀번호 변경</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.item} onPress={() => setNicknameModalVisible(true)}>
        <Text>회원 닉네임 변경</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleLogout} style={styles.logoutArea}>
        <Text style={styles.logoutText}>로그아웃</Text>
      </TouchableOpacity>

      {/* 비밀번호 변경 모달 */}
      <Modal visible={passwordModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>비밀번호 변경</Text>
            <TextInput
              style={styles.input}
              placeholder="새 비밀번호"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TouchableOpacity style={styles.confirmButton} onPress={handleChangePassword}>
              <Text style={styles.confirmText}>변경하기</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
              <Text style={styles.cancelText}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 닉네임 변경 모달 */}
      <Modal visible={nicknameModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>닉네임 변경</Text>
            <TextInput
              style={styles.input}
              placeholder="새 닉네임"
              value={newNickname}
              onChangeText={setNewNickname}
            />
            <TouchableOpacity style={styles.confirmButton} onPress={handleChangeNickname}>
              <Text style={styles.confirmText}>변경하기</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setNicknameModalVisible(false)}>
              <Text style={styles.cancelText}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 0, paddingHorizontal: 20, backgroundColor: "#fff" },
  header: {
    fontSize: 25,
    fontWeight: "bold",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginHorizontal: 20,
    marginBottom: 20,
  },
  item: {
    backgroundColor: "#DEE6F1",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 15,
    marginBottom: 15,
  },
  logoutArea: {
    position: "absolute",
    bottom: 100,
    right: 44,
  },
  logoutText: {
    fontSize: 16,
    color: "#888",
    textDecorationLine: "underline",
  },
  modalOverlay: {
    flex: 1,
    marginTop: -50,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  confirmButton: {
    backgroundColor: "#DEE6F1",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 10,
  },
  confirmText: {
    color: "#444444ff",
    fontWeight: "bold",
  },
  cancelText: {
    color: "gray",
    marginTop: 20,
    textAlign: "center",
  },
});