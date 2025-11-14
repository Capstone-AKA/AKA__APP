import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/useAuth';
import { useStore } from '../../contexts/useStore';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const { storeId } = useStore();

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>ACA</Text>

      <View style={styles.welcomeBox}>
        <Text style={styles.welcomeText}>
          {user ? `${user.nickname} 님` : '방문자 님'}
        </Text>
        <Text style={styles.welcomeBold}>환영합니다!</Text>
        {storeId && <Text style={styles.storeText}>현재 매장: {storeId}</Text>}
      </View>

      {/* 메뉴 버튼들 */}
      <View style={styles.menuContainer}>
        <Pressable style={styles.bleButton} onPress={() => router.push('/storeBLE')}>
          <Text style={styles.bleText}>카트 등록하고 매장 입장하기</Text>
        </Pressable>

        <Pressable style={styles.menuButton} onPress={() => router.push('/mypage')}>
          <Text style={styles.menuText}>마이페이지</Text>
        </Pressable>

        <Pressable style={styles.menuButton} onPress={() => router.push('/history')}>
          <Text style={styles.menuText}>영수증 히스토리</Text>
        </Pressable>

        <Pressable style={styles.menuButton} onPress={() => router.push('/payment')}>
          <Text style={styles.menuText}>결제수단 관리</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 25,
    paddingTop: 60,
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  welcomeBox: {
    backgroundColor: '#F5F6FC',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  welcomeBold: {
    fontSize: 20,
    fontWeight: '700',
  },
    storeText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#22C55E', 
  },
  menuContainer: {
    marginTop: 32,
    gap: 16,
  },
  menuButton: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
  },
  bleButton: {
    backgroundColor: '#ffffff',
    borderColor: '#ff0000ff',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  bleText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
