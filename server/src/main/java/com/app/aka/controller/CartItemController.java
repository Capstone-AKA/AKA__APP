package com.app.aka.controller;

import com.app.aka.dto.CartDetailResponseDto;
import com.app.aka.dto.CartItemDeltaListDto;
import com.app.aka.dto.DeviceProductRequestDto;
import com.app.aka.service.CartItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartItemController {

    private final CartItemService cartItemService;
    private final SimpMessagingTemplate messagingTemplate;

    // Jetson Nano: 상품 추가
    @PostMapping("/items/from-device")
    public ResponseEntity<CartItemDeltaListDto> addItemsFromDevice(
            @RequestBody DeviceProductRequestDto request
    ) {
        CartItemDeltaListDto updatedCart = cartItemService.addItemsFromDevice(request);

        // cartNumber 기반으로 실시간 브로드캐스트
        if (request.getCartNumber() != null) {
            String topic = "/topic/cart/" + request.getCartNumber();
            messagingTemplate.convertAndSend(topic, updatedCart);
            System.out.println("📡 WebSocket 브로드캐스트 완료 → " + topic);
        }

        // 기존과 동일하게 결과를 HTTP 응답으로 반환
        return ResponseEntity.ok(updatedCart);
    }


    // 수량 증가 (+ 버튼)
    @PatchMapping("/items/{cartItemId}/increase")
    public ResponseEntity<CartItemDeltaListDto> increaseItemQuantity(@PathVariable Long cartItemId) {
        return ResponseEntity.ok(cartItemService.increaseQuantity(cartItemId));
    }

    // 수량 감소 (- 버튼)
    @PatchMapping("/items/{cartItemId}/decrease")
    public ResponseEntity<CartItemDeltaListDto> decreaseItemQuantity(@PathVariable Long cartItemId) {
        return ResponseEntity.ok(cartItemService.decreaseQuantity(cartItemId));
    }

    // 상품 삭제
    @DeleteMapping("/items/{cartItemId}")
    public ResponseEntity<CartItemDeltaListDto> deleteItem(@PathVariable Long cartItemId) {
        return ResponseEntity.ok(cartItemService.deleteItem(cartItemId));
    }

    // 장바구니 전체 조회
    @GetMapping("/{storeId}/{cartNumber}")
    public ResponseEntity<CartDetailResponseDto> getCartDetail(
            @PathVariable Long storeId,
            @PathVariable Long cartNumber
    ) {
        return ResponseEntity.ok(cartItemService.getCartDetail(storeId, cartNumber));
    }
}
