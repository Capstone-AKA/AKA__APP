package com.app.aka.controller;

import com.app.aka.dto.CartAssignRequestDto;
import com.app.aka.dto.CartEnterRequestDto;
import com.app.aka.security.oauth2.TokenProvider;
import com.app.aka.service.CartService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequiredArgsConstructor
@RequestMapping("/api/cart")
public class CartController {
    private final CartService cartService;
    private final TokenProvider tokenProvider;

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
}