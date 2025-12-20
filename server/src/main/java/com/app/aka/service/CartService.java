package com.app.aka.service;

import com.app.aka.entity.CartEntity;
import com.app.aka.entity.UserEntity;
import com.app.aka.repository.CartItemRepository;
import com.app.aka.repository.CartRepository;
import com.app.aka.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class CartService {

    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final CartItemRepository cartItemRepository;

    // 카트 할당 + 매장 자동입장(storeId = 1)
    public void assignCartToUser(Long userId, Long cartNumber) {
        CartEntity cart = cartRepository.findByCartNumber(cartNumber)
                .orElseThrow(() -> new RuntimeException("해당 카트를 찾을 수 없습니다: " + cartNumber));

        if (Boolean.TRUE.equals(cart.getIsActive()) && cart.getUserId() != null) {
            throw new RuntimeException("이미 다른 사용자에게 할당된 카트입니다.");
        }

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        Long defaultStoreId = 1L; // 매장이 하나뿐이라 고정

        cart.setUserId(userId);
        cart.setStoreId(defaultStoreId);
        cart.setIsActive(true);
        cart.setStatus("ENTERED");
        cart.setCreatedAt(LocalDateTime.now());
        cartRepository.save(cart);

        // 사용자 정보 업데이트 (자동 입장 반영)
        user.setCurrentStoreId(defaultStoreId);
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);
    }

    // BLE 입장 (별도 BLE 이벤트가 발생할 때 사용)
    public void cartEnterByBle(Long userId, Long storeId) {
        CartEntity cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("사용자에게 할당된 카트를 찾을 수 없습니다."));

        if (cart.getStoreId() != null && !cart.getStoreId().equals(storeId)) {
            throw new IllegalStateException("카트가 이미 다른 매장에 할당되어 있습니다.");
        }

        cart.setStoreId(storeId);
        cart.setStatus("ENTERED");
        cart.setIsActive(true);
        cart.setCreatedAt(LocalDateTime.now());
        cartRepository.save(cart);

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        user.setCurrentStoreId(storeId);
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);
    }

    // 카트 퇴장
    public void exitCart(Long userId, Long storeId, Long cartNumber) {
        CartEntity cart = cartRepository.findByStoreIdAndCartNumber(storeId, cartNumber)
                .orElseThrow(() -> new RuntimeException("해당 카트를 찾을 수 없습니다."));

        if (cart.getUserId() == null || !cart.getUserId().equals(userId)) {
            throw new IllegalArgumentException("해당 카트는 사용자에게 할당되어 있지 않거나, 다른 사용자가 할당한 카트입니다.");
        }

        //cartItems 컬렉션도 비워줘야함 (JPA 영속성 컨텍스트 때문에)
        cart.getCartItems().clear();

        //DB에서도 삭제
        cartItemRepository.deleteAllByCart(cart);

        //cart 정보 초기화
        cart.setUserId(null);
        cart.setIsActive(false);
        cart.setStatus("WAITING");
        cart.setTotalAmount(0);
        cart.setStoreId(null);

        cartRepository.save(cart);

        //사용자 상태 초기화
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        user.setCurrentStoreId(null);
        userRepository.save(user);
    }
}
