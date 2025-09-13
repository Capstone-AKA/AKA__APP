package com.app.aka.service;

import com.app.aka.dto.CartDetailResponseDto;
import com.app.aka.dto.CartItemAddRequestDto;
import com.app.aka.dto.CartItemResponseDto;
import com.app.aka.entity.CartEntity;
import com.app.aka.entity.CartItemEntity;
import com.app.aka.entity.ProductEntity;
import com.app.aka.repository.CartItemRepository;
import com.app.aka.repository.CartRepository;
import com.app.aka.repository.ProductRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
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

    //상품 추가
    public CartDetailResponseDto addItemsToCart(CartItemAddRequestDto request) {
        CartEntity cart = cartRepository.findByStoreIdAndCartNumber(
                        request.getStoreId(), request.getCartNumber())
                .orElseThrow(() -> new RuntimeException(
                        "해당 카트를 찾을 수 없습니다. storeId="
                                + request.getStoreId() + ", cartNumber=" + request.getCartNumber()
                ));

        if (Boolean.FALSE.equals(cart.getIsActive()) || cart.getUserId() == null) {
            throw new IllegalStateException("활성화되지 않았거나 사용자에게 할당되지 않은 카트입니다.");
        }

        int addedAmount = 0;

        for (String productIdentifier : request.getProductList()) {
            ProductEntity product = productRepository.findByName(productIdentifier)
                    .orElseThrow(() -> new RuntimeException("상품을 찾을 수 없습니다: " + productIdentifier));

            Optional<CartItemEntity> existingCartItemOpt = cartItemRepository.findByCartAndProduct(cart, product);

            if (existingCartItemOpt.isPresent()) {
                // 이미 담겨있으면 수량 +1
                CartItemEntity existing = existingCartItemOpt.get();
                existing.updateQuantity(existing.getQuantity() + 1, product.getPrice());
                cartItemRepository.save(existing);
            } else {
                // 처음 담는 상품이면 새로 추가
                CartItemEntity newCartItem = CartItemEntity.builder()
                        .cart(cart)
                        .product(product)
                        .quantity(1)
                        .unitPrice(product.getPrice())
                        .totalPrice(product.getPrice())
                        .build();
                cartItemRepository.save(newCartItem);
                cart.addCartItem(newCartItem);
            }

            addedAmount += product.getPrice();
        }

        cart.setTotalAmount(Optional.ofNullable(cart.getTotalAmount()).orElse(0) + addedAmount);
        cartRepository.save(cart);

        return getCartDetail(request.getStoreId(), request.getCartNumber());
    }

    //(+) 버튼 수량 증가
    public CartDetailResponseDto increaseQuantity(Long cartItemId) {
        CartItemEntity cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("해당 아이템을 찾을 수 없습니다."));

        cartItem.updateQuantity(cartItem.getQuantity() + 1, cartItem.getUnitPrice());
        cartItemRepository.save(cartItem);

        CartEntity cart = cartItem.getCart();
        cart.setTotalAmount(Optional.ofNullable(cart.getTotalAmount()).orElse(0) + cartItem.getUnitPrice());
        cartRepository.save(cart);

        return getCartDetail(cart.getStoreId(), cart.getCartNumber());
    }

    //(-) 버튼 수량 감소
    public CartDetailResponseDto decreaseQuantity(Long cartItemId) {
        CartItemEntity cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("해당 아이템을 찾을 수 없습니다."));

        if (cartItem.getQuantity() <= 1) {
            throw new IllegalArgumentException("상품 수량은 1보다 작을 수 없습니다.");
        }

        cartItem.updateQuantity(cartItem.getQuantity() - 1, cartItem.getUnitPrice());
        cartItemRepository.save(cartItem);

        CartEntity cart = cartItem.getCart();
        cart.setTotalAmount(Optional.ofNullable(cart.getTotalAmount()).orElse(0) - cartItem.getUnitPrice());
        cartRepository.save(cart);

        return getCartDetail(cart.getStoreId(), cart.getCartNumber());
    }

    public CartDetailResponseDto deleteItem(Long cartItemId) {
        CartItemEntity cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("해당 아이템을 찾을 수 없습니다."));

        CartEntity cart = cartItem.getCart();

        // 총액에서 빼기
        cart.setTotalAmount(
                Optional.ofNullable(cart.getTotalAmount()).orElse(0) - cartItem.getTotalPrice()
        );

        // 아이템 삭제
        cartItemRepository.delete(cartItem);
        cartRepository.save(cart);

        // 최신 장바구니 반환
        return getCartDetail(cart.getStoreId(), cart.getCartNumber());
    }


    // 장바구니 조회
    public CartDetailResponseDto getCartDetail(Long storeId, Long cartNumber) {
        CartEntity cart = cartRepository.findByStoreIdAndCartNumber(storeId, cartNumber)
                .orElseThrow(() -> new RuntimeException(
                        "해당 카트를 찾을 수 없습니다. storeId=" + storeId + ", cartNumber=" + cartNumber));

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

    private CartDetailResponseDto convertToCartDetailResponseDto(CartEntity cart, List<CartItemEntity> items) {
        List<CartItemResponseDto> itemDtos = items.stream()
                .map(item -> {
                    // 혹시 모를 product null 대비(데이터 불량)
                    ProductEntity p = item.getProduct();
                    if (p == null) {
                        throw new IllegalStateException("CartItem(" + item.getId() + ")의 상품 정보가 없습니다.");
                    }
                    return CartItemResponseDto.builder()
                            .cartItemId(item.getId())
                            .productId(p.getId())
                            .productName(p.getName())
                            .productImageUrl(p.getImageUrl())
                            .quantity(item.getQuantity())
                            .unitPrice(item.getUnitPrice())
                            .totalPrice(item.getTotalPrice())
                            .build();
                })
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
