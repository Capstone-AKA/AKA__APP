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
import api, { BASE_URL } from "../api/api"; // api.ts에서 BASE_URL 불러오기
import { EXPO_PUBLIC_USE_MOCK } from "@env"; // mock 모드 스위치

// 타입 정의
interface Payment {
  payment_id: number;
  total_amount: number;
  status: string;
  paid_at: string;
  store_name?: string;
}

export default function HistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const USE_MOCK_MODE = EXPO_PUBLIC_USE_MOCK === "true";

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      setError("");
      try {
        if (USE_MOCK_MODE) {
          // [Mock용 더미 데이터]
          const mockPayments: Payment[] = [
            {
              payment_id: 1001,
              total_amount: 12000,
              status: "completed",
              paid_at: new Date().toISOString(),
              store_name: "이마트 연산점",
            },
            {
              payment_id: 1002,
              total_amount: 8900,
              status: "completed",
              paid_at: new Date().toISOString(),
              store_name: "이마트 구서점",
            },
          ];
          setPayments(mockPayments);
        } else {
          // [백엔드 연동용 코드]
          const res = await api.get(`/payment/history`, {
            params: { user_id: userId },
          });
          setPayments(res.data);
        }
      } catch (err) {
        console.error("결제내역 조회 실패:", err);
        setError("결제 내역을 불러올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchPayments();
  }, [userId]);

  const renderItem = ({ item }: { item: Payment }) => {
    const dateObj = new Date(item.paid_at);
    const dateStr = `${dateObj.getMonth() + 1}/${dateObj.getDate()}(${
      ["일", "월", "화", "수", "목", "금", "토"][dateObj.getDay()]
    })`;

    return (
      <View
        style={styles.card}
        onTouchEnd={() =>
          router.push(`/receipt?payment_id=${item.payment_id}`)
        }
      >
        <View>
          <Text style={styles.store}>{item.store_name ?? "매장"}</Text>
          <Text style={styles.meta}>
            {dateStr} {item.status === "completed" ? "결제완료" : item.status}
          </Text>
        </View>
        <Text style={styles.amount}>
          ₩{item.total_amount.toLocaleString()}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#333" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView>
        <BackButton targetPath="/home" />
      </SafeAreaView>

      <Text style={styles.header}>영수증 히스토리</Text>
      <View style={styles.divider} />

      <FlatList
        data={payments}
        renderItem={renderItem}
        keyExtractor={(item) => item.payment_id.toString()}
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
  header: { fontSize: 24, fontWeight: "bold", paddingHorizontal: 20, marginBottom: 30 },
  divider: { height: 1, backgroundColor: "#ddd", marginHorizontal: 20, marginBottom: 20 },
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
