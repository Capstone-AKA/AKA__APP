import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "@env"; // .env 파일에서 BASE_URL 가져오기

// axios 인스턴스 생성
const api = axios.create({
  baseURL: BASE_URL, // 환경 변수로부터 baseURL 설정
  headers: {
    "Content-Type": "application/json",
  },
});

// 요청마다 accessToken 자동 추가
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

    // 🧩 디버깅용 콘솔 로그
  console.log("📡 요청 URL:", (config.baseURL ?? "") + (config.url ?? ""));
  console.log("📦 요청 Body:", config.data);
  console.log("🧾 요청 Headers:", config.headers);

  return config;
});

export default api;
