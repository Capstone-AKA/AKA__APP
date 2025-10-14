import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  FlatList,
  Alert,
  Vibration,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useBLE } from "../hooks/useBLE";
import { useStore } from "../contexts/useStore";
import { useAuth } from "../contexts/useAuth";
import { useRouter } from "expo-router";
import PaymentModal from "../components/PaymentModal";
import api from "../api/api";

// env로 mock 제어
const USE_MOCK_MODE = process.env.EXPO_PUBLIC_USE_MOCK === "true";

export default function MapScreen() {
  const { user } = useAuth();
  const { devices, isScanning, startScan } = useBLE();
  const { storeId, setStoreId, cartNumber, setCartNumber } = useStore();
  const [inputCartId, setInputCartId] = useState("");
  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"confirm" | "complete">("complete");
  const [finalAmount, setFinalAmount] = useState<number>(0);
  const [lastPaymentId, setLastPaymentId] = useState<number | null>(null);

  // 공통 퇴장 및 결제 처리 함수
  const handleExit = async () => {
    try {
      if (USE_MOCK_MODE) {
        // mock 처리
        console.log("MOCK MODE: 결제 시뮬레이션 실행");
        await new Promise((res) => setTimeout(res, 500));
        setFinalAmount(12900);
        setLastPaymentId(12345);
      } else {
        const res = await api.post("/api/cart/exit", { storeId, cartNumber });
        setFinalAmount(res.data.amount || 0);
        setLastPaymentId(res.data.receiptId);
      }

      setModalMode("complete");
      setModalVisible(true);
      Vibration.vibrate(800);

      setStoreId(null);
      setCartNumber(null);
    } catch (e) {
      console.error("퇴장/결제 처리 오류:", e);
      Alert.alert("오류", "퇴장 또는 결제 처리 중 문제가 발생했습니다.");
    }
  };

  // BLE 입장 감지
  useEffect(() => {
    const entryDevice = devices.find((d) => d.name === "MART01");
    if (entryDevice && !storeId) {
      const handleEnter = async () => {
        try {
          if (USE_MOCK_MODE) {
            console.log("MOCK MODE: 입장 시뮬레이션 실행");
            await new Promise((res) => setTimeout(res, 300));
          } else {
            await api.post("/api/cart/enter", { userId: user?.id, storeId: 1 });
          }

          setStoreId(1);
          Alert.alert("매장 입장", "매장에 입장하셨습니다.");
          Vibration.vibrate(500);
          router.replace("/cart");
        } catch (e) {
          console.error("입장 처리 오류:", e);
        }
      };
      handleEnter();
    }
  }, [devices]);

  // BLE 퇴장 감지 (자동 결제)
  useEffect(() => {
    const exitDevice = devices.find((d) => d.name === "MART_EXIT");
    if (exitDevice && storeId && cartNumber) {
      handleExit();
    }
  }, [devices, storeId, cartNumber]);

  // 수동 결제 버튼
  const handleManualPayment = async () => {
    Alert.alert("결제 확인", "결제를 진행하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "확인",
        onPress: async () => {
          await handleExit();
        },
      },
    ]);
  };

  // 카트 등록
  const handleRegister = async () => {
    if (!user?.id || !inputCartId) {
      Alert.alert("오류", "유저 또는 카트 정보가 부족합니다.");
      return;
    }

    try {
      const parsedCart = parseInt(inputCartId, 10);
      if (isNaN(parsedCart)) {
        Alert.alert("오류", "올바른 카트 번호를 입력하세요.");
        return;
      }

      if (USE_MOCK_MODE) {
        console.log("MOCK MODE: 카트 등록 시뮬레이션 실행");
        await new Promise((res) => setTimeout(res, 300));
      } else {
        await api.post("/api/cart/assign", { cartNumber: parsedCart });
      }

      setCartNumber(parsedCart);
      Alert.alert("등록 완료", "장바구니 화면으로 이동합니다.");
      router.push("/cart");
    } catch (e) {
      console.error("카트 등록 실패:", e);
      Alert.alert("등록 실패", "서버와 통신에 실패했습니다.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Map 화면 (BLE 테스트)</Text>

      {storeId ? (
        <Text style={styles.detected}>현재 위치: 매장 {storeId}</Text>
      ) : (
        <Text style={styles.detectedNone}>현재 위치: 없음</Text>
      )}

      <Button title={isScanning ? "스캔 중..." : "BLE 스캔 시작"} onPress={startScan} />

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text>
            {item.name || "Unknown"} ({item.id})
          </Text>
        )}
        style={{ marginVertical: 20 }}
      />

      <TextInput
        placeholder="카트 번호 입력"
        value={inputCartId}
        onChangeText={setInputCartId}
        style={styles.input}
        keyboardType="numeric"
      />
      <Button title="카트 등록하기" onPress={handleRegister} />

      <View style={{ marginTop: 20 }}>
        <Button title="결제하기 (수동)" color="#ff4d4d" onPress={handleManualPayment} />
      </View>

      <PaymentModal
        visible={modalVisible}
        mode={modalMode}
        amount={finalAmount}
        onClose={() => {
          setModalVisible(false);
          router.push("/home");
        }}
        onViewReceipt={() => {
          setModalVisible(false);
          if (lastPaymentId) {
            router.push({
              pathname: "/receipt",
              params: { payment_id: lastPaymentId.toString() },
            });
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  text: { fontSize: 20, fontWeight: "bold" },
  detected: { marginTop: 12, fontSize: 16, color: "green" },
  detectedNone: { marginTop: 12, fontSize: 16, color: "red" },
  input: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    width: 200,
    textAlign: "center",
  },
});
