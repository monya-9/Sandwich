package com.sandwich.SandWich.global.exception;

import com.sandwich.SandWich.global.exception.exceptiontype.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException; // ★ 403용
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    /* =========================
       1) 인증/로그인 관련 명시 매핑 (가장 중요)
       ========================= */

    // 이메일/비번 틀림, 존재하지 않음 → 401 통일
    @ExceptionHandler({ InvalidPasswordException.class, UserNotFoundException.class })
    public ResponseEntity<?> handleCredentialErrors(RuntimeException ex) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("status", 401, "message", "이메일 또는 비밀번호가 올바르지 않습니다."));
    }

    // 미인증 계정 → 401
    @ExceptionHandler(UnverifiedUserException.class)
    public ResponseEntity<?> handleUnverified(UnverifiedUserException ex) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("status", 401, "message", "이메일 인증이 완료되지 않은 계정입니다."));
    }

    // 탈퇴 계정 → 401
    @ExceptionHandler(UserDeletedException.class)
    public ResponseEntity<?> handleDeleted(UserDeletedException ex) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("status", 401, "message", "탈퇴된 계정입니다."));
    }

    /* =========================
       2) 인가(권한) 실패 → 403
       ========================= */

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<?> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(Map.of("status", 403, "message", "접근 권한이 없습니다."));
    }

    /* =========================
       3) 커스텀 예외(그 외 전역 규칙)
       ========================= */

    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ErrorResponse> handleCustomException(CustomException ex) {
        return ResponseEntity
                .status(ex.getStatus())
                .body(new ErrorResponse(ex.getStatus().value(), ex.getMessage()));
    }

    /* =========================
       4) 바인딩/검증 예외 → 400
       ========================= */

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        String message = (ex.getBindingResult().getFieldError() != null)
                ? ex.getBindingResult().getFieldError().getDefaultMessage()
                : "요청 값이 올바르지 않습니다.";
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(HttpStatus.BAD_REQUEST.value(), message));
    }

    /* =========================
       5) 그 외 전부 → 500
       ========================= */

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleOther(Exception ex) {
        // TODO: 로그 남기기 (ex)
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse(500, "서버 오류가 발생했습니다."));
    }
}
