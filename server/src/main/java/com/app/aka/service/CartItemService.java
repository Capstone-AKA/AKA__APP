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

    //Jetson Nano : 상품 추가
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
                .items(addedItems) // 단일일 경우도 size=1
                .newTotalAmount(cart.getTotalAmount())
                .build();

        messagingTemplate.convertAndSend("/topic/cart/" + cart.getCartNumber(), delta);
        return delta;
    }

    // (+) 수량 증가
    public CartItemDeltaListDto increaseQuantity(Long cartItemId) {
        CartItemEntity cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("아이템을 찾을 수 없습니다."));

        cartItem.updateQuantity(cartItem.getQuantity() + 1, cartItem.getUnitPrice());
        cartItemRepository.save(cartItem);

        CartEntity cart = cartItem.getCart();
        cart.setTotalAmount(Optional.ofNullable(cart.getTotalAmount()).orElse(0) + cartItem.getUnitPrice());
        cartRepository.save(cart);

        CartItemDeltaListDto delta = buildDeltaList(cart, List.of(cartItem));
        return delta;
    }


    // (-) 수량 감소
    public CartItemDeltaListDto decreaseQuantity(Long cartItemId) {
        CartItemEntity cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("아이템을 찾을 수 없습니다."));

        if (cartItem.getQuantity() <= 1) {
            throw new IllegalArgumentException("상품 수량은 1보다 작을 수 없습니다.");
        }

        cartItem.updateQuantity(cartItem.getQuantity() - 1, cartItem.getUnitPrice());
        cartItemRepository.save(cartItem);

        CartEntity cart = cartItem.getCart();
        cart.setTotalAmount(Optional.ofNullable(cart.getTotalAmount()).orElse(0) - cartItem.getUnitPrice());
        cartRepository.save(cart);

        CartItemDeltaListDto delta = buildDeltaList(cart, List.of(cartItem));
        return delta;
    }

    // 상품 삭제
    public CartItemDeltaListDto deleteItem(Long cartItemId) {
        CartItemEntity cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("아이템을 찾을 수 없습니다."));

        CartEntity cart = cartItem.getCart();
        cart.setTotalAmount(Optional.ofNullable(cart.getTotalAmount()).orElse(0) - cartItem.getTotalPrice());

        // 삭제 전 DTO 변환
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

        CartItemDeltaListDto delta = CartItemDeltaListDto.builder()
                .cartNumber(cart.getCartNumber())
                .items(List.of(deletedItemDto)) // 항상 배열
                .newTotalAmount(cart.getTotalAmount())
                .build();
        return delta;
    }

    // 장바구니 조회 (전체)
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

    // 공통 DeltaList 빌더
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
                .items(itemDtos) // 단일도 무조건 배열
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
