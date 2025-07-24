package com.app.aka.dto;

import lombok.Data;

@Data
public class CartEnterRequestDto {
    private String cartCode; // QR에서 스캔되는 고유값
    private Long storeId;
}
