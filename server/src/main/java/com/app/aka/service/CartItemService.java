package com.app.aka.service;

import com.app.aka.dto.*;
import com.app.aka.entity.CartEntity;
import com.app.aka.entity.CartItemEntity;
import com.app.aka.entity.ProductEntity;
import com.app.aka.repository.CartItemRepository;
import com.app.aka.repository.CartRepository;
import com.app.aka.repository.ProductRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CartItemService {

    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final CartItemRepository cartItemRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // Jetson Nano : 상품 추가
    public CartItemDeltaListDto addItemsFromDevice(DeviceProductRequestDto request) {
        CartEntity cart = cartRepository.findByCartNumber(request.getCartNumber())
                .orElseThrow(() -> new RuntimeException(
                        "카트를 찾을 수 없습니다. cartNumber=" + request.getCartNumber()));

        if (Boolean.FALSE.equals(cart.getIsActive()) || cart.getUserId() == null) {
            throw new IllegalStateException("활성화되지 않았거나 사용자에게 할당되지 않은 카트입니다.");
        }

        int addedAmount = 0;
        List<CartItemResponseDto> addedItems = new ArrayList<>();

        for (String productIdentifier : request.getProductList()) {
            ProductEntity product = productRepository.findByNameContaining(productIdentifier.trim())
                    .orElseThrow(() -> new RuntimeException("상품을 찾을 수 없습니다: " + productIdentifier));

            Optional<CartItemEntity> existingCartItemOpt = cartItemRepository.findByCartAndProduct(cart, product);

            CartItemEntity targetItem;
            if (existingCartItemOpt.isPresent()) {
                CartItemEntity existing = existingCartItemOpt.get();
                existing.updateQuantity(existing.getQuantity() + 1, product.getPrice());
                cartItemRepository.save(existing);
                targetItem = existing;
            } else {
                CartItemEntity newCartItem = CartItemEntity.builder()
                        .cart(cart)
                        .product(product)
                        .quantity(1)
                        .unitPrice(product.getPrice())
                        .totalPrice(product.getPrice())
                        .build();
                cartItemRepository.save(newCartItem);
                cart.addCartItem(newCartItem);
                targetItem = newCartItem;
            }

            addedAmount += product.getPrice();

            addedItems.add(CartItemResponseDto.builder()
                    .cartItemId(targetItem.getId())
                    .productId(product.getId())
                    .productName(product.getName())
                    .productImageUrl(product.getImageUrl())
                    .quantity(targetItem.getQuantity())
                    .unitPrice(targetItem.getUnitPrice())
                    .totalPrice(targetItem.getTotalPrice())
                    .build());
        }

        cart.setTotalAmount(Optional.ofNullable(cart.getTotalAmount()).orElse(0) + addedAmount);
        cartRepository.save(cart);

        CartItemDeltaListDto delta = CartItemDeltaListDto.builder()
                .cartNumber(cart.getCartNumber())
                .items(addedItems)
                .newTotalAmount(cart.getTotalAmount())
                .build();

        // WebSocket 브로드캐스트 추가
        messagingTemplate.convertAndSend("/topic/cart/" + cart.getCartNumber(), delta);
        return delta;
    }

    // (+) 수량 증가 로직 보강
    public CartItemDeltaListDto increaseQuantity(Long cartItemId) {
        CartItemEntity cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("아이템을 찾을 수 없습니다."));

        // 수량 +1 후 totalPrice 자동 반영
        cartItem.updateQuantity(cartItem.getQuantity() + 1, cartItem.getUnitPrice());
        cartItemRepository.save(cartItem);

        CartEntity cart = cartItem.getCart();
        cart.setTotalAmount(Optional.ofNullable(cart.getTotalAmount()).orElse(0) + cartItem.getUnitPrice());
        cartRepository.save(cart);

        // WebSocket 브로드캐스트 추가
        CartItemDeltaListDto delta = buildDeltaList(cart, List.of(cartItem));
        messagingTemplate.convertAndSend("/topic/cart/" + cart.getCartNumber(), delta);
        return delta;
    }

    // (-) 수량 감소 로직 개선
    public CartItemDeltaListDto decreaseQuantity(Long cartItemId) {
        CartItemEntity cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("아이템을 찾을 수 없습니다."));

        CartEntity cart = cartItem.getCart();

        if (cartItem.getQuantity() <= 1) {
            // 수량이 1 이하일 때 자동 삭제
            cartItemRepository.delete(cartItem);
        } else {
            cartItem.updateQuantity(cartItem.getQuantity() - 1, cartItem.getUnitPrice());
            cartItemRepository.save(cartItem);
        }

        // 총 금액 재계산 (음수 방지)
        cart.setTotalAmount(Math.max(0,
                Optional.ofNullable(cart.getTotalAmount()).orElse(0) - cartItem.getUnitPrice()));
        cartRepository.save(cart);

        // 브로드캐스트 추가
        CartItemDeltaListDto delta = buildDeltaList(cart, List.of(cartItem));
        messagingTemplate.convertAndSend("/topic/cart/" + cart.getCartNumber(), delta);
        return delta;
    }

    // 상품 삭제
    public CartItemDeltaListDto deleteItem(Long cartItemId) {
        CartItemEntity cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("아이템을 찾을 수 없습니다."));

        CartEntity cart = cartItem.getCart();
        cart.setTotalAmount(Math.max(0,
                Optional.ofNullable(cart.getTotalAmount()).orElse(0) - cartItem.getTotalPrice()));

        // 삭제 전 정보
        CartItemResponseDto deletedItemDto = CartItemResponseDto.builder()
                .cartItemId(cartItem.getId())
                .productId(cartItem.getProduct().getId())
                .productName(cartItem.getProduct().getName())
                .productImageUrl(cartItem.getProduct().getImageUrl())
                .quantity(cartItem.getQuantity())
                .unitPrice(cartItem.getUnitPrice())
                .totalPrice(cartItem.getTotalPrice())
                .build();

        cartItemRepository.delete(cartItem);
        cartRepository.save(cart);

        List<CartItemEntity> updatedItems = cartItemRepository.findByCart(cart);

        // 최신 장바구니 DTO로 변환
        CartDetailResponseDto updatedCart = convertToCartDetailResponseDto(cart, updatedItems);

        // WebSocket 브로드캐스트 (프론트는 항상 전체 리스트 수신)
        messagingTemplate.convertAndSend("/topic/cart/" + cart.getCartNumber(), updatedCart);
        // HTTP 응답용 delta (삭제된 항목 정보만)
        return CartItemDeltaListDto.builder()
                .cartNumber(cart.getCartNumber())
                .items(List.of(deletedItemDto))
                .newTotalAmount(cart.getTotalAmount())
                .build();
    }

    // 장바구니 조회 (전체) - 기존 동일
    public CartDetailResponseDto getCartDetail(Long storeId, Long cartNumber) {
        CartEntity cart = cartRepository.findByStoreIdAndCartNumber(storeId, cartNumber)
                .orElseThrow(() -> new RuntimeException("카트를 찾을 수 없습니다. storeId=" + storeId + ", cartNumber=" + cartNumber));

        List<CartItemEntity> items = cartItemRepository.findByCart(cart);

        int recalculatedTotal = items.stream()
                .mapToInt(CartItemEntity::getTotalPrice)
                .sum();

        if (!Objects.equals(Optional.ofNullable(cart.getTotalAmount()).orElse(0), recalculatedTotal)) {
            cart.setTotalAmount(recalculatedTotal);
            cartRepository.save(cart);
        }

        return convertToCartDetailResponseDto(cart, items);
    }

    // 공통 DeltaList 빌더 (브로드캐스트용)
    private CartItemDeltaListDto buildDeltaList(CartEntity cart, List<CartItemEntity> cartItems) {
        List<CartItemResponseDto> itemDtos = cartItems.stream()
                .map(item -> CartItemResponseDto.builder()
                        .cartItemId(item.getId())
                        .productId(item.getProduct().getId())
                        .productName(item.getProduct().getName())
                        .productImageUrl(item.getProduct().getImageUrl())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .totalPrice(item.getTotalPrice())
                        .build())
                .toList();

        return CartItemDeltaListDto.builder()
                .cartNumber(cart.getCartNumber())
                .items(itemDtos)
                .newTotalAmount(cart.getTotalAmount())
                .build();
    }

    // 기존 변환 메소드 (전체 조회용)
    private CartDetailResponseDto convertToCartDetailResponseDto(CartEntity cart, List<CartItemEntity> items) {
        List<CartItemResponseDto> itemDtos = items.stream()
                .map(item -> CartItemResponseDto.builder()
                        .cartItemId(item.getId())
                        .productId(item.getProduct().getId())
                        .productName(item.getProduct().getName())
                        .productImageUrl(item.getProduct().getImageUrl())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .totalPrice(item.getTotalPrice())
                        .build())
                .collect(Collectors.toList());

        return CartDetailResponseDto.builder()
                .cartNumber(cart.getCartNumber())
                .userId(cart.getUserId())
                .storeId(cart.getStoreId())
                .totalAmount(cart.getTotalAmount())
                .status(cart.getStatus())
                .items(itemDtos)
                .build();
    }
}
