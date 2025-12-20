package com.app.aka.repository;

import com.app.aka.entity.PaymentItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PaymentItemRepository extends JpaRepository<PaymentItemEntity, Long> {

    List<PaymentItemEntity> findByPaymentId(Long paymentId);
}
