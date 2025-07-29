package com.app.aka.service;

import com.app.aka.entity.CartEntity;
import com.app.aka.entity.UserEntity;
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

    public void assignCartToUser(Long userId, String cartCode) {
        CartEntity cart = cartRepository.findByCartCode(cartCode)
                .orElseThrow(() -> new RuntimeException("해당 카트를 찾을 수 없습니다."));

        if (Boolean.TRUE.equals(cart.getIsActive()) && cart.getUserId() != null) {
            throw new RuntimeException("이미 다른 사용자에게 할당된 카트입니다.");
        }

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        if (!cart.getStoreId().equals(user.getCurrentStoreId())) {
            throw new IllegalStateException("현재 매장과 카트 매장이 다릅니다.");
        }

        cart.setUserId(userId);
        cart.setIsActive(true);
        cart.setStatus("assigned");
        cartRepository.save(cart);
    }

    public void cartEnterByBle(String cartCode, Long storeId) {
        CartEntity cart = cartRepository.findByCartCode(cartCode)
                .orElseThrow(() -> new RuntimeException("해당 카트를 찾을 수 없습니다."));

        //카트가 할당된 매장과 현재 입장 매장이 다른 경우를 방지
        if (!cart.getStoreId().equals(storeId)) {
            throw new IllegalStateException("카트가 할당된 매장 [" + cart.getStoreId() + "]과 현재 입장한 매장 [" + storeId + "]이 다릅니다.");
        }

        cart.setStatus("entered");
        cart.setIsActive(true);
        cart.setCreatedAt(LocalDateTime.now());
        cartRepository.save(cart);

        if (cart.getUserId() != null) {
            UserEntity user = userRepository.findById(cart.getUserId())
                    .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다"));

            user.setCurrentStoreId(storeId);
            user.setLastLoginAt(LocalDateTime.now());
            userRepository.save(user);
        }
    }

    public void exitCart(Long userId, String cartCode) {
        CartEntity cart = cartRepository.findByCartCode(cartCode)
                .orElseThrow(() -> new RuntimeException("해당 카트를 찾을 수 없습니다."));

        // 해당 카트가 현재 요청한 사용자에게 할당되어 있는지 확인
        if (cart.getUserId() == null || !cart.getUserId().equals(userId)) {
            throw new IllegalArgumentException("해당 카트는 사용자에게 할당되어 있지 않거나, 다른 사용자가 할당한 카트입니다.");
        }
        cart.setUserId(null);
        cart.setIsActive(false);
        cart.setStatus("waiting");
        cart.setTotalAmount(0);
        // cart.setCreatedAt(null);
        // cart.setEnteredAt(null);

        cartRepository.save(cart);

        //사용자의 current_store_id 초기화 또는 업데이트
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        user.setCurrentStoreId(null); // 사용자의 현재 매장 ID를 null로 초기화
        userRepository.save(user);
    }
}
