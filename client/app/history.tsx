import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useAuth } from '../contexts/useAuth';

interface Payment {
  payment_id: number;
  total_amount: number;
  status: string;
  paid_at: string;
}

export default function HistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id || 1;

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8080/payment/history?user_id=${userId}`
        );
        setPayments(res.data);
      } catch (err) {
        console.error('결제내역 조회 실패:', err);

        // ✅ 테스트용 mock 데이터
        setPayments([
          {
            payment_id: 777,
            total_amount: 8200,
            status: 'completed',
            paid_at: '2025-05-12T12:00:00Z',
          },
          {
            payment_id: 778,
            total_amount: 4700,
            status: 'completed',
            paid_at: '2025-05-10T15:42:00Z',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const renderItem = ({ item }: { item: Payment }) => {
    const dateObj = new Date(item.paid_at);
    const dateStr = `${dateObj.getMonth() + 1}/${dateObj.getDate()}(${['일','월','화','수','목','금','토'][dateObj.getDay()]})`;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/receipt?payment_id=${item.payment_id}`)}
      >
        <View>
          <Text style={styles.store}>이마트 매장</Text>
          <Text style={styles.meta}>{dateStr} 결제완료</Text>
        </View>
        <Text style={styles.amount}>₩{item.total_amount.toLocaleString()}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#333" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 🔙 Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.push('/home')}>
        <Text style={styles.backText}>{'<'}</Text>
      </TouchableOpacity>

      {/* 📄 Header */}
      <Text style={styles.header}>영수증 히스토리</Text>

      {/* ━ Divider */}
      <View style={styles.divider} />

      <FlatList
        data={payments}
        renderItem={renderItem}
        keyExtractor={(item) => item.payment_id.toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    backgroundColor: '#fff',
  },
  backButton: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  store: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  meta: {
    fontSize: 14,
    color: '#666',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
