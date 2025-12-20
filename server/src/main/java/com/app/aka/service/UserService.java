package com.app.aka.service;

import com.app.aka.dto.UserInfoDto;
import com.app.aka.entity.UserEntity;
import com.app.aka.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserInfoDto getUserInfo(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        return UserInfoDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nickname(user.getName())
                .build();
    }

    public void updateNickname(Long userId, String newNickname) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자 없음"));
        user.setName(newNickname);
        userRepository.save(user);
    }

    public void updatePassword(Long userId, String newPassword) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자 없음"));

        //기존 비밀번호와 동일한지 확인
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new RuntimeException("기존 비밀번호와 동일합니다.");
        }

        //암호화 후 저장
        String encodePassword = passwordEncoder.encode(newPassword);//암호화 추가
        user.setPassword(encodePassword);
        userRepository.save(user);
    }
}
