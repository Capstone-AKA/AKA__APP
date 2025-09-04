package com.app.aka.controller;

import com.app.aka.dto.PaymentRequestDto;
import com.app.aka.dto.ReceiptResponseDto;
import com.app.aka.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    // 결제 실행 → 영수증 반환
    @PostMapping
    public ResponseEntity<ReceiptResponseDto> pay(
            @RequestBody PaymentRequestDto request,
            @RequestHeader("X-User-Id") Long userId // 임시: 헤더로 사용자 식별
    ) {
        return ResponseEntity.ok(paymentService.processPayment(request, userId));
    }

    // 영수증 조회
    @GetMapping("/{receiptId}")
    public ResponseEntity<ReceiptResponseDto> getReceipt(@PathVariable Long receiptId) {
        return ResponseEntity.ok(paymentService.getReceipt(receiptId));
    }
}
