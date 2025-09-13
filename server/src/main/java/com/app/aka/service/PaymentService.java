package com.app.aka.service;

import com.app.aka.dto.PaymentRequestDto;
import com.app.aka.dto.ReceiptItemDto;
import com.app.aka.dto.ReceiptResponseDto;
import com.app.aka.entity.CartEntity;
import com.app.aka.entity.PaymentEntity;
import com.app.aka.repository.CartRepository;
import com.app.aka.repository.PaymentRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final CartRepository cartRepository;

    public ReceiptResponseDto processPayment(PaymentRequestDto request, Long userId) {
        // cartNumber로 카트 조회
        CartEntity cart = cartRepository.findByCartNumber(request.getCartNumber())
                .orElseThrow(() -> new RuntimeException("해당 카트를 찾을 수 없습니다."));

        if (cart.getUserId() == null || !cart.getUserId().equals(userId)) {
            throw new IllegalStateException("해당 카트는 사용자에게 할당되어 있지 않습니다.");
        }

        // 결제 처리 (카카오페이 고정)
        PaymentEntity payment = PaymentEntity.builder()
                .userId(userId)
                .cartId(cart.getId())
                .amount(cart.getTotalAmount())
                .method("KAKAOPAY")
                .status("SUCCESS")
                .issuedAt(LocalDateTime.now())
                .build();

        paymentRepository.save(payment);

        return buildReceiptResponse(payment, cart);
    }

    public ReceiptResponseDto getReceipt(Long receiptId) {
        PaymentEntity payment = paymentRepository.findById(receiptId)
                .orElseThrow(() -> new RuntimeException("영수증을 찾을 수 없습니다."));

        CartEntity cart = cartRepository.findById(payment.getCartId())
                .orElseThrow(() -> new RuntimeException("해당 카트를 찾을 수 없습니다."));

        return buildReceiptResponse(payment, cart);
    }

    private ReceiptResponseDto buildReceiptResponse(PaymentEntity payment, CartEntity cart) {
        List<ReceiptItemDto> itemDtos = cart.getCartItems().stream()
                .map(item -> ReceiptItemDto.builder()
                        .productName(item.getProduct().getName())
                        .quantity(item.getQuantity())
                        .totalPrice(item.getTotalPrice())
                        .build())
                .toList();

        return ReceiptResponseDto.builder()
                .receiptId(payment.getId())
                .issuedAt(payment.getIssuedAt())
                .paymentMethod(payment.getMethod())
                .amount(payment.getAmount())
                .userId(payment.getUserId())
                .cartId(payment.getCartId())
                .items(itemDtos)
                .build();
    }
}
