// import React, { useEffect, useState, useRef } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TextInput,
//   Pressable,
//   Modal,
//   Alert,
// } from "react-native";
// import { useRouter } from "expo-router";
// import { useAuth } from "../contexts/useAuth";
// import { useBLE } from "../hooks/useBLE";
// import { useStore } from "../contexts/useStore";
// import api from "../api/api";

// const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === "true";

// // 입장/퇴장용 BLE 이름 구분
// const ENTRY_DEVICE_NAME = "MART_IN";
// const EXIT_DEVICE_NAME = "MART_OUT";

// // RSSI 및 감지 안정성 설정
// const EXIT_RSSI_THRESHOLD = -65; // 신호 세기 기준 (이보다 강해야 퇴장으로 인정)
// const EXIT_CONFIRM_COUNT = 3; // 3회 연속 감지 시 퇴장으로 인정

// export default function StoreBLE() {
//   const { user } = useAuth();
//   const { devices, startScan, stopScan } = useBLE();
//   const { storeId, setStoreId, setCartNumber } = useStore();
//   const router = useRouter();

//   const [cartInput, setCartInput] = useState("");
//   const [cartRegistered, setCartRegistered] = useState(false);
//   const [entryDetected, setEntryDetected] = useState(false);
//   const [isPaying, setIsPaying] = useState(false);
//   const [exitCount, setExitCount] = useState(0);

//   const scanInterval = useRef<NodeJS.Timeout | null>(null);

//   // BLE 지속 스캔 유지 (10초마다 재시작)
//   const startContinuousScan = () => {
//     console.log("BLE 지속 스캔 시작");
//     startScan();

//     if (scanInterval.current) clearInterval(scanInterval.current);
//     scanInterval.current = setInterval(() => {
//       stopScan();
//       startScan();
//     }, 10000);
//   };

//   const stopContinuousScan = () => {
//     console.log("BLE 지속 스캔 중단");
//     if (scanInterval.current) {
//       clearInterval(scanInterval.current);
//       scanInterval.current = null;
//     }
//     stopScan();
//   };

//   // 카트 등록
//   const handleCartRegister = async () => {
//     if (!cartInput) return Alert.alert("알림", "카트 번호를 입력해주세요.");
//     const parsedCart = parseInt(cartInput, 10);
//     if (isNaN(parsedCart)) return Alert.alert("알림", "숫자만 입력해주세요.");

//     try {
//       if (USE_MOCK) {
//         console.log("MOCK MODE: 실제 서버 요청 없이 테스트 실행 중");
//         await new Promise((res) => setTimeout(res, 500));
//       } else {
//         const res = await api.post("/api/cart/assign", { cartNumber: parsedCart });
//         console.log("서버 응답:", res.data);
//       }

//       setCartNumber(parsedCart);
//       setCartRegistered(true);
//       startContinuousScan();
//     } catch (err) {
//       console.error("카트 등록 실패:", err);
//       Alert.alert("오류", "카트 등록 실패 (서버 통신 오류)");
//     }
//   };

//   // BLE 입장 / 퇴장 감지
//   useEffect(() => {
//     if (!cartRegistered) return;
//     if (!devices.length) return;

//     const entryDevice = devices.find((d) => d.name === ENTRY_DEVICE_NAME);
//     const exitDevice = devices.find((d) => d.name === EXIT_DEVICE_NAME);

//     // 입장 감지
//     if (!entryDetected && entryDevice) {
//       console.log("입장 감지:", entryDevice.name);
//       setEntryDetected(true);
//       setStoreId(1);
//       router.replace("/cart"); // 입장 시 장바구니 화면으로 이동
//     }

//     // 퇴장 감지 (RSSI + 연속 감지 조건)
//     if (exitDevice && exitDevice.rssi !== null && exitDevice.rssi > EXIT_RSSI_THRESHOLD) {
//       setExitCount((prev) => prev + 1);
//       console.log(`퇴장 감지 누적: ${exitDevice.name} (${exitDevice.rssi}) → ${exitCount + 1}`);
//     } else {
//       // 감지가 끊기면 카운트 초기화
//       if (exitCount > 0) setExitCount(0);
//     }

//     if ((entryDetected || !entryDevice) && exitCount >= EXIT_CONFIRM_COUNT && !isPaying) {
//       console.log("🚪 퇴장 확정 (3회 연속 감지)");
//       handleAutoPayment();
//       setExitCount(0);
//     }
//   }, [devices]);

//   // 자동 결제 로직
//   const handleAutoPayment = async () => {
//     if (isPaying) return;
//     setIsPaying(true);

//     try {
//       stopContinuousScan();

//       if (USE_MOCK) {
//         console.log("MOCK 자동 결제 실행 중...");
//         await new Promise((res) => setTimeout(res, 1000));
//         console.log("MOCK 자동 결제 완료");
//       } else {
//         console.log("자동 결제 API 요청...");
//         await api.post(`/payment/checkout`, {
//           cartNumber: parseInt(cartInput, 10),
//           userId: user?.id,
//         });
//       }

