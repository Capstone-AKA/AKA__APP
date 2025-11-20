import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BackButton from "../components/BackButton";
import api from "../api/api";

const USE_MOCK_MODE = process.env.EXPO_PUBLIC_USE_MOCK === "true";
const { width } = Dimensions.get("window");

export default function ReceiptScreen() {
  const { receipt_id } = useLocalSearchParams<{ receipt_id: string }>();

  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ 백엔드 명세: GET /api/payments/{receiptId}
  useEffect(() => {
    const fetchReceipt = async () => {
      setLoading(true);
      setError("");
      try {
        if (USE_MOCK_MODE) {
          // [Mock 데이터] — 개발용
          const mockData = {
            receiptId: receipt_id ?? 9999,
            issuedAt: new Date().toISOString(),
            paymentMethod: "KAKAOPAY",
            amount: 30000,
            userId: 5,
            cartId: 20,
            items: [
              { productName: "상품1상품1상품1상품1상품1상품1상품1상품1상품1", quantity: 2, totalPrice: 20000 },
              { productName: "상품2", quantity: 1, totalPrice: 10000 },
            ],
          };
          setReceipt(mockData);
        } else {
          const token = await AsyncStorage.getItem("accessToken");
          const res = await api.get(`/api/payments/${receipt_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setReceipt(res.data);
        }
      } catch (err) {
        console.error("❌ 영수증 조회 실패:", err);
        setError("영수증을 불러올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    };

    if (receipt_id) fetchReceipt();
  }, [receipt_id]);

  // ✅ 로딩 상태
  if (loading) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator size="large" color="#22c55e" style={{ marginTop: 100 }} />
      </View>
    );
  }

  // ✅ 오류 상태
  if (error || !receipt) {
    return (
      <View style={styles.screen}>
        <SafeAreaView>
          <BackButton targetPath="/history" />
        </SafeAreaView>
        <Text style={styles.loading}>{error || "영수증 데이터를 찾을 수 없습니다."}</Text>
      </View>
    );
  }

  // ✅ 본문 렌더링
  return (
    <View style={styles.screen}>
      <SafeAreaView>
        <BackButton targetPath="/history" />
      </SafeAreaView>

      <View style={styles.body}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.imageContainer}>
            <Image
              source={require("../assets/Receipt Card.png")}
              style={styles.cardImage}
              resizeMode="contain"
            />
          </View>

      <View style={styles.infoBox}>
        <View style={styles.row}>
          <Text style={styles.label}>💳 결제수단</Text>
          <Text style={styles.value}>{receipt.paymentMethod}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>🧾 영수증 번호</Text>
          <Text style={styles.value}>{receipt.receiptId}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>📅 결제일시</Text>
          <Text style={styles.value}>
            {new Date(receipt.issuedAt).toLocaleString()}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>🛒 카트 ID</Text>
          <Text style={styles.value}>{receipt.cartId}</Text>
        </View>
      </View>

          <View style={styles.dividerLine} />

          {receipt.items.map((item: any, index: number) => {
            const unitPrice = item.totalPrice / item.quantity;

            return (
              <View key={index} style={styles.itemRow}>
                <Text style={[styles.itemCol, { flex: 2 }]}>
                  {item.productName}
                </Text>

                <Text style={[styles.itemCol, { flex: 1, textAlign: "right" }]}>
                  {unitPrice.toLocaleString()}
                </Text>

                <Text style={[styles.itemCol, { flex: 0.5, textAlign: "center" }]}>
                  {item.quantity}
                </Text>

                <Text style={[styles.itemCol, { flex: 1, textAlign: "right" }]}>
                  ₩{item.totalPrice.toLocaleString()}
                </Text>
              </View>
            );
          })}


        {/* 구분선 */}
        <View style={styles.dividerLine} />

        {/* 판매 합계 행 */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>판매 합계</Text>

          <Text style={styles.totalAmount}>
            ₩{receipt.amount.toLocaleString()}
          </Text>
        </View>

        {/* 구분선 */}
        <View style={styles.dividerLine} />

        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 1},
  loading: { textAlign: "center", marginTop: 100, fontSize: 16, color: "#333" },
  dividerLine: { height: 1, backgroundColor: "#ccc", marginVertical: 16 },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 0, backgroundColor: "#fff" },
  scrollContent: { paddingBottom: 80, paddingHorizontal: 30 },
  store: { fontSize: 18, fontWeight: "bold", marginBottom: 12, color: "#222" },
  meta: { fontSize: 14, color: "#444", marginBottom: 4 },
  itemText: { fontSize: 13, marginBottom: 8, color: "#222" },
  total: { fontSize: 18, fontWeight: "bold", marginTop: 16, marginBottom: 12 },
  imageContainer: { width: "100%", alignItems: "center", marginTop: 10 },
  cardImage: { width: width - 60, height: 170 },
  infoBox: {
    marginTop: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  label: {
    width: 140,
    fontSize: 14,
    fontWeight: "600",
  },
  value: {
    fontSize: 14,
  }, 
  itemRow: {
    flexDirection: "row",
    marginBottom: 10,
    alignItems: "center",
  },
  itemCol: {
      fontSize: 15,
      color: "#222",
    },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
});