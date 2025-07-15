import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../../contexts/useAuth';

interface CartItem {
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
  total_price: number;
}

export default function CartScreen() {
  const { user } = useAuth();
  const userId = user?.id || 1; // 임시 user ID
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);

  const fetchCart = async () => {
    try {
      const res = await axios.get(`https://your-api.com/cart/active?user_id=${userId}`);
      setCartItems(res.data.items);
      setTotalAmount(res.data.total_amount);
    } catch (err) {
      console.error('장바구니 조회 실패', err);
    }
  };

  const updateQuantity = async (product_id: number, amount: number) => {
    try {
      await axios.post('https://your-api.com/cart/add_item', {
        user_id: userId,
        product_id,
        quantity: amount,
      });
      fetchCart();
    } catch {
      Alert.alert('수량 변경 실패');
    }
  };

  const deleteItem = async (product_id: number) => {
    try {
      await axios.delete('https://your-api.com/cart/delete_item', {
        data: { user_id: userId, product_id },
      });
      fetchCart();
    } catch {
      Alert.alert('삭제 실패');
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

      <Pressable onPress={() => deleteItem(item.product_id)}>
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

      <View style={styles.footer}>
        <Pressable style={styles.payButton} onPress={() => Alert.alert('결제 진행')}>
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
