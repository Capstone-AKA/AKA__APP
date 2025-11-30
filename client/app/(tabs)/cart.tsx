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
import AsyncStorage from "@react-native-async-storage/async-storage";
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

const USE_MOCK_CART = EXPO_PUBLIC_USE_MOCK === "true";

const MOCK_CART_ITEMS: CartItem[] = [
  {
    cartItemId: 1,
    product_id: 101,
    product_name: "신라면",
    price: 950,
    quantity: 2,
    total_price: 1900,
    image: "https://i.ibb.co/vQcR2WC/shinramen.png",
  },
  {
    cartItemId: 2,
    product_id: 102,
    product_name: "코카콜라 500ml",
    price: 1800,
    quantity: 1,
    total_price: 1800,
    image: "https://i.ibb.co/1TK4ZfS/cocacola.png",
  },
  {
    cartItemId: 3,
    product_id: 103,
    product_name: "바나나우유",
    price: 1300,
    quantity: 3,
    total_price: 3900,
    image: "https://i.ibb.co/HdQhPzB/banana.png",
  },
   {
    cartItemId: 4,
    product_id: 104,
    product_name: "포카칩 오리지널",
    price: 1700,
    quantity: 1,
    total_price: 1700,
    image: "https://i.ibb.co/pjqpKqK/potatochips.png",
  },
  {
    cartItemId: 5,
    product_id: 105,
    product_name: "홈런볼",
    price: 1500,
    quantity: 2,
    total_price: 3000,
    image: "https://i.ibb.co/9r6H2Zs/homeunball.png",
  },
  {
    cartItemId: 6,
    product_id: 106,
    product_name: "초코우유",
    price: 1400,
    quantity: 1,
    total_price: 1400,
    image: "https://i.ibb.co/s6wgGfJ/chocomilk.png",
  },
  {
    cartItemId: 7,
    product_id: 107,
    product_name: "삼각김밥 참치마요",
    price: 1200,
    quantity: 3,
    total_price: 3600,
    image: "https://i.ibb.co/ZV0RZ2M/kimbab.png",
  },
  {
    cartItemId: 8,
    product_id: 108,
    product_name: "컵라면 육개장",
    price: 950,
    quantity: 2,
    total_price: 1900,
    image: "https://i.ibb.co/jwjW3t8/yukgaejang.png",
  },
  {
    cartItemId: 9,
    product_id: 109,
    product_name: "삼다수 2L",
    price: 1200,
    quantity: 2,
    total_price: 2400,
    image: "https://i.ibb.co/1z92Y63/samdaseu.png",
  },
  {
    cartItemId: 10,
    product_id: 110,
    product_name: "바나나",
    price: 3900,
    quantity: 1,
    total_price: 3900,
    image: "https://i.ibb.co/NYKF7pJ/bananafruit.png",
  },
  {
    cartItemId: 11,
    product_id: 111,
    product_name: "양파 3kg",
    price: 6900,
    quantity: 1,
    total_price: 6900,
    image: "https://i.ibb.co/8zC1rwB/onion.png",
  },
  {
    cartItemId: 12,
    product_id: 112,
    product_name: "햇반 210g",
    price: 1500,
    quantity: 4,
    total_price: 6000,
    image: "https://i.ibb.co/8mBvG0w/hetban.png",
  },
  {
    cartItemId: 13,
    product_id: 113,
    product_name: "비비고 만두",
    price: 5200,
    quantity: 1,
    total_price: 5200,
    image: "https://i.ibb.co/v1MpQ5j/mandu.png",
  },
];

const EXIT_DEVICE_NAME = "MART_OUT";
const EXIT_RSSI_THRESHOLD = -90;
const EXIT_DETECTION_WINDOW = 3000;

