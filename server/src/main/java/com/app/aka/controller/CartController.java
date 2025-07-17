package com.app.aka.controller;

import com.app.aka.dto.CartEnterRequestDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

public class CartController {
    @PostMapping("/enter-store")
    public ResponseEntity<String> cartEnterStore(@RequestBody CartEnterRequestDto request) {
        cartService.cartEnterStore(request);
        return ResponseEntity.ok("카트가 마트에 입장했습니다.");
    }

}
