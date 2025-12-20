package com.app.aka.controller;

import com.app.aka.dto.PaymentHistoryDto;
import com.app.aka.dto.PaymentRequestDto;
import com.app.aka.dto.ReceiptResponseDto;
import com.app.aka.security.oauth2.TokenProvider;
import com.app.aka.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final TokenProvider tokenProvider;

    // 결제 실행 → 영수증 반환
    @PostMapping("/checkout")
    public ResponseEntity<ReceiptResponseDto> pay(
            @RequestBody PaymentRequestDto request,
            HttpServletRequest httpRequest
    ) {
        Long userId = tokenProvider.getUserIdFromRequest(httpRequest);
        return ResponseEntity.ok(paymentService.processPayment(request, userId));
    }

    // 영수증 조회
    @GetMapping("/{receiptId}")
    public ResponseEntity<ReceiptResponseDto> getReceipt(
            @PathVariable Long receiptId,
            HttpServletRequest httpRequest
    ) {
        // 여기서도 토큰에서 사용자 ID 추출 가능
        Long userId = tokenProvider.getUserIdFromRequest(httpRequest);
        return ResponseEntity.ok(paymentService.getReceipt(receiptId));
    }

    // 결제 내역 조회
    @GetMapping("/history")
    public ResponseEntity<List<PaymentHistoryDto>> getPaymentHistory(HttpServletRequest httpRequest) {
        Long userId = tokenProvider.getUserIdFromRequest(httpRequest);
        return ResponseEntity.ok(paymentService.getPaymentHistory(userId));
    }
}
