package com.app.aka.dto;

import lombok.Data;
import java.util.List;

@Data
public class CartItemAddRequestDto {
    private String cartCode;
    private List<String> productIdentifiers;
}