import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Modal,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../contexts/useAuth";
import { useBLE } from "../hooks/useBLE";
import { useStore } from "../contexts/useStore";
import api from "../api/api";
import AsyncStorage from '@react-native-async-storage/async-storage';

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === "true";
const ENTRY_DEVICE_NAME = "MART_IN";
const ENTRY_RSSI_THRESHOLD = -80; // 입장 감지 기준

export default function StoreBLE() {
  const { user } = useAuth();
  const { devices, startScan, stopScan } = useBLE();
  const { setStoreId, setCartNumber } = useStore();
  const router = useRouter();

  const [cartInput, setCartInput] = useState("");
  const [cartRegistered, setCartRegistered] = useState(false);
  const [entryDetected, setEntryDetected] = useState(false);

  // ✅ 카트 등록
  const handleCartRegister = async () => {
    if (!cartInput.trim()) return Alert.alert("알림", "카트 번호를 입력해주세요.");
    const parsed = parseInt(cartInput, 10);
    if (isNaN(parsed) || parsed <= 0)
      return Alert.alert("알림", "올바른 숫자 카트 번호를 입력해주세요.");

    try {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 500));
      } else {
        // 🔍 요청 전 콘솔 로그 추가
        const token = await AsyncStorage.getItem("accessToken");
        console.log("🧾 현재 토큰:", token);
        console.log("📡 요청 주소:", api.defaults.baseURL + "/api/cart/assign");
        console.log("📦 요청 데이터:", { cartNumber: parsed });
        console.log("🧾 요청 Headers:", {
          ...api.defaults.headers,
          Authorization: `Bearer ${token}`,
        });

        const res = await api.post("/api/cart/assign", { cartNumber: parsed });
        // 🔍 서버 응답 확인
        console.log("🔍 서버 응답:", JSON.stringify(res.data, null, 2));

        if (!res.data.success)
          return Alert.alert("등록 실패", res.data.message || "카트 번호를 확인해주세요.");
      }

      setCartNumber(parsed);
      setCartRegistered(true);
      startScan(); // ✅ BLE 스캔 시작
      console.log(`✅ 카트번호 등록 완료 (${parsed})`);
    } catch (e: any) {
      console.error("❌ 서버 통신 에러 상세:", e.message || e);
      console.error("🔎 전체 에러 객체:", e);
      Alert.alert("오류", "서버 통신 중 문제가 발생했습니다.");
    }
  };


  // ✅ 입장 비콘 감지 → cart 페이지로 이동
  useEffect(() => {
    if (!cartRegistered) return;

    // const entry = devices[ENTRY_DEVICE_NAME];
    const entry = devices.ENTRY;
    
    if (entry && typeof entry.rssi === "number" && entry.rssi > ENTRY_RSSI_THRESHOLD && !entryDetected) {
      console.log(`🚪 입장 감지됨: ${entry.name} (RSSI: ${entry.rssi})`);
      setEntryDetected(true);
      setStoreId(1);
      stopScan();
      setTimeout(() => router.replace("/cart"), 300);
    }
  }, [devices]);

  useEffect(() => () => stopScan(), []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>매장 입장 준비</Text>

      <Modal visible={!cartRegistered} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>카트 번호 입력</Text>
            <TextInput
              placeholder="카트 번호"
              value={cartInput}
              onChangeText={setCartInput}
              style={styles.modalInput}
              keyboardType="numeric"
            />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable style={styles.modalBtn} onPress={handleCartRegister}>
                <Text style={{ color: "#fff" }}>등록하기</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: "#888" }]}
                onPress={() => router.replace("/home")}
              >
                <Text style={{ color: "#fff" }}>취소</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalBox: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 10,
    alignItems: "center",
    width: 280,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    width: "100%",
    marginBottom: 16,
    textAlign: "center",
  },
  modalBtn: {
    backgroundColor: "#ff0101ff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
});