import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

// 상품 데이터 타입
interface CartItem {
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
  total_price: number;
  image?: string;
}

interface UseCartSocketProps {
  accessToken: string | null;
  cartNumber: number | null;
  bleConnected: boolean;
}

export default function useCartSocket({
  accessToken,
  cartNumber,
  bleConnected,
}: UseCartSocketProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const stompClientRef = useRef<Client | null>(null);

  // 환경 변수 사용 (api.ts와 동일한 방식)
  const USE_MOCK_MODE = process.env.EXPO_PUBLIC_USE_MOCK === "true";
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL!;

  // WebSocket 연결
  const connectSocket = () => {
    if (!accessToken || !cartNumber || !bleConnected) {
      console.log("WebSocket 연결 생략 - 조건 미충족 (token/cart/BLE)");
      return;
    }

    if (stompClientRef.current && stompClientRef.current.connected) {
      console.log("이미 WebSocket이 연결되어 있습니다.");
      return;
    }

    console.log(`WebSocket 연결 시도 (cartNumber=${cartNumber})`);

    // mock 모드에서는 실제 연결 안 함
    if (USE_MOCK_MODE) {
      console.log("Mock 모드 - WebSocket 연결 생략");
      setCartItems([
        {
          product_id: 1,
          product_name: "테스트 상품 A",
          price: 5000,
          quantity: 1,
          total_price: 5000,
          image: "https://cdn-icons-png.flaticon.com/512/415/415733.png",
        },
      ]);
      return;
    }

    // 실제 서버 WebSocket 연결
    const socket = new SockJS(`${API_BASE_URL}/ws`);

    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
      reconnectDelay: 5000,
      debug: (msg) => console.log("[STOMP]", msg),
      onConnect: () => {
        console.log("WebSocket 연결 성공");
        const topic = `/topic/cart/${cartNumber}`;
        console.log(`구독 시작: ${topic}`);

        client.subscribe(topic, (message) => {
          try {
            const data = JSON.parse(message.body);
            console.log("서버에서 수신:", data);

            if (data.product_list) {
              setCartItems(
                data.product_list.map((p: any, idx: number) => ({
                  product_id: idx + 1,
                  product_name: p.product_name || p.name || p,
                  price: p.price || 5000,
                  quantity: p.quantity || 1,
                  total_price: (p.price || 5000) * (p.quantity || 1),
                  image:
                    p.image ||
                    "https://cdn-icons-png.flaticon.com/512/415/415733.png",
                }))
              );
            } else if (data.items) {
              setCartItems(data.items);
            }
          } catch (err) {
            console.error("WebSocket 데이터 파싱 실패:", err);
          }
        });
      },
      onStompError: (frame) => {
        console.error("STOMP 오류:", frame);
      },
      onWebSocketClose: () => {
        console.log("WebSocket 연결 종료됨");
      },
    });

    client.activate();
    stompClientRef.current = client;
  };

  // 연결 해제
  const disconnectSocket = () => {
    if (stompClientRef.current) {
      console.log("WebSocket 수동 종료");
      stompClientRef.current.deactivate();
      stompClientRef.current = null;
    }
  };

  // BLE 상태 변화에 따라 연결/해제
  useEffect(() => {
    if (accessToken && cartNumber && bleConnected) {
      connectSocket();
    } else {
      disconnectSocket();
    }
    return () => disconnectSocket();
  }, [accessToken, cartNumber, bleConnected]);

  return {
    cartItems,
    connectSocket,
    disconnectSocket,
  };
}
