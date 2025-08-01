package com.app.aka.service;

import com.app.aka.dto.CartItemAddRequestDto;
import com.app.aka.dto.CartDetailResponseDto;
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

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
@Transactional
public class CartItemService {

    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final CartItemRepository cartItemRepository;

    public CartDetailResponseDto addOrUpdateItemsToCart(CartItemAddRequestDto request) {
        CartEntity cart = cartRepository.findByCartCode(request.getCartCode())
                .orElseThrow(() -> new RuntimeException("해당 카트를 찾을 수 없습니다: " + request.getCartCode()));

        if (Boolean.FALSE.equals(cart.getIsActive()) || cart.getUserId() == null) {
            throw new IllegalStateException("활성화되지 않았거나 사용자에게 할당되지 않은 카트입니다.");
        }

        int totalAmountChange = 0;

        for (String productIdentifier : request.getProductIdentifiers()) {
            // 이미지 식별자로 상품 조회
            ProductEntity product = productRepository.findByImageIdentifier(productIdentifier)
                    .orElseThrow(() -> new RuntimeException("상품을 찾을 수 없습니다: " + productIdentifier));


            Optional<CartItemEntity> existingCartItemOptional =
                    cartItemRepository.findByCartAndProduct(cart, product);

            if (existingCartItemOptional.isPresent()) {
                // 이미 담겨있다면 수량만 1 증가
                CartItemEntity existingCartItem = existingCartItemOptional.get();
                int oldQuantity = existingCartItem.getQuantity();

                existingCartItem.updateQuantity(oldQuantity + 1, product.getPrice());
                cartItemRepository.save(existingCartItem);
                totalAmountChange += product.getPrice();
            } else {
                // 새로 담는 상품이라면 CartItemEntity 생성
                CartItemEntity newCartItem = CartItemEntity.builder()
                        .cart(cart)
                        .product(product)
                        .quantity(1)
                        .unitPrice(product.getPrice())
                        .totalPrice(product.getPrice())
                        .build();
                cartItemRepository.save(newCartItem);
                cart.addCartItem(newCartItem);
                totalAmountChange += product.getPrice();
            }
        }

        cart.setTotalAmount(cart.getTotalAmount() + totalAmountChange);
        cartRepository.save(cart);

        return convertToCartDetailResponseDto(cart);
    }

    private CartDetailResponseDto convertToCartDetailResponseDto(CartEntity cart) {
        // 이 메서드가 호출될 때 cart.getCartItems()는 프록시 객체이므로, 스트림 처리 시 실제 아이템을 로드합니다.
        List<CartItemResponseDto> itemDtos = cart.getCartItems().stream()
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
                .cartCode(cart.getCartCode())
                .userId(cart.getUserId())
                .storeId(cart.getStoreId())
                .totalAmount(cart.getTotalAmount())
                .status(cart.getStatus())
                .items(itemDtos)
                .build();
    }
}
