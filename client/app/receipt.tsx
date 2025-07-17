import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function ReceiptScreen() {
  const { amount, items } = useLocalSearchParams<{
    amount: string;
    items: string; // stringified JSON
  }>();

  const parsedItems =
    typeof items === 'string' ? JSON.parse(items) : [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧾 영수증</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  itemText: { fontSize: 16, marginVertical: 4 },
  total: { marginTop: 20, fontSize: 18, fontWeight: 'bold' },
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
