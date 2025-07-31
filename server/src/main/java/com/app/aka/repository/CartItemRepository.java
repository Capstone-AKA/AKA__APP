package com.app.aka.repository;

import com.app.aka.entity.CartEntity;
import com.app.aka.entity.CartItemEntity;
import com.app.aka.entity.ProductEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItemEntity, Long> {
    // 특정 카트내에서 특정 상품에 해당하는 CartItem을 찾는 메서드
    Optional<CartItemEntity> findByCartAndProduct(CartEntity cart, ProductEntity product);

    // 특정 카트에 속한 모든 CartItem을 찾는 메서드
    List<CartItemEntity> findByCart(CartEntity cart);

    // 특정 CartEntity와 CartItem의 ID로 CartItem을 찾는 메서드 (삭제/수정 시 검증용)
    Optional<CartItemEntity> findByCartAndId(CartEntity cart, Long cartItemId);
}