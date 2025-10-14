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
import BackButton from "../components/BackButton";
import api from "../api/api";

// 환경 변수 직접 불러오기
// env만 false해주면됨 아래는 건들필요 ㄴㄴ
const USE_MOCK_MODE = process.env.EXPO_PUBLIC_USE_MOCK === "true";
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL!;

const { width } = Dimensions.get("window");

export default function ReceiptScreen() {
  const { payment_id } = useLocalSearchParams<{ payment_id: string }>();

  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReceipt = async () => {
      setLoading(true);
      setError("");
      try {
        if (USE_MOCK_MODE) {
          // [Mock 데이터]
          const mockData = {
            receipt_id: payment_id ?? 9999,
            issued_at: new Date().toISOString(),
            receipt_data: {
              store: "테스트 마켓 A",
              payment_method: "신용카드",
              total_amount: 12900,
              items: [
                { name: "사과", quantity: 2, total: 6000 },
                { name: "배", quantity: 1, total: 4500 },
                { name: "콜라", quantity: 1, total: 2400 },
              ],
            },
          };
          setReceipt(mockData);
        } else {
          // [백엔드 연동용 코드]
          const res = await api.get("/receipt", {
            params: { payment_id },
          });
          setReceipt(res.data);
        }
      } catch (err) {
        console.error("영수증 조회 실패:", err);
        setError("영수증을 불러올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    };

    if (payment_id) fetchReceipt();
  }, [payment_id]);

  if (loading) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator size="large" color="#2ecc71" style={{ marginTop: 100 }} />
      </View>
    );
  }

  if (error || !receipt) {
    return (
      <View style={styles.screen}>
        <SafeAreaView>
          <BackButton targetPath="/history" />
        </SafeAreaView>
        <Text style={styles.loading}>{error || "영수증 데이터가 없습니다."}</Text>
      </View>
    );
  }

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

          <Text style={styles.store}>{receipt.receipt_data.store}</Text>
          <Text style={styles.meta}>영수증 ID: {receipt.receipt_id}</Text>
          <Text style={styles.meta}>
            발행일시: {new Date(receipt.issued_at).toLocaleString()}
          </Text>
          <Text style={styles.meta}>
            결제수단: {receipt.receipt_data.payment_method}
          </Text>

          <View style={styles.dividerLine} />

          {receipt.receipt_data.items.map((item: any, index: number) => (
            <Text key={index} style={styles.itemText}>
              {item.name} x {item.quantity} = ₩{item.total.toLocaleString()}
            </Text>
          ))}

          <Text style={styles.total}>
            총합: ₩{receipt.receipt_data.total_amount.toLocaleString()}
          </Text>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 18 },
  loading: { textAlign: "center", marginTop: 100, fontSize: 16, color: "#333" },
  dividerLine: { height: 1, backgroundColor: "#ccc", marginVertical: 16 },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 16, backgroundColor: "#fff" },
  scrollContent: { paddingBottom: 80, paddingHorizontal: 30 },
  store: { fontSize: 18, fontWeight: "bold", marginBottom: 12, color: "#222" },
  meta: { fontSize: 14, color: "#444", marginBottom: 4 },
  itemText: { fontSize: 16, marginBottom: 8, color: "#222" },
  total: { fontSize: 18, fontWeight: "bold", marginTop: 16, marginBottom: 12 },
  imageContainer: { width: "100%", alignItems: "center", marginTop: 10 },
  cardImage: { width: width - 60, height: 180 },
});
