package com.app.aka.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class CardRequestDto {
    private String cardNumber;
    private String cardName;
    private String cardType;
    private String expiry; // MM/YY
}