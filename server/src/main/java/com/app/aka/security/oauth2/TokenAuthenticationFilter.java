package com.app.aka.security.oauth2;

import com.app.aka.entity.UserEntity;
import com.app.aka.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class TokenAuthenticationFilter extends OncePerRequestFilter {

    private final TokenProvider tokenProvider;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        log.info("[TokenFilter] 요청 URI: {}", path);

        // 인증 불필요 경로
        if (path.startsWith("/api/auth")
                || path.startsWith("/swagger")
                || path.startsWith("/v3/api-docs")
                || path.startsWith("/api/cart/items/from-device") // Jetson 제외
        ) {
            log.info("[TokenFilter] 인증 제외 경로 통과: {}", path);
            filterChain.doFilter(request, response);
            return;
        }

        // 헤더에서 토큰 추출
        String header = request.getHeader("Authorization");
        log.info("[TokenFilter] Authorization 헤더: {}", header);

        String token = getJwtFromRequest(request);
        log.info("[TokenFilter] 추출된 토큰: {}", token);

        if (token != null && tokenProvider.validateAccessToken(token)) {
            Long userId = tokenProvider.getUserIdFromAccessToken(token);
            log.info("[TokenFilter] 토큰 유효, userId={}", userId);

            UserEntity user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                var userPrincipal = UserPrincipal.create(user);
                var authentication = new UsernamePasswordAuthenticationToken(
                        userPrincipal, null, userPrincipal.getAuthorities()
                );
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);

                log.info("[TokenFilter] SecurityContext에 인증자 설정 완료: {}", userPrincipal.getId());
            } else {
                log.warn("[TokenFilter] DB에서 userId={} 사용자 찾을 수 없음", userId);
            }
        } else {
            if (token == null) {
                log.warn("[TokenFilter] Authorization 헤더가 비어 있음");
            } else {
                log.warn("[TokenFilter] 토큰 유효성 검사 실패");
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (bearer != null && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }
}
