import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  SafeAreaView,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useStore } from "../../contexts/useStore";
import { useBLE } from "../../hooks/useBLE";
import PaymentModal from "../../components/PaymentModal";
import api, { BASE_URL } from "../../api/api"; // axios 인스턴스 + BASE_URL 가져오기
import { EXPO_PUBLIC_USE_MOCK } from "@env"; // 환경 변수로 mock 모드 제어

// 타입 정의
interface CartItem {
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
  total_price: number;
  image?: string;
}

export default function CartScreen() {
  const router = useRouter();
  const { cartNumber, setStoreId, setCartNumber } = useStore();
  const { stopScan } = useBLE();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"confirm" | "complete">("confirm");
  const [finalAmount, setFinalAmount] = useState<number>(0);
  const [finalItems, setFinalItems] = useState<CartItem[]>([]);
  const [lastPaymentId, setLastPaymentId] = useState<number | null>(null);

  // mock 모드 여부
  const USE_MOCK_PAYMENT = EXPO_PUBLIC_USE_MOCK === "true";

  // 장바구니 불러오기
  useEffect(() => {
    if (USE_MOCK_PAYMENT) {
      // [Mock용 코드]
      const fakeProducts: CartItem[] = [
        {
          product_id: 1,
          product_name: "사과",
          price: 5000,
          quantity: 1,
          total_price: 5000,
          image: "https://pds.joongang.co.kr/news/component/htmlphoto_mmdata/201401/26/htm_20140126161719195.jpg",
        },
        {
          product_id: 2,
          product_name: "배",
          price: 4000,
          quantity: 2,
          total_price: 8000,
          image: "https://ecimg.cafe24img.com/pg797b64254834015/sanjungfood10/web/product/big/20240228/e4db827f2184939db7533f8c3da276af.jpg",
        },
      ];
      setCartItems(fakeProducts);
      recalculateTotal(fakeProducts);
    } else {
      // 백엔드 연동
      const fetchCartItems = async () => {
        try {
          const res = await api.get(`/cart/${cartNumber}`);
          const data = res.data;
          setCartItems(data.items);
          recalculateTotal(data.items);
        } catch (error) {
          console.error("장바구니 불러오기 실패:", error);
        }
      };
      fetchCartItems();
    }
  }, [cartNumber]);

  // 합계 계산
  const recalculateTotal = (items: CartItem[]) => {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setTotalAmount(total);
  };

  // 수량 증가
  const increaseQuantity = async (id: number) => {
    if (USE_MOCK_PAYMENT) {
      const updated = cartItems.map((item) =>
        item.product_id === id
          ? { ...item, quantity: item.quantity + 1, total_price: item.price * (item.quantity + 1) }
          : item
      );
      setCartItems(updated);
      recalculateTotal(updated);
    } else {
      await api.post(`/cart/item/${id}/increase`);
    }
  };

  // 수량 감소
  const decreaseQuantity = async (id: number) => {
    if (USE_MOCK_PAYMENT) {
      const updated = cartItems.map((item) =>
        item.product_id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1, total_price: item.price * (item.quantity - 1) }
          : item
      );
      setCartItems(updated);
      recalculateTotal(updated);
    } else {
      await api.post(`/cart/item/${id}/decrease`);
    }
  };

  // 상품 삭제
  const removeItem = async (id: number) => {
    if (USE_MOCK_PAYMENT) {
      const filtered = cartItems.filter((item) => item.product_id !== id);
      setCartItems(filtered);
      recalculateTotal(filtered);
    } else {
      await api.delete(`/cart/item/${id}`);
    }
  };

  // 결제 처리
  const handlePayment = async () => {
    try {
      if (USE_MOCK_PAYMENT) {
        // [Mock 결제]
        const res = {
          data: { items: cartItems, amount: totalAmount, receiptId: 9999 },
        };
        setFinalItems(res.data.items);
        setFinalAmount(res.data.amount);
        setLastPaymentId(res.data.receiptId);
        setModalMode("complete");
        setModalVisible(true);
        setCartItems([]);
        setTotalAmount(0);

        stopScan();
        setStoreId(null);
        setCartNumber(null);
      } else {
        // 실제 결제 API
        const response = await api.post(`/payment`, {
          cartNumber,
          items: cartItems,
          amount: totalAmount,
        });
        const data = response.data;

        setFinalItems(data.items);
        setFinalAmount(data.amount);
        setLastPaymentId(data.receiptId);
        setModalMode("complete");
        setModalVisible(true);

        stopScan();
        setStoreId(null);
        setCartNumber(null);
      }
    } catch (error) {
      console.error("결제 오류:", error);
      Alert.alert("결제 실패", "결제 중 오류가 발생했습니다.");
    }
  };

  // 렌더링
  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.itemBox}>
      <View style={styles.topRow}>
        <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="contain" />
        <View style={styles.infoSection}>
          <Text style={styles.productName}>{item.product_name}</Text>
          <View style={styles.qtyContainer}>
            <Pressable style={styles.qtyBtn} onPress={() => decreaseQuantity(item.product_id)}>
              <Text style={styles.qtyBtnText}>-</Text>
            </Pressable>
            <Text style={styles.quantity}>{item.quantity}</Text>
            <Pressable style={styles.qtyBtn} onPress={() => increaseQuantity(item.product_id)}>
              <Text style={styles.qtyBtnText}>+</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.rightSection}>
          <Pressable onPress={() => removeItem(item.product_id)}>
            <Text style={styles.deleteText}>✕</Text>
          </Pressable>
          <Text style={styles.price}>₩{item.price.toLocaleString()}</Text>
        </View>
      </View>
    </View>
  );

  // UI
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.container}>
        <Text style={styles.pageTitle}>My Cart</Text>
        <View style={styles.underline} />

        {cartItems.length > 0 ? (
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.product_id.toString()}
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
          amount={finalAmount}
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
                params: { payment_id: lastPaymentId.toString() },
              });
            }
          }}
        />

        {cartItems.length > 0 && (
          <View style={styles.footer}>
            <Pressable
              style={styles.payButton}
              onPress={() => {
                setModalMode("confirm");
                setModalVisible(true);
              }}
            >
              <Text style={styles.payText}>결제하기</Text>
              <Text style={styles.total}>총 {totalAmount.toLocaleString()}원</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
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
  topRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  productImage: { width: 80, height: 80, marginRight: 15 },
  infoSection: { flex: 1, justifyContent: "center" },
  productName: { fontSize: 20, fontWeight: "700", color: "#111", marginBottom: 25 },
  qtyContainer: { flexDirection: "row", alignItems: "center" },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  qtyBtnText: { fontSize: 18, fontWeight: "600", color: "#333" },
  quantity: { fontSize: 17, fontWeight: "600", marginHorizontal: 10 },
  rightSection: { alignItems: "flex-end", justifyContent: "space-between", height: 70 },
  price: { fontSize: 17, fontWeight: "600", color: "#111" },
  deleteText: { fontSize: 20, color: "#C2C2C2", fontWeight: "bold" },
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
  payButton: { backgroundColor: "#22C55E", padding: 16, borderRadius: 12, alignItems: "center" },
  payText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  total: { color: "#fff", marginTop: 4 },
});
