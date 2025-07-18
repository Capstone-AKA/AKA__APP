import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function ReceiptScreen() {
  const { amount, items } = useLocalSearchParams<{
    amount: string;
    items: string;
  }>();
  const router = useRouter();

  const parsedItems =
    typeof items === 'string' ? JSON.parse(items) : [];

  return (
    <View style={styles.screen}>
      {/* ⬆ 상단 헤더 */}
      <SafeAreaView style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.push('/history')}>
            <Text style={styles.backButton}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>영수증</Text>
        </View>
        <View style={styles.divider} />
      </SafeAreaView>

      {/* ⬇ 본문 내용 */}
      <View style={styles.body}>
        <Image
          source={require('../assets/Receipt.png')} // 경로 확인
          style={styles.receiptImage}
          resizeMode="contain"
        />

        <View style={styles.overlay}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {parsedItems.map(
              (
                item: { product_name: string; price: number; quantity: number },
                index: number
              ) => (
                <Text key={index} style={styles.itemText}>
                  {item.product_name} x {item.quantity} = ₩
                  {(item.price * item.quantity).toLocaleString()}
                </Text>
              )
            )}
            <Text style={styles.total}>
              총합: ₩{Number(amount).toLocaleString()}
            </Text>
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },

  /** ─── Header ─── **/
  headerContainer: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: '#fff',
  },
  headerContent: {
    flexDirection: 'column',
    // alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    marginTop: 8,
  },
  backButton: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 50,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#111',
  },  
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginHorizontal: 20,
    marginBottom: 10,
  },

  /** ─── Body ─── **/
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  receiptImage: {
    marginTop: 0,
    width: width * 0.85,
    height: width * 1.25,
  },
  overlay: {
    position: 'absolute',
    top: '43%', 
    width: '70%',
    paddingHorizontal: 10,
  },
  scrollContent: {
    alignItems: 'flex-start',
  },
  itemText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#222',
  },
  total: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
  },
});



/*
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import axios from 'axios';

export default function ReceiptScreen() {
  const { payment_id } = useLocalSearchParams<{ payment_id: string }>();
  const [receipt, setReceipt] = useState<null | {
    receipt_id: number;
    issued_at: string;
    receipt_data: {
      store: string;
      items: {
        name: string;
        quantity: number;
        unit_price: number;
        total: number;
      }[];
      total_amount: number;
      payment_method: string;
    };
  }>(null);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8080/receipt?payment_id=${payment_id}`
        );
        setReceipt(res.data);
      } catch (err) {
        console.error('영수증 조회 실패', err);
      }
    };

    fetchReceipt();
  }, [payment_id]);

  if (!receipt) {
    return <Text>영수증을 불러오는 중...</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧾 {receipt.receipt_data.store}</Text>
      {receipt.receipt_data.items.map((item, index) => (
        <Text key={index} style={styles.itemText}>
          {item.name} x {item.quantity} = ₩
          {(item.total).toLocaleString()}
        </Text>
      ))}
      <Text style={styles.total}>
        총합: ₩{receipt.receipt_data.total_amount.toLocaleString()}
      </Text>
      <Text style={styles.payment}>결제수단: {receipt.receipt_data.payment_method}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  itemText: { fontSize: 16, marginVertical: 4 },
  total: { marginTop: 20, fontSize: 18, fontWeight: 'bold' },
  payment: { marginTop: 10, fontSize: 14, color: '#555' },
});
*/
