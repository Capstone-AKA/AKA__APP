import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useStore } from "../../contexts/useStore";
import { useBLE } from "../../hooks/useBLE";
import PaymentModal from "../../components/PaymentModal";
import api from "../../api/api";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import AsyncStorage from "@react-native-async-storage/async-storage"; // JWT 저장소
import { BASE_URL, EXPO_PUBLIC_USE_MOCK } from "@env";
import { useAuth } from "../../contexts/useAuth";

interface CartItem {
  cartItemId: number; 
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
  total_price: number;
  image?: string;
}

const EXIT_DEVICE_NAME = "MART_OUT";
const EXIT_RSSI_THRESHOLD = -90;
const EXIT_DETECTION_WINDOW = 3000;

export default function CartScreen() {
  const router = useRouter();
  const { cartNumber, setStoreId, setCartNumber } = useStore();
  const { user } = useAuth();
  const { startScan, stopScan, devices } = useBLE();
  const lastUpdateRef = useRef(0); // WS 업데이트 Race Condition 방지용
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"confirm" | "complete">("confirm");
  const [finalAmount, setFinalAmount] = useState(0);
  const [finalItems, setFinalItems] = useState<CartItem[]>([]);
  const [lastPaymentId, setLastPaymentId] = useState<number | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [exitDetected, setExitDetected] = useState(false);

  const stompClientRef = useRef<Client | null>(null);
  const USE_MOCK_PAYMENT = EXPO_PUBLIC_USE_MOCK === "true";

  // ✅ 1️⃣ BLE 스캔 시작
  useEffect(() => {
    startScan();
    console.log("📡 CART 페이지 BLE 스캔 시작");
    return () => stopScan();
  }, []);

  // ✅ 2️⃣ WebSocket + JWT 연결
  useEffect(() => {
    if (!cartNumber) return;

    let isActive = true;
    const connectWebSocket = async () => {
      try {
        const token = await AsyncStorage.getItem("accessToken");

        if (!token) {
          console.warn("⚠️ JWT 없음: AsyncStorage에서 토큰을 찾지 못했습니다");
          return;
        }

        console.log("✅ JWT 확인:", token.substring(0, 20), "...");

        const socketUrl = `${BASE_URL.replace(/\/$/, "")}/ws?token=${token}&_=${Date.now()}`;
        console.log("🔌 WebSocket 연결 시도:", socketUrl);

        const client = new Client({
          webSocketFactory: () => new SockJS(socketUrl),
          reconnectDelay: 5000,
          debug: (msg) => console.log("📡 [STOMP]", msg),
        });

        client.onConnect = () => {
          if (!isActive) return;
          console.log("🟢 STOMP 연결 성공");

          if (user?.id) {
            client.subscribe(`/topic/user/${user.id}`, (message) => {
              const data = JSON.parse(message.body);
              console.log("👤 사용자 전용 데이터 수신:", data);
            });
          }

          client.subscribe(`/topic/cart/${cartNumber}`, (message) => {
            const now = Date.now();

            // 🔥 100ms 이내에 들어오는 오래된 메시지 무시
            if (now - lastUpdateRef.current < 100) {
              console.log("⛔ 오래된 WS 메시지 무시");
              return;
            }
            lastUpdateRef.current = now;

            if (!message.body) return;

            const data = JSON.parse(message.body);
            console.log("🧺 실시간 장바구니 업데이트:", data);

            if (!data?.items) return;

            const mappedItems = data.items.map((item: any) => ({
              cartItemId: item.cartItemId,
              product_id: item.productId,
              product_name: item.productName,
              price: item.unitPrice,
              quantity: item.quantity,
              total_price: item.totalPrice,
              image: item.productImageUrl,
            }));

            setCartItems(mappedItems);
            recalculateTotal(mappedItems);
          });

          client.publish({
            destination: "/app/joinCart",
            body: JSON.stringify({ cartNumber }),
          });
        };

        client.onDisconnect = () => console.log("🔴 STOMP 연결 종료");
        client.onStompError = (frame) =>
          console.error("❌ STOMP 오류:", frame.headers["message"]);

        client.activate();
        stompClientRef.current = client;
      } catch (e) {
        console.error("🚫 WebSocket 연결 중 오류:", e);
        if (e instanceof Error) {
          Alert.alert("WebSocket 오류", e.message);
        } else {
          Alert.alert("WebSocket 오류", "알 수 없는 오류가 발생했습니다.");
        }
      }
    };

    connectWebSocket();

    return () => {
      isActive = false;
      stompClientRef.current?.deactivate();
    };
  }, [cartNumber, user?.id]);

  // ✅ 3️⃣ 총액 계산
  const recalculateTotal = (items: CartItem[]) => {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setTotalAmount(total);
  };

  // ✅ 4️⃣ 수량 증가/감소/삭제 API
  const handleIncrease = async (cartItemId: number) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      await api.patch(`/api/cart/items/${cartItemId}/increase`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("✅ 수량 증가 성공:", cartItemId);
    } catch (error) {
      console.error("❌ 수량 증가 실패:", error);
    }
  };

  const handleDecrease = async (cartItemId: number) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      await api.patch(`/api/cart/items/${cartItemId}/decrease`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("✅ 수량 감소 성공:", cartItemId);
    } catch (error) {
      console.error("❌ 수량 감소 실패:", error);
    }
  };

