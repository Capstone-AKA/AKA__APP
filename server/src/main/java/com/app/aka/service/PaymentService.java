package com.app.aka.service;

import com.app.aka.dto.PaymentHistoryDto;
import com.app.aka.dto.PaymentRequestDto;
import com.app.aka.dto.ReceiptItemDto;
import com.app.aka.dto.ReceiptResponseDto;
import com.app.aka.entity.*;
import com.app.aka.repository.*;
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
    private final PaymentItemRepository paymentItemRepository;
    private final CartRepository cartRepository;
    private final CartService cartService;

    public ReceiptResponseDto processPayment(PaymentRequestDto request, Long userId) {

        CartEntity cart = cartRepository.findByCartNumber(request.getCartNumber())
                .orElseThrow(() -> new RuntimeException("해당 카트를 찾을 수 없습니다."));

        if (cart.getUserId() == null || !cart.getUserId().equals(userId)) {
            throw new IllegalStateException("해당 카트는 사용자에게 할당되어 있지 않습니다.");
        }

        // 결제 저장
        PaymentEntity payment = PaymentEntity.builder()
                .userId(userId)
                .cartId(cart.getId())
                .amount(cart.getTotalAmount())
                .method("KAKAOPAY")
                .status("SUCCESS")
                .issuedAt(LocalDateTime.now())
                .build();
        paymentRepository.save(payment);

        // 영수증 스냅샷 저장
        List<PaymentItemEntity> snapshotItems = cart.getCartItems().stream()
                .map(item -> PaymentItemEntity.builder()
                        .paymentId(payment.getId())
                        .productName(item.getProduct().getName())
                        .quantity(item.getQuantity())
                        .totalPrice(item.getTotalPrice())
                        .build())
                .toList();
        paymentItemRepository.saveAll(snapshotItems);

        //카트 비우기
        cartService.exitCart(userId, cart.getStoreId(), cart.getCartNumber());

        //영수증 응답
        return buildReceiptResponse(payment, snapshotItems);
    }

    public ReceiptResponseDto getReceipt(Long receiptId) {

        PaymentEntity payment = paymentRepository.findById(receiptId)
                .orElseThrow(() -> new RuntimeException("영수증을 찾을 수 없습니다."));

        // 🔥 PaymentItem 테이블에서 영수증 데이터 조회
        List<PaymentItemEntity> snapshotItems =
                paymentItemRepository.findByPaymentId(receiptId);

        return buildReceiptResponse(payment, snapshotItems);
    }

    private ReceiptResponseDto buildReceiptResponse(
            PaymentEntity payment,
            List<PaymentItemEntity> items
    ) {
        List<ReceiptItemDto> itemDtos = items.stream()
                .map(i -> ReceiptItemDto.builder()
                        .productName(i.getProductName())
                        .quantity(i.getQuantity())
                        .totalPrice(i.getTotalPrice())
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

    public List<PaymentHistoryDto> getPaymentHistory(Long userId) {
        List<PaymentEntity> payments =
                paymentRepository.findByUserIdOrderByIssuedAtDesc(userId);

        return payments.stream()
                .map(payment -> PaymentHistoryDto.builder()
                        .receiptId(payment.getId())
                        .issuedAt(payment.getIssuedAt())
                        .paymentMethod(payment.getMethod())
                        .amount(payment.getAmount())
                        .cartId(payment.getCartId())
                        .build())
                .toList();
    }
}