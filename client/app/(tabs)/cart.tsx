import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios'; // 실제 연동용 (현재는 사용 안 함)
import { useAuth } from '../../contexts/useAuth';
import PaymentModal from '../../components/PaymentModal'; // ✅ [추가] 결제 모달 컴포넌트 임포트

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
  const cartId = 123; // 테스트용 cartId. 실제 BLE 입장 시 받아와야 함
  const router = useRouter();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [modalVisible, setModalVisible] = useState(false); //모달 상태 관리
  const [modalMode, setModalMode] = useState<'confirm' | 'complete'>('confirm'); //모달 모드 상태
  //  장바구니 초기화 전에 영수증에 넘길 데이터를 보관하기 위한 상태
  const [finalAmount, setFinalAmount] = useState<number>(0);
  const [finalItems, setFinalItems] = useState<CartItem[]>([]);


  const fetchCart = async () => {
    // 테스트용 mock 데이터
    const mockData = {
      items: [
        {
          product_id: 101,
          product_name: '피망',
          price: 1500,
          quantity: 2,
          total_price: 3000,
        },
        {
          product_id: 102,
          product_name: '파프리카',
          price: 2000,
          quantity: 1,
          total_price: 2000,
        },
      ],
    };
    setCartItems(mockData.items);
    setTotalAmount(
      mockData.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    );

    // 실제 연동용: 장바구니 조회
    /*
    try {
      const res = await axios.get(`http://localhost:8080/cart/active?user_id=${userId}`);
      setCartItems(res.data.items);
    } catch (err) {
      console.error('장바구니 조회 실패', err);
    }

    await fetchTotalAmount(); // 총합도 같이 갱신
    */
  };

  // 테스트용 총합 갱신
  const recalculateTotal = (items: CartItem[]) => {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setTotalAmount(total);
  };

  // 실제 연동용: 총합 금액 서버에서 받아오기
  /*
  const fetchTotalAmount = async () => {
    try {
      const res = await axios.post(`http://localhost:8080/cart/update_total`, {
        cart_id: cartId,
      });
      if (res.data?.total_amount) {
        setTotalAmount(res.data.total_amount);
      }
    } catch (err) {
      console.error('총 금액 조회 실패', err);
    }
  };
  */

  // 테스트용 수량 변경
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

    // 실제 연동용 수량 변경
    /*
    try {
      await axios.patch(`http://localhost:8080/cart/update_quantity`, {
        item_id: product_id,
        quantity: newQuantity,
      });
      await fetchCart();
    } catch (err) {
      console.error('수량 변경 실패', err);
    }
    */
  };

  // 테스트용 삭제
  const deleteItem = async (product_id: number) => {
    setCartItems((prevItems) => {
      const filtered = prevItems.filter((item) => item.product_id !== product_id);
      recalculateTotal(filtered);
      return filtered;
    });

    // 실제 연동용 삭제
    /*
    try {
      await axios.delete(`http://localhost:8080/cart/item/${product_id}`);
      await fetchCart();
    } catch (err) {
      console.error('삭제 실패', err);
    }
    */
  };

// 결제 요청 함수
const handlePayment = async () => {
  // 모의 결제 처리 
  if (__DEV__) { // 연동할때 알아서 이부분은 반영안하고 아래만 반영한다함 건들필요없다함
    console.log(' [Mock 결제] 요청됨');

    // 영수증에 넘길 데이터 복사
    setFinalItems(cartItems);
    setFinalAmount(totalAmount);

    setModalMode('complete');   // 완료 모드로 변경
    setModalVisible(true);      // 모달 재표시

    // 장바구니 초기화
    setCartItems([]);
    setTotalAmount(0);
    return;
  }

  // 실제 결제 연동
  try {
    const res = await axios.post('http://localhost:8080/payment/checkout', {
      user_id: userId,
      cart_id: cartId,
      is_auto: false,
    });

    if (res.data.status === 'success') {
      console.log('결제 완료:', res.data);

      // 영수증에 넘길 데이터 저장
      setFinalItems(res.data.items);
      setFinalAmount(res.data.amount || 0);

      // 완료모달 띄우기
      setModalMode('complete');
      setModalVisible(true);

      // 장바구니 비우기
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
          onPress={() => {
            if (item.quantity > 1) {
              updateQuantity(item.product_id, -1);
            }
          }}
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
    <View style={styles.container}>
      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.product_id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 120 }}
      />

      {/* 결제 모달 */}
      <PaymentModal
        visible={modalVisible}
        mode={modalMode}
        onClose={() => setModalVisible(false)}
        onConfirm={handlePayment}
        onViewReceipt={() => {
          setModalVisible(false);

          // 복사해둔 데이터로 push
          router.push({
            pathname: '/receipt',
            params: {
              amount: finalAmount,
              items: JSON.stringify(finalItems),
            },
          });
        }}
      />

      <View style={styles.footer}>
        <Pressable style={styles.payButton} onPress={() => {
          setModalMode('confirm'); // 모달 모드 설정
          setModalVisible(true);
        }}>
          <Text style={styles.payText}>결제하기</Text>
          <Text style={styles.total}>총 {totalAmount.toLocaleString()}원</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
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
