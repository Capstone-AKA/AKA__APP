package com.app.aka.websocket;

import com.app.aka.security.oauth2.TokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class CustomWebSocketHandler extends TextWebSocketHandler {

    private final TokenProvider tokenProvider;

    // userId → 세션 매핑
    private final Map<Long, WebSocketSession> sessionMap = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        // 예: ws://localhost:8080/ws?token=xxxxx
        String query = session.getUri().getQuery();
        if (query == null || !query.startsWith("token=")) {
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        String token = query.substring("token=".length());

        // JWT 파싱해서 userId 추출
        if (!tokenProvider.validateAccessToken(token)) {
            session.close(CloseStatus.NOT_ACCEPTABLE.withReason("Invalid Token"));
            return;
        }

        Long userId = tokenProvider.getUserIdFromAccessToken(token);

        sessionMap.put(userId, session);
        System.out.println("WebSocket 연결됨: userId=" + userId);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        System.out.println("클라이언트 메시지: " + message.getPayload());
        // 필요시: Echo, 핑퐁, 클라이언트 명령 처리
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        sessionMap.values().remove(session);
        System.out.println("WebSocket 연결 종료됨");
    }

    // 특정 유저에게 Push
    public void sendToUser(Long userId, String payload) {
        WebSocketSession session = sessionMap.get(userId);
        if (session != null && session.isOpen()) {
            try {
                session.sendMessage(new TextMessage(payload));
            } catch (Exception e) {
                e.printStackTrace();
            }
        } else {
            System.out.println("userId=" + userId + " 에게 보낼 세션이 없음");
        }
    }
}
