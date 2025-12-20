package com.app.aka.controller;

import com.app.aka.dto.CardRequestDto;
import com.app.aka.dto.CardResponseDto;
import com.app.aka.security.oauth2.TokenProvider;
import com.app.aka.service.CardService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cards")
@RequiredArgsConstructor
public class CardController {

    private final CardService cardService;
    private final TokenProvider tokenProvider;

    // 카드 등록
    @PostMapping
    public ResponseEntity<CardResponseDto> addCard(
            @RequestBody CardRequestDto request,
            HttpServletRequest httpRequest
    ) {
        Long userId = tokenProvider.getUserIdFromRequest(httpRequest);
        return ResponseEntity.ok(cardService.addCard(userId, request));
    }

    // 카드 삭제
    @DeleteMapping("/{cardId}")
    public ResponseEntity<Void> deleteCard(
            @PathVariable Long cardId,
            HttpServletRequest httpRequest
    ) {
        Long userId = tokenProvider.getUserIdFromRequest(httpRequest);
        cardService.deleteCard(userId, cardId);
        return ResponseEntity.noContent().build();
    }

    // 내 카드 목록 조회
    @GetMapping
    public ResponseEntity<List<CardResponseDto>> getCards(
            HttpServletRequest httpRequest
    ) {
        Long userId = tokenProvider.getUserIdFromRequest(httpRequest);
        return ResponseEntity.ok(cardService.getCards(userId));
    }
}