export default function CartScreen() {
  const router = useRouter();
  const { cartNumber, setStoreId, setCartNumber } = useStore();
  const { user } = useAuth();
  const { startScan, stopScan, devices } = useBLE();

  const lastUpdateRef = useRef(0);
  const exitRef = useRef<any>(null);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] =
    useState<"confirm" | "complete">("confirm");

  const [finalAmount, setFinalAmount] = useState(0);
  const [finalItems, setFinalItems] = useState<CartItem[]>([]);
  const [lastPaymentId, setLastPaymentId] = useState<number | null>(null);

  const [isPaying, setIsPaying] = useState(false);
  const [exitDetected, setExitDetected] = useState(false);

  const stompClientRef = useRef<Client | null>(null);
  const USE_MOCK_PAYMENT = EXPO_PUBLIC_USE_MOCK === "true";

  /* ------------------------------- 1️⃣ BLE 스캔 시작 ------------------------------- */  
  useEffect(() => {
    console.log("📡 CART 페이지 스캔 예약");

    const timer = setTimeout(() => {
      console.log("📡 CART 페이지 BLE 스캔 시작");
      startScan();
    }, 300); // 🔥 딜레이 추가

    return () => {
      clearTimeout(timer);
      stopScan();
    };
  }, []);

  /* ------------------------------- 2️⃣ WebSocket + JWT 연결 ------------------------------- */
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

            setCartItems((prevItems) => {
              const updated = [...prevItems];

              mappedItems.forEach((newItem: CartItem) => {
                const idx = updated.findIndex(
                  (i) => i.cartItemId === newItem.cartItemId
                );
                if (idx !== -1) updated[idx] = newItem;
                else updated.push(newItem);
              });

              if (data.newTotalAmount !== undefined) {
                setTotalAmount(data.newTotalAmount);
              } else {
                recalculateTotal(updated);
              }

              return updated;
            });
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
        Alert.alert("WebSocket 오류", e instanceof Error ? e.message : "알 수 없는 오류");
      }
    };

    connectWebSocket();

    return () => {
      isActive = false;
      stompClientRef.current?.deactivate();
    };
  }, [cartNumber, user?.id]);

  /* ------------------------------- MOCK 장바구니 ------------------------------- */
  useEffect(() => {
    if (USE_MOCK_CART) {
      console.log("🧪 MOCK 장바구니 데이터 로드");
      setCartItems(MOCK_CART_ITEMS);
      recalculateTotal(MOCK_CART_ITEMS);
    }
  }, [USE_MOCK_CART]);

  /* ------------------------------- 총액 계산 ------------------------------- */
  const recalculateTotal = (items: CartItem[]) => {
    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    setTotalAmount(total);
  };

  /* ------------------------------- 수량 증가/감소/삭제 ------------------------------- */
  const handleIncrease = async (cartItemId: number) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      await api.patch(
        `/api/cart/items/${cartItemId}/increase`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("✅ 수량 증가 성공:", cartItemId);
    } catch (error) {
      console.error("❌ 수량 증가 실패:", error);
    }
  };

  const handleDecrease = async (cartItemId: number) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      await api.patch(
        `/api/cart/items/${cartItemId}/decrease`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("✅ 수량 감소 성공:", cartItemId);
    } catch (error) {
      console.error("❌ 수량 감소 실패:", error);
    }
  };

  const handleDelete = async (cartItemId: number) => {
    const prevItems = [...cartItems];
    const updatedItems = prevItems.filter(
      (item) => item.cartItemId !== cartItemId
    );

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
      setCartItems(prevItems);
      recalculateTotal(prevItems);
    }
  };

  /* ------------------------------- BLE 퇴장 감지 ------------------------------- */
    useEffect(() => {
      if (!cartNumber) return;
      if (isPaying || exitDetected) return;

    const exit = devices.EXIT;
    if (!exit || typeof exit.rssi !== "number") return;

    if (exit.rssi > EXIT_RSSI_THRESHOLD) {
      console.log("🚪 퇴장 비콘 감지!", exit.rssi);
      setExitDetected(true);

      // 🔥 WebSocket 마지막 업데이트 기다림
      setTimeout(() => {
        handleAutoPayment();
      }, 500); // ← 핵심 수정

      setTimeout(() => {
        setExitDetected(false);
        setIsPaying(false);
      }, EXIT_DETECTION_WINDOW);
    }
  }, [devices.EXIT]);


  /* ------------------------------- 자동 결제 ------------------------------- */
  const handleAutoPayment = async () => {
    if (isPaying) return;
    setIsPaying(true);

    try {
      console.log("💳 자동 결제 중...");

      let newReceiptId = null;

      if (USE_MOCK_PAYMENT) {
        await new Promise(res => setTimeout(res, 800));

        const mockReceipt = {
          receiptId: 9999,
          issuedAt: new Date().toISOString(),
          paymentMethod: "MOCKPAY",
          amount: totalAmount,
          cartId: cartNumber,
          items: cartItems.map(i => ({
            productName: i.product_name,
            quantity: i.quantity,
            totalPrice: i.total_price,
          })),
        };

        // 🔥 ReceiptScreen에서 읽을 수 있도록 저장
        await AsyncStorage.setItem("mockReceipt", JSON.stringify(mockReceipt));

        console.log("💾 자동결제 Mock Receipt 저장 완료:", mockReceipt);

        newReceiptId = 9999; // 기존과 동일하게 설정
      } else {
        const token = await AsyncStorage.getItem("accessToken");
        const response = await api.post(
          `/api/payments/checkout`,
          { cartNumber },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log("✅ 결제 완료 응답:", response.data);
        newReceiptId = response.data.receiptId;
      }

      // ⭕ setState "이후"가 아닌, 즉시 값을 기억
      setLastPaymentId(newReceiptId);

      // 기존 흐름 유지
      setCartItems([]);
      setTotalAmount(0);
      setStoreId(null);
      setCartNumber(null);
      stopScan();

      setModalMode("complete");
      setModalVisible(true);
      setIsPaying(false);

    } catch (error) {
      console.error("❌ 자동 결제 실패:", error);
      setIsPaying(false);
    }
  };

  /* ------------------------------- 수동 결제 ------------------------------- */
  const handlePayment = async () => {
    try {
      const token = await AsyncStorage.getItem("accessToken");

      if (USE_MOCK_PAYMENT) {
        const mockReceipt = {
          receiptId: 9999,
          issuedAt: new Date().toISOString(),
          paymentMethod: "MOCKPAY",
          amount: totalAmount,
          cartId: cartNumber,
          items: cartItems.map(i => ({
            productName: i.product_name,
            quantity: i.quantity,
            totalPrice: i.total_price,
          })),
        };

        // 🔥 ReceiptScreen에서 불러올 mock 저장
        await AsyncStorage.setItem("mockReceipt", JSON.stringify(mockReceipt));

        console.log("💾 수동결제 Mock Receipt 저장 완료:", mockReceipt);

        // 기존 UI 상태 유지
        setFinalAmount(mockReceipt.amount);
        setLastPaymentId(mockReceipt.receiptId);

        setModalMode("complete");
        setModalVisible(true);

        setCartItems([]);
        setTotalAmount(0);
        stopScan();
        setStoreId(null);
        setCartNumber(null);
        return; // 서버 호출 막기
      }else {
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

  /* ------------------------------- 렌더링 ------------------------------- */
  // const renderItem = ({ item }: { item: CartItem }) => (
  //   <View style={styles.itemBox}>
  //     <View style={styles.topRow}>
  //       <Image
  //         source={{ uri: item.image }}
  //         style={styles.productImage}
  //         resizeMode="contain"
  //       />
  //       <View style={styles.infoSection}>
  //         <Text style={styles.productName}>{item.product_name}</Text>
  //         <Text style={styles.quantity}>x {item.quantity}</Text>
  //         <View style={styles.actionRow}>
  //           <TouchableOpacity
  //             onPress={() => handleDecrease(item.cartItemId)}
  //             style={styles.actionBtn}
  //           >
  //             <Text style={styles.actionText}>－</Text>
  //           </TouchableOpacity>
  //           <TouchableOpacity
  //             onPress={() => handleIncrease(item.cartItemId)}
  //             style={styles.actionBtn}
  //           >
  //             <Text style={styles.actionText}>＋</Text>
  //           </TouchableOpacity>
  //           <TouchableOpacity
  //             onPress={() => handleDelete(item.cartItemId)}
  //             style={styles.deleteBtn}
  //           >
  //             <Text style={styles.deleteText}>삭제</Text>
  //           </TouchableOpacity>
  //         </View>
  //       </View>
  //       <View style={styles.rightSection}>
  //         <Text style={styles.price}>₩{item.total_price.toLocaleString()}</Text>
  //       </View>
  //     </View>
  //   </View>
  // );

    const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.itemBox}>
      <View style={styles.topRow}>
        <Image
          source={{ uri: item.image }}
          style={styles.productImage}
          resizeMode="contain"
        />

        <View style={styles.infoSection}>
          <Text style={styles.productName}>{item.product_name}</Text>

          {/* 🔥 단가 × 수량 추가 */}
          <Text style={styles.unitPrice}>
            {item.price.toLocaleString()} × {item.quantity}개
          </Text>

          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={() => handleDecrease(item.cartItemId)}
              style={styles.actionBtn}
            >
              <Text style={styles.actionText}>－</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleIncrease(item.cartItemId)}
              style={styles.actionBtn}
            >
              <Text style={styles.actionText}>＋</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleDelete(item.cartItemId)}
              style={styles.deleteBtn}
            >
              <Text style={styles.deleteText}>삭제</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.rightSection}>
          {/* 총합 */}
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
            contentContainerStyle={{ paddingBottom: 180 }}
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

            // lastPaymentId가 최신 값임을 보장하기 위해 바로 push
            if (lastPaymentId) {
              router.push(`/receipt?receipt_id=${lastPaymentId}`);
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
              <Text style={styles.total}>
                총 {totalAmount.toLocaleString()}원
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

/* ------------------------------- 스타일 ------------------------------- */
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
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  productImage: { width: 80, height: 80, marginRight: 15 },
  infoSection: { flex: 1, justifyContent: "center" },
  productName: { fontSize: 15, fontWeight: "600", marginBottom: 8 },
  unitPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#22C55E",
    marginBottom: 4,
  },
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
