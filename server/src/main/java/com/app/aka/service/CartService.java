package com.app.aka.service;

import com.app.aka.dto.CartEnterRequestDto;
import com.app.aka.entity.CartEntity;
import com.app.aka.repository.CartRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;

    public void cartEnterStore(CartEnterRequestDto request) {
        CartEntity cart = cartRepository.findByCartCode(request.getCartCode())
                .orElseThrow(() -> new RuntimeException("해당 카트를 찾을 수 없습니다."));

        cart.setStoreId(request.getStoreId());
        cart.setIsActive(true);
        cart.setStatus("active");
        cartRepository.save(cart);
    }
}
