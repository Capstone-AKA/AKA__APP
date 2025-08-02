import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/useAuth';

// ✅ 커스텀 체크박스 컴포넌트 (Expo Go에서 작동 가능)
function CheckBox({ value, onValueChange }: { value: boolean; onValueChange: (val: boolean) => void }) {
  return (
    <TouchableOpacity
      onPress={() => onValueChange(!value)}
      style={{
        width: 20,
        height: 20,
        borderWidth: 1,
        borderColor: '#000',
        marginRight: 8,
        backgroundColor: value ? '#2ecc71' : '#fff',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {value && <Text style={{ color: '#fff', fontWeight: 'bold' }}>✔</Text>}
    </TouchableOpacity>
  );
}

export default function AuthScreen() {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const router = useRouter();

  const { login: setUser } = useAuth();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [autoLogin, setAutoLogin] = useState(false);
  const [error, setError] = useState('');

  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [agree, setAgree] = useState(false);

  const handleLogin = async () => {
    try {
      const dummyUser = {
        id: 1,
        email: loginEmail || 'test@example.com',
        nickname: '테스트유저',
      };
      setUser(dummyUser);
      router.replace('/home');
    } catch (error: any) {
      Alert.alert('로그인 실패', '테스트용 로그인에서 오류 발생');
    }
  };

  const handleSignup = async () => {
    if (signupPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!agree) {
      setError('이용약관에 동의해주세요.');
      return;
    }

    try {
      const dummyUser = {
        id: 1,
        email: signupEmail || 'test@example.com',
        nickname: nickname || '테스트유저',
      };
      setUser(dummyUser);
      router.replace('/home');
    } catch (e) {
      Alert.alert('회원가입 실패', '테스트용 가입에서 오류 발생');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, tab === 'login' && styles.activeTab]}
          onPress={() => setTab('login')}
        >
          <Text style={[styles.tabText, tab === 'login' && styles.activeTabText]}>로그인</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'signup' && styles.activeTab]}
          onPress={() => setTab('signup')}
        >
          <Text style={[styles.tabText, tab === 'signup' && styles.activeTabText]}>회원가입</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>{tab === 'login' ? '로그인' : '회원가입'}</Text>

      {tab === 'login' ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="이메일 주소를 입력하세요"
            value={loginEmail}
            onChangeText={setLoginEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="비밀번호를 입력하세요"
            value={loginPassword}
            onChangeText={setLoginPassword}
            secureTextEntry
          />
          <View style={styles.loginOptions}>
            <View style={styles.checkboxRow}>
              <CheckBox value={autoLogin} onValueChange={setAutoLogin} />
              <Text>자동 로그인</Text>
            </View>
            <Text style={styles.link}>비밀번호 찾기</Text>
          </View>
        </>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="이메일 주소를 입력하세요"
            value={signupEmail}
            onChangeText={setSignupEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="닉네임을 입력하세요"
            value={nickname}
            onChangeText={setNickname}
          />
          <TextInput
            style={styles.input}
            placeholder="비밀번호를 입력하세요"
            value={signupPassword}
            onChangeText={setSignupPassword}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="비밀번호를 다시 입력하세요"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          <View style={styles.checkboxRow}>
            <CheckBox value={agree} onValueChange={setAgree} />
            <Text>이용약관 및 개인정보처리방침에 동의합니다</Text>
          </View>
        </>
      )}

      {error !== '' && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={styles.submitButton}
        onPress={tab === 'login' ? handleLogin : handleSignup}
      >
        <Text style={styles.submitButtonText}>
          {tab === 'login' ? '로그인' : '회원가입'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 80,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2ecc71',
  },
  tabText: {
    fontSize: 16,
    color: '#888',
  },
  activeTabText: {
    color: '#2ecc71',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 15,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  link: {
    color: '#888',
    textDecorationLine: 'underline',
  },
  error: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#2ecc71',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