//       // 상태 초기화
//       setStoreId(null);
//       setCartNumber(null);
//       setCartRegistered(false);
//       setEntryDetected(false);
//       setIsPaying(false);

//       router.replace({
//         pathname: "/cart",
//         params: { autoDone: "true" },
//       });
//     } catch (error) {
//       console.error("자동 결제 실패:", error);
//       Alert.alert("오류", "자동 결제 중 문제가 발생했습니다.");
//       setIsPaying(false);
//       startContinuousScan(); // 실패 시 다시 스캔 유지
//     }
//   };

//   // 언마운트 시 BLE 스캔 정리
//   useEffect(() => {
//     return () => {
//       stopContinuousScan();
//     };
//   }, []);

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>매장 입장 준비</Text>

//       <Modal visible={!cartRegistered} transparent animationType="fade">
//         <View style={styles.modalBackground}>
//           <View style={styles.modalBox}>
//             <Text style={styles.modalTitle}>카트 번호 입력</Text>
//             <TextInput
//               placeholder="카트 번호"
//               value={cartInput}
//               onChangeText={setCartInput}
//               style={styles.modalInput}
//               keyboardType="numeric"
//             />
//             <View style={{ flexDirection: "row", gap: 12 }}>
//               <Pressable style={styles.modalBtn} onPress={handleCartRegister}>
//                 <Text style={{ color: "#fff" }}>등록하기</Text>
//               </Pressable>
//               <Pressable
//                 style={[styles.modalBtn, { backgroundColor: "#888" }]}
//                 onPress={() => router.replace("/home")}
//               >
//                 <Text style={{ color: "#fff" }}>취소</Text>
//               </Pressable>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
//   title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
//   modalBackground: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "rgba(0,0,0,0.5)",
//   },
//   modalBox: {
//     backgroundColor: "#fff",
//     padding: 24,
//     borderRadius: 10,
//     alignItems: "center",
//     width: 280,
//   },
//   modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
//   modalInput: {
//     borderWidth: 1,
//     borderColor: "#ccc",
//     borderRadius: 8,
//     padding: 10,
//     width: "100%",
//     marginBottom: 16,
//     textAlign: "center",
//   },
//   modalBtn: {
//     backgroundColor: "#ff0101ff",
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//     borderRadius: 8,
//   },
// });

// ---------------------------------------------------
// //2번코드
// import React, { useEffect, useState, useRef } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TextInput,
//   Pressable,
//   Modal,
//   Alert,
// } from "react-native";

// import { useRouter } from "expo-router";
// import { useAuth } from "../contexts/useAuth";
// import { useBLE } from "../hooks/useBLE";
// import { useStore } from "../contexts/useStore";
// import api from "../api/api";

// const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === "true";

// // 입장/퇴장용 BLE 이름 구분
// const ENTRY_DEVICE_NAME = "MART_IN";
// const EXIT_DEVICE_NAME = "MART_OUT";

// // RSSI 및 감지 안정성 설정
// const EXIT_RSSI_THRESHOLD = -65; // 신호 세기 기준 (이보다 강해야 퇴장으로 인정)
// const EXIT_CONFIRM_COUNT = 3; // 3회 연속 감지 시 퇴장으로 인정

// export default function StoreBLE() {
//   const { user } = useAuth();
//   const { devices, startScan, stopScan } = useBLE();
//   const { storeId, setStoreId, setCartNumber } = useStore();
//   const router = useRouter();

//   const [cartInput, setCartInput] = useState("");
//   const [cartRegistered, setCartRegistered] = useState(false);
//   const [entryDetected, setEntryDetected] = useState(false);
//   const [isPaying, setIsPaying] = useState(false);
//   const [exitCount, setExitCount] = useState(0);

//   const scanInterval = useRef<NodeJS.Timeout | null>(null);

//   // BLE 지속 스캔 유지 (10초마다 재시작)
//   const startContinuousScan = () => {
//     console.log("BLE 지속 스캔 시작");
//     startScan();

//     if (scanInterval.current) clearInterval(scanInterval.current);
//     scanInterval.current = setInterval(() => {
//       stopScan();
//       startScan();
//     }, 10000);
//   };

//   const stopContinuousScan = () => {
//     console.log("BLE 지속 스캔 중단");
//     if (scanInterval.current) {
//       clearInterval(scanInterval.current);
//       scanInterval.current = null;
//     }
//     stopScan();
//   };

//   // 카트 등록
//   const handleCartRegister = async () => {
//     if (!cartInput) return Alert.alert("알림", "카트 번호를 입력해주세요.");
//     const parsedCart = parseInt(cartInput, 10);
//     if (isNaN(parsedCart)) return Alert.alert("알림", "숫자만 입력해주세요.");

