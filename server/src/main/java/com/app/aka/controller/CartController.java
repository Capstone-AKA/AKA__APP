package com.app.aka.controller;

import com.app.aka.dto.CartAssignRequestDto;
import com.app.aka.dto.CartEnterRequestDto;
import com.app.aka.security.oauth2.TokenProvider;
import com.app.aka.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;


@RestController
@RequiredArgsConstructor
@RequestMapping("/api/cart")
public class CartController {
    private final CartService cartService;

    @PostMapping("/enter")
    public ResponseEntity<String> enterByBle(@RequestBody CartEnterRequestDto request) {
        cartService.cartEnterByBle(request.getCartCode(), request.getStoreId());
        return ResponseEntity.ok("BLE 입장이 완료되었습니다.");
    }

    // 인증 필요: 앱에서 QR코드로 카트 매칭
    @PostMapping("/assign")
    public ResponseEntity<String> assignCartToUser(
            @AuthenticationPrincipal(expression = "id") Long userId,
            @RequestBody CartAssignRequestDto request
    ) {
        cartService.assignCartToUser(userId, request.getCartCode());
        return ResponseEntity.ok("카트가 사용자에게 할당되었습니다.");
    }

    @PostMapping("/exit")
    public ResponseEntity<String> exitCart(
            @AuthenticationPrincipal(expression = "id") Long userId, // 현재 로그인된 사용자 ID
            @RequestBody Map<String, String> requestBody // 퇴장할 카트 정보를 받기 위함
    ) {
        String cartCode = requestBody.get("cartCode"); // 요청 본문에서 cartCode를 받음

        if (cartCode == null || cartCode.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("cartCode는 필수입니다.");
        }

        // 사용자가 할당했던 카트가 맞는지, 그리고 카트를 퇴장 처리
        cartService.exitCart(userId, cartCode);
        return ResponseEntity.ok("카트 퇴장이 완료되었습니다.");
    }
}