import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  ScrollView,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';

const { width } = Dimensions.get('window');

export default function ReceiptScreen() {
  const { payment_id } = useLocalSearchParams<{ payment_id: string }>();
  const router = useRouter();

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
      // ❌ 백엔드 연동 시 사용
      /*
      try {
        const res = await axios.get(`http://localhost:8080/receipt?payment_id=${payment_id}`);
        setReceipt(res.data);
      } catch (err) {
        console.error('영수증 조회 실패', err);
      }
      */

      // ✅ 프론트 개발용 mock 데이터
      setReceipt({
        receipt_id: 99,
        issued_at: '2025-05-12T12:01:00Z',
        receipt_data: {
          store: '이마트 서울역점',
          items: [
            { name: '초코우유', quantity: 2, unit_price: 1500, total: 3000 },
            { name: '바나나', quantity: 1, unit_price: 2000, total: 2000 },
          ],
          total_amount: 5000,
          payment_method: '카카오페이',
        },
      });
    };

    fetchReceipt();
  }, [payment_id]);

  if (!receipt) {
    return <Text style={styles.loading}>영수증을 불러오는 중...</Text>;
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.push('/history')}>
            <Text style={styles.backButton}>{'<'}</Text>
          </TouchableOpacity>
          {/* <Text style={styles.headerTitle}>영수증</Text> */}
        </View>
        {/* <View style={styles.divider} /> */}
      </SafeAreaView>

      <View style={styles.body}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.imageContainer}>
              <Image
                source={require('../assets/Receipt Card.png')} 
                style={styles.cardImage}
                resizeMode="contain"
              />
          </View>
          <Text style={styles.store}>{receipt.receipt_data.store}</Text>
          <Text style={styles.meta}>영수증 ID: {receipt.receipt_id}</Text>
          <Text style={styles.meta}>발행일시: {new Date(receipt.issued_at).toLocaleString()}</Text>
          <Text style={styles.meta}>결제수단: {receipt.receipt_data.payment_method}</Text>

          <View style={styles.dividerLine} />

          {receipt.receipt_data.items.map((item, index) => (
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
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loading: {
    flex: 1,
    textAlign: 'center',
    marginTop: 100,
    fontSize: 16,
  },
  headerContainer: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: '#fff',
  },
  headerContent: {
    flexDirection: 'column',
    paddingHorizontal: 20,
    paddingBottom: 12,
    marginTop: 8,
  },
  backButton: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 0,
  },
  // headerTitle: {
  //   fontSize: 20,
  //   fontWeight: 'bold',
  //   color: '#111',
  // },
  // divider: {
  //   height: 1,
  //   backgroundColor: '#ddd',
  //   marginHorizontal: 20,
  //   marginBottom: 10,
  // },
  dividerLine: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 16,
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingBottom: 80,
    paddingHorizontal: 30,
  },
  store: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#222',
  },
  meta: {
    fontSize: 14,
    color: '#444',
    marginBottom: 4,
  },
  itemText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#222',
  },
  total: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
  },
  imageContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  cardImage: {
    width: width - 60,
    height: 180,
  },
});
