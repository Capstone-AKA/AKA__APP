package com.app.aka.controller;

import com.app.aka.dto.CartAssignRequestDto;
import com.app.aka.dto.CartEnterRequestDto;
import com.app.aka.dto.CartExitRequestDto;
import com.app.aka.service.CartService;
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

    @PostMapping("/enter")
    public ResponseEntity<String> enterByBle(@RequestBody CartEnterRequestDto request) {
        cartService.cartEnterByBle(request.getCartNumber(), request.getStoreId());
        return ResponseEntity.ok("BLE 입장이 완료되었습니다.");
    }

    // 카트 할당
    @PostMapping("/assign")
    public ResponseEntity<String> assignCartToUser(
            @AuthenticationPrincipal(expression = "id") Long userId,
            @RequestBody CartAssignRequestDto request
    ) {
        cartService.assignCartToUser(userId, request.getCartNumber());
        return ResponseEntity.ok("카트가 사용자에게 할당되었습니다.");
    }

    //퇴장
    @PostMapping("/exit")
    public ResponseEntity<String> exitCart(
            @AuthenticationPrincipal(expression = "id") Long userId,
            @RequestBody CartExitRequestDto request
    ) {
        cartService.exitCart(userId, request.getCartNumber());
        return ResponseEntity.ok("카트 퇴장이 완료되었습니다.");
    }
}