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

    //1. 카드 할당 받기
    public void assignCartToUser(Long userId, Long cartNumber) {
        CartEntity cart = cartRepository.findByCartNumber(cartNumber)
                .orElseThrow(() -> new RuntimeException("해당 카트를 찾을 수 없습니다: " + cartNumber));

        if (Boolean.TRUE.equals(cart.getIsActive()) && cart.getUserId() != null) {
            throw new RuntimeException("이미 다른 사용자에게 할당된 카트입니다.");
        }

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        cart.setUserId(userId);
        cart.setIsActive(false); // 아직 매장 입장은 안했음
        cart.setStatus("ASSIGNED");
        cartRepository.save(cart);
    }

    // 2. BLE 입장
    public void cartEnterByBle(Long userId, Long storeId) {
        CartEntity cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("사용자에게 할당된 카트를 찾을 수 없습니다."));

        //카트가 할당된 매장과 현재 입장 매장이 다른 경우를 방지
        if (cart.getStoreId() != null && !cart.getStoreId().equals(storeId)) {
            throw new IllegalStateException("카트가 이미 다른 매장에 할당되어 있습니다.");
        }

        cart.setStoreId(storeId);
        cart.setStatus("ENTERED");
        cart.setIsActive(true);
        cart.setCreatedAt(LocalDateTime.now());
        cartRepository.save(cart);

        // 사용자 정보 업데이트
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        user.setCurrentStoreId(storeId);
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);
    }

    //3. 카트 퇴장
    public void exitCart(Long userId, Long storeId, Long cartNumber) {
        CartEntity cart = cartRepository.findByStoreIdAndCartNumber(storeId, cartNumber)
                .orElseThrow(() -> new RuntimeException("해당 카트를 찾을 수 없습니다."));

        if (cart.getUserId() == null || !cart.getUserId().equals(userId)) {
            throw new IllegalArgumentException("해당 카트는 사용자에게 할당되어 있지 않거나, 다른 사용자가 할당한 카트입니다.");
        }

        //카트에 담긴 아이템 전부 삭제
        cartItemRepository.deleteAllByCart(cart);

        //카트 초기화
        cart.setUserId(null);
        cart.setIsActive(false);
        cart.setStatus("WAITING");
        cart.setTotalAmount(0);
        cart.setStoreId(null); // 매장 정보도 초기화
        cartRepository.save(cart);

        // 사용자 정보 업데이트
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        user.setCurrentStoreId(null);
        userRepository.save(user);
    }
}
