package com.app.aka.controller;

import com.app.aka.dto.CartDetailResponseDto;
import com.app.aka.dto.CartItemAddRequestDto;
import com.app.aka.dto.DeviceProductRequestDto;
import com.app.aka.service.CartItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartItemController {

    private final CartItemService cartItemService;


    @PostMapping("/items")
    public ResponseEntity<CartDetailResponseDto> addItemsToCart(
            @RequestBody CartItemAddRequestDto request
    ) {
        return ResponseEntity.ok(cartItemService.addItemsToCart(request));
    }

    // Jetson Nano: 상품 추가
    @PostMapping("/items/from-device")
    public ResponseEntity<CartDetailResponseDto> addItemsFromDevice(
            @RequestBody DeviceProductRequestDto request,
            @AuthenticationPrincipal(expression = "id") Long userId
    ) {
        return ResponseEntity.ok(cartItemService.addItemsFromDevice(userId, request));
    }

    // 수량 증가 (+ 버튼)
    @PatchMapping("/items/{cartItemId}/increase")
    public ResponseEntity<CartDetailResponseDto> increaseItemQuantity(@PathVariable Long cartItemId) {
        return ResponseEntity.ok(cartItemService.increaseQuantity(cartItemId));
    }

    // 수량 감소 (- 버튼)
    @PatchMapping("/items/{cartItemId}/decrease")
    public ResponseEntity<CartDetailResponseDto> decreaseItemQuantity(@PathVariable Long cartItemId) {
        return ResponseEntity.ok(cartItemService.decreaseQuantity(cartItemId));
    }

    // 상품 삭제
    @DeleteMapping("/items/{cartItemId}")
    public ResponseEntity<CartDetailResponseDto> deleteItem(@PathVariable Long cartItemId) {
        return ResponseEntity.ok(cartItemService.deleteItem(cartItemId));
    }

    // 장바구니 조회
    @GetMapping("/{storeId}/{cartNumber}")
    public ResponseEntity<CartDetailResponseDto> getCartDetail(
            @PathVariable Long storeId,
            @PathVariable Long cartNumber
    ) {
        return ResponseEntity.ok(cartItemService.getCartDetail(storeId, cartNumber));
    }
}
