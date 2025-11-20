import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import api from '../api/api';

// ✅ 로그인 (access/refresh 토큰 저장 + 사용자 정보 반환)
export const login = async ({ email, password }: { email: string; password: string }) => {
  try {
    const res = await api.post('/api/auth/login', { email, password });
    const data = res.data;

    // ✅ AsyncStorage 사용
    await AsyncStorage.setItem('accessToken', data.accessToken);
    await AsyncStorage.setItem('refreshToken', data.refreshToken);

    await AsyncStorage.setItem(
      "tokens",
      JSON.stringify({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      })
    );

    const userInfo = await getMyInfo();
    return userInfo;
  } catch (error: any) {
    const message = error?.response?.data?.message || '로그인 실패';
    throw new Error(message);
  }
};

// ✅ 회원가입
export const signup = async ({
  email,
  password,
  name,
  userId,
}: {
  email: string;
  password: string;
  name: string;
  userId: string;
}) => {
  try {
    const res = await api.post('/api/auth/signup', {
      email,
      password,
      name,
      userId,
    });

    const data = res.data;

    if (!data?.accessToken || !data?.refreshToken) {
      throw new Error('회원가입 후 로그인 정보를 받지 못했습니다.');
    }

    console.log("🧾 회원가입 응답:", data);

    await AsyncStorage.setItem('accessToken', data.accessToken);
    await AsyncStorage.setItem('refreshToken', data.refreshToken);

    // 자동로그인 tokens 저장도 같이 추가
    await AsyncStorage.setItem(
      "tokens",
      JSON.stringify({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      })
    );

    // 약간의 딜레이 (비동기 안정화)
    await new Promise((res) => setTimeout(res, 50));

    const userInfo = await getMyInfo();
    return userInfo;
  } catch (error: any) {
    console.error('회원가입 중 오류:', error);
    const message = error?.response?.data?.message || error.message || '회원가입 실패';
    throw new Error(message);
  }
};

// ✅ 로그아웃
export const logout = async () => {
  try {
    await api.post('/api/auth/logout');
  } catch (e) {
    console.warn('서버 로그아웃 실패:', e);
  } finally {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('tokens'); 
  }
};

// ✅ access token 재발급
export const refreshAccessToken = async () => {
  const refreshToken = await AsyncStorage.getItem('refreshToken');

  const res = await axios.post(`/api/auth/refresh-token`, null, {
    headers: { 'X-Refresh-Token': refreshToken || '' },
  });

  const data = res.data;
  await AsyncStorage.setItem('accessToken', data.accessToken);
  const current = JSON.parse(await AsyncStorage.getItem("tokens") || "{}");
  await AsyncStorage.setItem(
    "tokens",
    JSON.stringify({
      accessToken: data.accessToken,
      refreshToken: current.refreshToken,
    })
  );

  return data;
};

// ✅ 내 정보 조회
export const getMyInfo = async () => {
  const token = await AsyncStorage.getItem('accessToken');
  const res = await api.get('/api/user/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// ✅ 닉네임 변경
export const updateNickname = async (newNickname: string) => {
  const res = await api.patch('/api/user/nickname', { newNickname });
  return res.data;
};

// ✅ 비밀번호 변경
export const updatePassword = async (newPassword: string) => {
  const res = await api.patch('/api/user/password', { newPassword });
  return res.data;
};