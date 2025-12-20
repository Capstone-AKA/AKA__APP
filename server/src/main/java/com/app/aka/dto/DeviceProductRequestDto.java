package com.app.aka.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class DeviceProductRequestDto {

    @JsonProperty("cart_number")
    private Long cartNumber;

    @JsonProperty("product_list")
    private List<String> productList;
}
