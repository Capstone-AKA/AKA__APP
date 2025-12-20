package com.app.aka.controller;

import com.app.aka.dto.CartAssignRequestDto;
import com.app.aka.dto.CartEnterRequestDto;
import com.app.aka.dto.CartExitRequestDto;
import com.app.aka.service.CartService;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
        cartService.cartEnterByBle(request.getUserId(), request.getStoreId());
        return ResponseEntity.ok("BLE 입장이 완료되었습니다.");
    }

    // 카트 할당 + 자동 입장(storeId=1)
    @PostMapping("/assign")
    public ResponseEntity<Map<String, Object>> assignCartToUser(
            @AuthenticationPrincipal(expression = "id") Long userId,
            @RequestBody CartAssignRequestDto request
    ) {
        Map<String, Object> response = new HashMap<>();
        try {
            cartService.assignCartToUser(userId, request.getCartNumber());

            // assign과 동시에 storeId=1 입장 처리
            cartService.cartEnterByBle(userId, 1L);

            response.put("success", true);
            response.put("message", "카트가 사용자에게 할당되고 입장이 완료되었습니다.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }

    //퇴장
    @PostMapping("/exit")
    public ResponseEntity<String> exitCart(
            @AuthenticationPrincipal(expression = "id") Long userId,
            @RequestBody CartExitRequestDto request
    ) {
        cartService.exitCart(userId, request.getStoreId(), request.getCartNumber());
        return ResponseEntity.ok("카트 퇴장이 완료되었습니다.");
    }
}