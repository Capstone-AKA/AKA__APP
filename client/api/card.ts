import AsyncStorage from "@react-native-async-storage/async-storage";
import api, { BASE_URL } from "../api/api"; // api.ts에서 axios 인스턴스와 BASE_URL 불러오기

// 카드 타입 정의
export interface Card {
  card_id: number;
  card_name: string;
  last4: string;
}

// 토큰 가져오기
const getAuthHeader = async () => {
  const token = await AsyncStorage.getItem("accessToken");
  return {
    headers: { Authorization: `Bearer ${token}` },
  };
};

// 카드 목록 조회
export const getCards = async (userId: number): Promise<Card[]> => {
  // [연동 전 - Mock 데이터]
  return [
    { card_id: 1, card_name: "삼성카드", last4: "1234" },
    { card_id: 2, card_name: "비씨카드", last4: "5678" },
  ];

  // [연동 후 - 실제 API]
  // const config = await getAuthHeader();
  // const res = await api.get(`/card/list?user_id=${userId}`, config);
  // return res.data;
};

// 카드 추가
export const addCard = async (
  userId: number,
  cardName: string,
  cardNumber: string
): Promise<Card> => {
  // [연동 전 - Mock 데이터]
  return {
    card_id: Date.now(),
    card_name: cardName,
    last4: cardNumber.slice(-4),
  };

  // [연동 후 - 실제 API]
  // const config = await getAuthHeader();
  // const res = await api.post(
  //   `/card/add`,
  //   {
  //     user_id: userId,
  //     card_name: cardName,
  //     card_token: cardNumber, // TODO: 보안 처리 필요 시 수정
  //   },
  //   config
  // );
  // return res.data;
};

// 카드 삭제
export const deleteCard = async (userId: number, cardId: number) => {
  // [연동 전 - Mock 데이터]
  return { status: "success" };

  // [연동 후 - 실제 API]
  // const config = await getAuthHeader();
  // const res = await api.delete(`/card/delete`, {
  //   ...config,
  //   data: { user_id: userId, card_id: cardId },
  // });
  // return res.data;
};