//     try {
//       if (USE_MOCK) {
//         console.log("MOCK MODE: 실제 서버 요청 없이 테스트 실행 중");
//         await new Promise((res) => setTimeout(res, 500));
//       } else {
//         const res = await api.post("/api/cart/assign", { cartNumber: parsedCart });
//         console.log("서버 응답:", res.data);
//       }

//       setCartNumber(parsedCart);
//       setCartRegistered(true);
//       startContinuousScan();
//     } catch (err) {
//       console.error("카트 등록 실패:", err);
//       Alert.alert("오류", "카트 등록 실패 (서버 통신 오류)");
//     }
//   };

//   // BLE 입장 / 퇴장 감지
//   useEffect(() => {
//     if (!cartRegistered) return;
//     if (!devices.length) return;

//     const entryDevice = devices.find((d) => d.name === ENTRY_DEVICE_NAME);
//     const exitDevice = devices.find((d) => d.name === EXIT_DEVICE_NAME);

//     // 입장 감지
//     if (!entryDetected && entryDevice) {
//       console.log("입장 감지:", entryDevice.name);
//       setEntryDetected(true);
//       setStoreId(1);
//       router.replace("/cart"); // 입장 시 장바구니 화면으로 이동
//     }

//     // 퇴장 감지 (RSSI + 연속 감지 조건)
//     if (exitDevice && exitDevice.rssi !== null && exitDevice.rssi > EXIT_RSSI_THRESHOLD) {
//       setExitCount((prev) => prev + 1);
//       console.log(`퇴장 감지 누적: ${exitDevice.name} (${exitDevice.rssi}) → ${exitCount + 1}`);
//     } else {
//       // 감지가 끊기면 카운트 초기화
//       if (exitCount > 0) setExitCount(0);
//     }

//     if ((entryDetected || !entryDevice) && exitCount >= EXIT_CONFIRM_COUNT && !isPaying) {
//       console.log("🚪 퇴장 확정 (3회 연속 감지)");
//       handleAutoPayment();
//       setExitCount(0);
//     }
//   }, [devices]);

//   // 자동 결제 로직
//   const handleAutoPayment = async () => {
//     if (isPaying) return;
//     setIsPaying(true);

//     try {
//       stopContinuousScan();

//       if (USE_MOCK) {
//         console.log("MOCK 자동 결제 실행 중...");
//         await new Promise((res) => setTimeout(res, 1000));
//         console.log("MOCK 자동 결제 완료");
//       } else {
//         console.log("자동 결제 API 요청...");
//         await api.post(`/payment/checkout`, {
//           cartNumber: parseInt(cartInput, 10),
//           userId: user?.id,
//         });
//       }

//       // 상태 초기화
//       setStoreId(null);
//       setCartNumber(null);
//       setCartRegistered(false);
//       setEntryDetected(false);
//       setIsPaying(false);

//       router.replace({
//         pathname: "/cart",
//         params: { autoDone: "true" },
//       });
//     } catch (error) {
//       console.error("자동 결제 실패:", error);
//       Alert.alert("오류", "자동 결제 중 문제가 발생했습니다.");
//       setIsPaying(false);
//       startContinuousScan(); // 실패 시 다시 스캔 유지
//     }
//   };

//   // 언마운트 시 BLE 스캔 정리
//   useEffect(() => {
//     return () => {
//       stopContinuousScan();
//     };
//   }, []);

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>매장 입장 준비</Text>

//       <Modal visible={!cartRegistered} transparent animationType="fade">
//         <View style={styles.modalBackground}>
//           <View style={styles.modalBox}>
//             <Text style={styles.modalTitle}>카트 번호 입력</Text>
//             <TextInput
//               placeholder="카트 번호"
//               value={cartInput}
//               onChangeText={setCartInput}
//               style={styles.modalInput}
//               keyboardType="numeric"
//             />
//             <View style={{ flexDirection: "row", gap: 12 }}>
//               <Pressable style={styles.modalBtn} onPress={handleCartRegister}>
//                 <Text style={{ color: "#fff" }}>등록하기</Text>
//               </Pressable>
//               <Pressable
//                 style={[styles.modalBtn, { backgroundColor: "#888" }]}
//                 onPress={() => router.replace("/home")}
//               >
//                 <Text style={{ color: "#fff" }}>취소</Text>
//               </Pressable>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
//   title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
//   modalBackground: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "rgba(0,0,0,0.5)",
//   },
//   modalBox: {
//     backgroundColor: "#fff",
//     padding: 24,
//     borderRadius: 10,
//     alignItems: "center",
//     width: 280,
//   },
//   modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
//   modalInput: {
//     borderWidth: 1,
//     borderColor: "#ccc",
//     borderRadius: 8,
//     padding: 10,
//     width: "100%",
//     marginBottom: 16,
//     textAlign: "center",
//   },
//   modalBtn: {
//     backgroundColor: "#ff0101ff",
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//     borderRadius: 8,
//   },
// });


//🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥
// 기존코드 중요

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

    const entry = devices[ENTRY_DEVICE_NAME];
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

//🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥

