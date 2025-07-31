package com.app.aka.entity;

import jakarta.persistence.*;
import lombok.*;
import org.apache.catalina.Store;

import java.time.LocalDateTime;

@Entity
@Table(name = "user")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", unique = true)
    private String userId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "email", unique = true, nullable = false) // email 필드에 UNIQUE 제약 조건 추가
    private String email;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "refresh_token")
    private String refreshToken;

    @Column(name = "is_registered", nullable = false)
    private Boolean isRegistered;

    @Column(name = "current_store_id")
    private Long currentStoreId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @ManyToOne
    @JoinColumn(name = "current_store_id", insertable = false, updatable = false)
    private StoreEntity currentStore;
}