const handleDelete = async (cartItemId: number) => {
  const prevItems = [...cartItems]; // 롤백 대비 복사본
  const updatedItems = prevItems.filter((item) => item.cartItemId !== cartItemId);

  // UI에서 즉시 삭제
  setCartItems(updatedItems);
  recalculateTotal(updatedItems);

  try {
    const token = await AsyncStorage.getItem("accessToken");
    await api.delete(`/api/cart/items/${cartItemId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("🗑️ 상품 삭제 성공:", cartItemId);
  } catch (error) {
    console.error("❌ 상품 삭제 실패:", error);
    Alert.alert("서버 오류", "상품 삭제에 실패했습니다.");

    // 실패 시 원래 상태로 되돌림
    setCartItems(prevItems);
    recalculateTotal(prevItems);
  }
};

  // ✅ 5️⃣ BLE 퇴장 감지 → 결제 처리
  useEffect(() => {
    if (!cartNumber || isPaying || exitDetected) return;

    const exit = devices[EXIT_DEVICE_NAME];
    if (exit && typeof exit.rssi === "number" && exit.rssi > EXIT_RSSI_THRESHOLD) {
      console.log(`🚪 퇴장 비콘 감지됨: ${exit.name} (RSSI: ${exit.rssi})`);
      setExitDetected(true);
      stopScan();
      handleAutoPayment();

      setTimeout(() => {
        console.log("🔄 퇴장 감지 초기화 및 재시작");
        setExitDetected(false);
        setIsPaying(false);
        startScan();
      }, EXIT_DETECTION_WINDOW);
    }
  }, [devices]);

  // ✅ 6️⃣ 자동 결제
  const handleAutoPayment = async () => {
    if (isPaying) return;
    setIsPaying(true);

    try {
      stopScan();
      console.log("💳 자동 결제 중...");

      if (USE_MOCK_PAYMENT) {
        await new Promise((res) => setTimeout(res, 1000));
        console.log("💰 MOCK 결제 완료");
      } else {
        const token = await AsyncStorage.getItem("accessToken");
        const response = await api.post(
          `/api/payments/checkout`,
          { cartNumber },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("✅ 결제 완료 응답:", response.data);
        setLastPaymentId(response.data.receiptId); 
      }

      setCartItems([]);
      setTotalAmount(0);
      setStoreId(null);
      setCartNumber(null);

      setModalMode("complete");
      setModalVisible(true);
      setIsPaying(false);
    } catch (error) {
      console.error("❌ 자동 결제 실패:", error);
      setIsPaying(false);
      startScan();
    }
  };

  // ✅ 7️⃣ 수동 결제
  const handlePayment = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");

      if (USE_MOCK_PAYMENT) {
        const res = {
          data: { items: cartItems, amount: totalAmount, receiptId: 9999 },
        };
        setFinalItems(res.data.items);
        setFinalAmount(res.data.amount);
        setLastPaymentId(res.data.receiptId);
      } else {
        const response = await api.post(
          `/api/payments/checkout`,
          {
            cartNumber,
            items: cartItems,
            amount: totalAmount,
          },
          {
            headers: { Authorization: `Bearer ${token}` }, 
          }
        );

        const data = response.data;
        setFinalItems(data.items);
        setFinalAmount(data.amount);
        setLastPaymentId(data.receiptId);
      }

      setModalMode("complete");
      setModalVisible(true);
      setCartItems([]);
      setTotalAmount(0);
      stopScan();
      setStoreId(null);
      setCartNumber(null);
    } catch (error) {
      console.error("결제 오류:", error);
      Alert.alert("결제 실패", "결제 중 오류가 발생했습니다.");
    }
  };

  // ✅ 8️⃣ 렌더링
  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.itemBox}>
      <View style={styles.topRow}>
        <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="contain" />
        <View style={styles.infoSection}>
          <Text style={styles.productName}>{item.product_name}</Text>
          <Text style={styles.quantity}>x {item.quantity}</Text>

          <View style={styles.actionRow}>
            <TouchableOpacity onPress={() => handleDecrease(item.cartItemId)} style={styles.actionBtn}>
              <Text style={styles.actionText}>－</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleIncrease(item.cartItemId)} style={styles.actionBtn}>
              <Text style={styles.actionText}>＋</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.cartItemId)} style={styles.deleteBtn}>
              <Text style={styles.deleteText}>삭제</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.rightSection}>
          <Text style={styles.price}>₩{item.total_price.toLocaleString()}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.container}>
        <Text style={styles.pageTitle}>🧺 My Cart</Text>
        <View style={styles.underline} />

        {cartItems.length > 0 ? (
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.cartItemId.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 120 }}
          />
        ) : (
          <Text style={{ textAlign: "center", marginTop: 20, color: "gray" }}>
            장바구니에 담긴 상품이 없습니다.
          </Text>
        )}

        <PaymentModal
          visible={modalVisible}
          mode={modalMode}
          amount={finalAmount || totalAmount}
          onClose={() => {
            setModalVisible(false);
            if (modalMode === "complete") router.push("/home");
          }}
          onConfirm={handlePayment}
          onViewReceipt={() => {
            setModalVisible(false);
            stopScan();
            setStoreId(null);
            setCartNumber(null);
            if (lastPaymentId) {
              router.push({
                pathname: "/receipt",
                params: { receipt_id: lastPaymentId.toString() },
              });
            }
          }}
        />

        {cartItems.length > 0 && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.payButton}
              onPress={() => {
                setModalMode("confirm");
                setModalVisible(true);
              }}
            >
              <Text style={styles.payText}>결제하기</Text>
              <Text style={styles.total}>총 {totalAmount.toLocaleString()}원</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// ✅ 스타일
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  pageTitle: {
    fontSize: 23,
    fontWeight: "bold",
    textAlign: "center",
    paddingTop: 45,
    marginBottom: 20,
  },
  underline: { height: 1, backgroundColor: "#ccc" },
  itemBox: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E6E6E6",
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  productImage: { width: 80, height: 80, marginRight: 15 },
  infoSection: { flex: 1, justifyContent: "center" },
  productName: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  quantity: { fontSize: 16, fontWeight: "600", color: "#22C55E" },
  rightSection: { alignItems: "flex-end", justifyContent: "center" },
  price: { fontSize: 16, fontWeight: "600", color: "#111" },
  actionRow: { flexDirection: "row", marginTop: 8 },
  actionBtn: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
  },
  actionText: { fontSize: 16, fontWeight: "bold" },
  deleteBtn: {
    backgroundColor: "#ef4444",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  deleteText: { color: "#fff", fontWeight: "bold" },
  footer: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
  },
  payButton: {
    backgroundColor: "#22C55E",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  payText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  total: { color: "#fff", marginTop: 4 },
});