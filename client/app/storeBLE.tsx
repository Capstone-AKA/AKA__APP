import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../contexts/useAuth";
import { useBLE } from "../hooks/useBLE";
import { useStore } from "../contexts/useStore";
import api from "../api/api";

// .env에서 설정값 불러오기
const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === "true";

export default function StoreBLE() {
  const { user } = useAuth();
  const { devices, startScan, stopScan } = useBLE();
  const { storeId, setStoreId, setCartNumber } = useStore();
  const router = useRouter();

  const [cartInput, setCartInput] = useState("");
  const [cartRegistered, setCartRegistered] = useState(false);

  // 카트 등록 (env 기반으로 mock/real 분기)
  const handleCartRegister = async () => {
    if (!cartInput) return alert("카트 번호를 입력해주세요.");
    const parsedCart = parseInt(cartInput, 10);
    if (isNaN(parsedCart)) return alert("숫자만 입력해주세요.");

    try {
      if (USE_MOCK) {
        console.log(" MOCK MODE: 실제 서버 요청 없이 테스트 실행 중");
        await new Promise((res) => setTimeout(res, 500)); // 딜레이만 줌
      } else {
        // 실제 백엔드 연동 (api.ts 통해 BASE_URL 자동 적용)
        const res = await api.post("/api/cart/assign", { cartNumber: parsedCart });
        console.log("서버 응답:", res.data);
      }

      // 공통 처리 (성공 시 BLE 스캔 시작)
      setCartNumber(parsedCart);
      setCartRegistered(true);
      startScan();
    } catch (err) {
      console.error("카트 등록 실패:", err);
      alert("카트 등록 실패 (서버 통신 오류)");
    }
  };

// 카트 등록 → 서버 전송
// const handleCartRegister = async () => {
//   if (!cartInput) return;

//   const parsedCart = parseInt(cartInput, 10);
//   if (isNaN(parsedCart)) return;

//   try {
//     // await api.post("/api/cart/assign", { cartNumber: parsedCart });

//     setCartNumber(parsedCart);
//     setCartRegistered(true);

//     // 스캔 시작
//     startScan();
//   } catch (err) {
//     console.error("카트 등록 실패:", err);
//   }
// };

  // 매장 입장 감지
  useEffect(() => {
    if (!cartRegistered) return;

    const entryDevice = devices.find((d) => d.name === "MART01");
    if (entryDevice && !storeId) {
      console.log("입장 기기 발견:", entryDevice.name);
      stopScan();
      setStoreId(1);
      router.replace("/cart");
    }
  }, [devices, cartRegistered, storeId]);

  // 매장 퇴장 감지
  useEffect(() => {
    if (!storeId) return;

    const exitDevice = devices.find((d) => d.name === "MART_EXIT");
    if (exitDevice) {
      console.log("퇴장 기기 발견:", exitDevice.name);
      stopScan();
      setStoreId(null);
      setCartNumber(null);
      setCartRegistered(false);
      router.replace("/home");
    }
  }, [devices, storeId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>매장 입장 준비</Text>

      {/* 카트번호 입력 모달 */}
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

      {/* 매장 입장 후 상태 표시 */}
      {storeId && (
        <View style={styles.infoBox}>
          <Text style={styles.storeText}>현재 매장: {storeId}</Text>
          <Text style={styles.userText}>
            {user ? `${user.nickname} 님` : "방문자 님"} 즐거운 쇼핑 되세요!
          </Text>
        </View>
      )}
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
  infoBox: { marginTop: 20, alignItems: "center" },
  storeText: { fontSize: 18, fontWeight: "600", color: "#22C55E", marginBottom: 8 },
  userText: { fontSize: 16, color: "#555" },
});
