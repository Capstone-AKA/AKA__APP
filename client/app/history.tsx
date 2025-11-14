import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../contexts/useAuth";
import BackButton from "../components/BackButton";
import api from "../api/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { EXPO_PUBLIC_USE_MOCK } from "@env";

// 백엔드 명세 기준 타입 정의
interface Payment {
  receiptId: number;
  issuedAt: string;
  paymentMethod: string;
  amount: number;
  cartId: number;
}

export default function HistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const USE_MOCK_MODE = EXPO_PUBLIC_USE_MOCK === "true";

  // ✅ 결제 내역 불러오기
  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      setError("");
      try {
        if (USE_MOCK_MODE) {
          // [Mock용 더미 데이터]
          const mockPayments: Payment[] = [
            {
              receiptId: 1,
              issuedAt: new Date().toISOString(),
              paymentMethod: "KAKAOPAY",
              amount: 12500,
              cartId: 3,
            },
            {
              receiptId: 2,
              issuedAt: new Date().toISOString(),
              paymentMethod: "CARD",
              amount: 8800,
              cartId: 4,
            },
          ];
          setPayments(mockPayments);
        } else {
          // ✅ [백엔드 연동용 코드]
          const token = await AsyncStorage.getItem("accessToken");
          const res = await api.get("/api/payments/history", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setPayments(res.data);
        }
      } catch (err) {
        console.error("❌ 결제내역 조회 실패:", err);
        setError("결제 내역을 불러올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchPayments();
  }, [userId]);

  // ✅ 개별 아이템 렌더링
  const renderItem = ({ item }: { item: Payment }) => {
    const dateObj = new Date(item.issuedAt);
    const dateStr = `${dateObj.getMonth() + 1}/${dateObj.getDate()}(${[
      "일",
      "월",
      "화",
      "수",
      "목",
      "금",
      "토",
    ][dateObj.getDay()]})`;

    return (
      <View
        style={styles.card}
        onTouchEnd={() =>
          router.push(`/receipt?receipt_id=${item.receiptId}`)
        }
      >
        <View>
          <Text style={styles.store}>결제수단: {item.paymentMethod}</Text>
          <Text style={styles.meta}>{dateStr} 결제 완료</Text>
        </View>
        <Text style={styles.amount}>₩{item.amount.toLocaleString()}</Text>
      </View>
    );
  };

  // ✅ 로딩 화면
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#333" />
      </View>
    );
  }

  // ✅ 오류 화면
  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text>{error}</Text>
      </View>
    );
  }

  // ✅ 본문 렌더링
  return (
    <View style={styles.container}>
      <SafeAreaView>
        <BackButton targetPath="/home" />
      </SafeAreaView>

      <Text style={styles.header}>💳 결제 내역</Text>
      <View style={styles.divider} />

      <FlatList
        data={payments}
        renderItem={renderItem}
        keyExtractor={(item) => item.receiptId.toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <Text style={{ textAlign: "center" }}>결제 내역이 없습니다.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 15 },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginHorizontal: 20,
    marginBottom: 20,
  },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: "#eeeeeeff",
  },
  store: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  meta: { fontSize: 14, color: "#666" },
  amount: { fontSize: 16, fontWeight: "bold" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
});