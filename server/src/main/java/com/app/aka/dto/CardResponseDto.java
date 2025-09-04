package com.app.aka.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class CardResponseDto {
    private Long id;
    private String cardNumber; // 실제는 마스킹 처리
    private String cardName;
    private String cardType;
    private String expiry;
}