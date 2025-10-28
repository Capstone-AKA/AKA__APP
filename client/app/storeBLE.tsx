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

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === "true";

export default function StoreBLE() {
  const { user } = useAuth();
  const { devices, startScan, stopScan } = useBLE();
  const { storeId, setStoreId, setCartNumber } = useStore();
  const router = useRouter();

  const [cartInput, setCartInput] = useState("");
  const [cartRegistered, setCartRegistered] = useState(false);
  const [entryDetected, setEntryDetected] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  // 카트 등록
  const handleCartRegister = async () => {
    if (!cartInput) return alert("카트 번호를 입력해주세요.");
    const parsedCart = parseInt(cartInput, 10);
    if (isNaN(parsedCart)) return alert("숫자만 입력해주세요.");

    try {
      if (USE_MOCK) {
        console.log("MOCK MODE: 실제 서버 요청 없이 테스트 실행 중");
        await new Promise((res) => setTimeout(res, 500));
      } else {
        const res = await api.post("/api/cart/assign", { cartNumber: parsedCart });
        console.log("서버 응답:", res.data);
      }

      setCartNumber(parsedCart);
      setCartRegistered(true);
      startScan();
    } catch (err) {
      console.error("카트 등록 실패:", err);
      alert("카트 등록 실패 (서버 통신 오류)");
    }
  };

  // BLE 입장/퇴장 감지
  useEffect(() => {
    if (!cartRegistered) return;

    const martDevice = devices.find((d) => d.name === "MART01");

    if (martDevice && martDevice.rssi !== null) {
      // 입장
      if (!entryDetected && !storeId) {
        console.log("입장 감지");
        stopScan();
        setStoreId(1);
        setEntryDetected(true);
        router.replace("/cart");

        setTimeout(() => {
          console.log("퇴장 감지 대기 시작");
          startScan();
        }, 3000);
      }

      // 퇴장
      else if (entryDetected && storeId && !isPaying) {
        console.log("퇴장 감지");
        handleAutoPayment();
      }
    }
  }, [devices]);

  // 자동 결제 로직 (결제 후 /cart로 이동해 모달 표시)
  const handleAutoPayment = async () => {
    if (isPaying) return;
    setIsPaying(true);

    try {
      if (USE_MOCK) {
        console.log("MOCK 자동 결제 실행 중...");
        await new Promise((res) => setTimeout(res, 1000));
        console.log("MOCK 자동 결제 완료");
      } else {
        console.log("자동 결제 API 요청...");
        await api.post(`/payment/auto-checkout`, {
          cartNumber: parseInt(cartInput, 10),
          userId: user?.id,
        });
      }

      stopScan();
      setStoreId(null);
      setCartNumber(null);
      setCartRegistered(false);
      setEntryDetected(false);
      setIsPaying(false);

      // 결제 완료 후 cart로 이동해 모달 표시
      router.replace({
        pathname: "/cart",
        params: { autoDone: "true" },
      });
    } catch (error) {
      console.error("자동 결제 실패:", error);
      alert("자동 결제 중 오류가 발생했습니다.");
      setIsPaying(false);
    }
  };

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
