package com.app.aka.service;

import com.app.aka.dto.CardRequestDto;
import com.app.aka.dto.CardResponseDto;
import com.app.aka.entity.CardEntity;
import com.app.aka.repository.CardRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CardService {

    private final CardRepository cardRepository;

    public CardResponseDto addCard(Long userId, CardRequestDto request) {
        CardEntity card = CardEntity.builder()
                .userId(userId)
                .cardNumber(request.getCardNumber())
                .cardName(request.getCardName())
                .cardType(request.getCardType())
                .expiry(request.getExpiry())
                .build();
        cardRepository.save(card);

        return toDto(card);
    }

    public void deleteCard(Long userId, Long cardId) {
        CardEntity card = cardRepository.findById(cardId)
                .orElseThrow(() -> new RuntimeException("카드를 찾을 수 없습니다."));
        if (!card.getUserId().equals(userId)) {
            throw new IllegalStateException("본인 소유의 카드만 삭제할 수 있습니다.");
        }
        cardRepository.delete(card);
    }

    public List<CardResponseDto> getCards(Long userId) {
        return cardRepository.findByUserId(userId).stream()
                .map(this::toDto)
                .toList();
    }

    private CardResponseDto toDto(CardEntity card) {
        return CardResponseDto.builder()
                .id(card.getId())
                .cardNumber(maskCardNumber(card.getCardNumber()))
                .cardName(card.getCardName())
                .cardType(card.getCardType())
                .expiry(card.getExpiry())
                .build();
    }

    private String maskCardNumber(String cardNumber) {
        if (cardNumber.length() < 8) return "****";
        return cardNumber.substring(0, 4) + "-****-****-" + cardNumber.substring(cardNumber.length() - 4);
    }
}
