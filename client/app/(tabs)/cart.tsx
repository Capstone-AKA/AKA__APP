import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useAuth } from '../../contexts/useAuth';
import PaymentModal from '../../components/PaymentModal';

interface CartItem {
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
  total_price: number;
}

export default function CartScreen() {
  const { user } = useAuth();
  const userId = user?.id || 1;
  const cartId = 123;
  const router = useRouter();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'confirm' | 'complete'>('confirm');
  const [finalAmount, setFinalAmount] = useState<number>(0);
  const [finalItems, setFinalItems] = useState<CartItem[]>([]);

  const fetchCart = async () => {
    const mockData = {
      items: [
        { product_id: 101, product_name: '피망', price: 1500, quantity: 2, total_price: 3000 },
        { product_id: 102, product_name: '파프리카', price: 2000, quantity: 1, total_price: 2000 },
      ],
    };
    setCartItems(mockData.items);
    setTotalAmount(mockData.items.reduce((sum, item) => sum + item.price * item.quantity, 0));
  };

  const recalculateTotal = (items: CartItem[]) => {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setTotalAmount(total);
  };

  const updateQuantity = async (product_id: number, amount: number) => {
    setCartItems((prevItems) => {
      const updated = prevItems.map((item) =>
        item.product_id === product_id
          ? { ...item, quantity: item.quantity + amount }
          : item
      );
      recalculateTotal(updated);
      return updated;
    });
  };

  const deleteItem = async (product_id: number) => {
    setCartItems((prevItems) => {
      const filtered = prevItems.filter((item) => item.product_id !== product_id);
      recalculateTotal(filtered);
      return filtered;
    });
  };

  const handlePayment = async () => {
    if (__DEV__) {
      console.log(' [Mock 결제] 요청됨');
      setFinalItems(cartItems);
      setFinalAmount(totalAmount);
      setModalMode('complete');
      setModalVisible(true);
      setCartItems([]);
      setTotalAmount(0);
      return;
    }

    try {
      const res = await axios.post('http://localhost:8080/payment/checkout', {
        user_id: userId,
        cart_id: cartId,
        is_auto: false,
      });

      if (res.data.status === 'success') {
        setFinalItems(res.data.items);
        setFinalAmount(res.data.amount || 0);
        setModalMode('complete');
        setModalVisible(true);
        setCartItems([]);
        setTotalAmount(0);
      } else {
        Alert.alert('결제 실패', res.data.message || '알 수 없는 오류');
      }
    } catch (error) {
      console.error('결제 오류:', error);
      Alert.alert('결제 실패', '네트워크 오류 또는 서버 문제입니다.');
    }
  };

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.itemRow}>
      <Text style={styles.productName}>{item.product_name}</Text>
      <View style={styles.controls}>
        <Pressable
          onPress={() => item.quantity > 1 && updateQuantity(item.product_id, -1)}
          style={styles.controlBtn}
        >
          <Text>－</Text>
        </Pressable>
        <Text style={styles.quantity}>{item.quantity}</Text>
        <Pressable
          onPress={() => updateQuantity(item.product_id, 1)}
          style={styles.controlBtn}
        >
          <Text>＋</Text>
        </Pressable>
      </View>
      <Text style={styles.price}>₩{item.price.toLocaleString()}</Text>
      <Pressable onPress={() => deleteItem(item.product_id)} hitSlop={10}>
        <Text style={styles.delete}>✕</Text>
      </Pressable>
    </View>
  );

  useEffect(() => {
    fetchCart();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.container}>
        <Text style={styles.pageTitle}>My Cart</Text>
        <View style={styles.underline} />

        <FlatList
          data={cartItems}
          keyExtractor={(item) => item.product_id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 120 }}
        />

        <PaymentModal
          visible={modalVisible}
          mode={modalMode}
          onClose={() => {
            setModalVisible(false);
            if (modalMode === 'complete') {
              router.push('/home'); // 결제 완료 후 X 버튼 눌렀을 때 홈으로 이동
            }
          }}
          onConfirm={handlePayment}
          onViewReceipt={() => {
            setModalVisible(false);
            router.push({ pathname: '/receipt', params: { payment_id: 'test' } });
          }}
        />

        <View style={styles.footer}>
          <Pressable
            style={styles.payButton}
            onPress={() => {
              setModalMode('confirm');
              setModalVisible(true);
            }}
          >
            <Text style={styles.payText}>결제하기</Text>
            <Text style={styles.total}>총 {totalAmount.toLocaleString()}원</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 16,
    backgroundColor: '#fff',
  },
  pageTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingTop: 30,
    marginBottom: 20,
  },
  underline: {
    height: 1,
    backgroundColor: '#ccc',
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  productName: {
    flex: 1,
    fontSize: 16,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  controlBtn: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  quantity: {
    fontSize: 16,
    marginHorizontal: 4,
  },
  price: {
    width: 80,
    textAlign: 'right',
    fontSize: 14,
  },
  delete: {
    marginLeft: 10,
    fontSize: 18,
    color: '#888',
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
  },
  payButton: {
    backgroundColor: '#22C55E',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  payText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  total: {
    color: '#fff',
    marginTop: 4,
  },
});
