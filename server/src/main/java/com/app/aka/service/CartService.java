package com.app.aka.service;

import com.app.aka.dto.CartEnterRequestDto;
import com.app.aka.entity.CartEntity;
import com.app.aka.repository.CartRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
public class CartService {

    private final CartRepository cartRepository;

    public void assignCartToUser(Long userId, String cartCode) {
        CartEntity cart = cartRepository.findByCartCode(cartCode)
                .orElseThrow(() -> new RuntimeException("해당 카트를 찾을 수 없습니다."));

        if (Boolean.TRUE.equals(cart.getIsActive()) && cart.getUserId() != null) {
            throw new RuntimeException("이미 다른 사용자에게 할당된 카트입니다.");
        }

        cart.setUserId(userId);
        cart.setIsActive(true);
        cart.setStatus("assigned");
        cartRepository.save(cart);
    }

    public void cartEnterByBle(String cartCode) {
        CartEntity cart = cartRepository.findByCartCode(cartCode)
                .orElseThrow(() -> new RuntimeException("해당 카트를 찾을 수 없습니다."));

        cart.setStatus("entered");
        cart.setIsActive(true);
        cart.setCreatedAt(LocalDateTime.now());
        cartRepository.save(cart);
    }
}
