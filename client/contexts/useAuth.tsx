import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api/api";

// .env 설정값 사용
const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === "true";

interface User {
  id: number;
  nickname: string;
  email: string;
  accessToken?: string;
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (tokens: Tokens) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // 앱 시작 시 자동 로그인
  useEffect(() => {
    const loadUser = async () => {
      const savedTokens = await AsyncStorage.getItem("tokens");
      if (!savedTokens) return;

      const { accessToken, refreshToken } = JSON.parse(savedTokens);

      if (USE_MOCK) {
        console.log("MOCK: 자동 로그인 성공");
        setUser({ id: 1, nickname: "hyoww", email: "test@test.com" });
        return;
      }

      try {
        const userRes = await api.get("/api/user/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setUser(userRes.data);
      } catch (err) {
        console.log("액세스 토큰 만료, refresh 시도...");
        try {
          const refreshRes = await api.post(
            "/api/auth/refresh-token",
            {},
            { headers: { "X-Refresh-Token": refreshToken } }
          );

          const newTokens = refreshRes.data;
          await AsyncStorage.setItem("tokens", JSON.stringify(newTokens));

          const userRes = await api.get("/api/user/me", {
            headers: { Authorization: `Bearer ${newTokens.accessToken}` },
          });
          setUser(userRes.data);
        } catch (e) {
          console.log("자동 로그인 실패:", e);
          await AsyncStorage.removeItem("tokens");
        }
      }
    };

    loadUser();
  }, []);

  // 로그인
  const login = async (tokens: Tokens) => {
    await AsyncStorage.setItem("tokens", JSON.stringify(tokens));

    if (USE_MOCK) {
      setUser({
        id: 1,
        nickname: "테스트유저",
        email: "test@test.com",
        accessToken: tokens.accessToken,
      });
      return;
    }

    const userRes = await api.get("/api/user/me", {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    });
    setUser({ ...userRes.data, accessToken: tokens.accessToken });
  };

  // 로그아웃
  const logout = async () => {
    try {
      const savedTokens = await AsyncStorage.getItem("tokens");
      if (!USE_MOCK && savedTokens) {
        const { accessToken } = JSON.parse(savedTokens);
        await api.post(
          "/api/auth/logout",
          {},
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
      }
    } catch (e) {
      console.warn("백엔드 로그아웃 실패:", e);
    }

    await AsyncStorage.removeItem("tokens");
    setUser(null);
  };

  // 유저 정보 일부 업데이트 (닉네임 변경 등)
  const updateUser = (updatedUser: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updatedUser } : prev));
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
