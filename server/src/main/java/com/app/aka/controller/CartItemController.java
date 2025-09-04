package com.app.aka.controller;

import com.app.aka.dto.CartDetailResponseDto;
import com.app.aka.dto.CartItemAddRequestDto;
import com.app.aka.service.CartItemService;
import com.app.aka.repository.CartRepository;
import com.app.aka.entity.CartEntity;
import com.app.aka.entity.CartItemEntity;
import com.app.aka.repository.CartItemRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartItemController {

    private final CartItemService cartItemService;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;

    // 상품 추가
    @PostMapping("/items")
    public ResponseEntity<CartDetailResponseDto> addItemsToCart(
            @RequestBody CartItemAddRequestDto request
    ) {
        CartDetailResponseDto response = cartItemService.addItemsToCart(request);
        return ResponseEntity.ok(response);
    }

    // 수량 증가 (+ 버튼)
    @PatchMapping("/items/{cartItemId}/increase")
    @Transactional
    public ResponseEntity<CartDetailResponseDto> increaseItemQuantity(@PathVariable Long cartItemId) {
        return ResponseEntity.ok(cartItemService.increaseQuantity(cartItemId));
    }

    // 수량 감소 (- 버튼)
    @PatchMapping("/items/{cartItemId}/decrease")
    @Transactional
    public ResponseEntity<CartDetailResponseDto> decreaseItemQuantity(@PathVariable Long cartItemId) {
        return ResponseEntity.ok(cartItemService.decreaseQuantity(cartItemId));
    }

    // 상품 삭제
    @DeleteMapping("/items/{cartItemId}")
    @Transactional
    public ResponseEntity<CartDetailResponseDto> deleteItem(@PathVariable Long cartItemId) {
        CartItemEntity cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("해당 아이템을 찾을 수 없습니다."));

        CartEntity cart = cartItem.getCart();

        cart.setTotalAmount(cart.getTotalAmount() - cartItem.getTotalPrice());
        cartItemRepository.delete(cartItem);
        cartRepository.save(cart);

        return ResponseEntity.ok(cartItemService.getCartDetail(cart.getCartCode()));
    }

    // 장바구니 조회
    @GetMapping("/{cartCode}")
    public ResponseEntity<CartDetailResponseDto> getCartDetail(@PathVariable String cartCode) {
        return ResponseEntity.ok(cartItemService.getCartDetail(cartCode));
    }
}
