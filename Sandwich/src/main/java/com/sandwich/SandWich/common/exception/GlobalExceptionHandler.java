package com.sandwich.SandWich.common.exception;

import com.sandwich.SandWich.common.exception.exceptiontype.*;
import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.sql.SQLException;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // ResponseStatusException 그대로 상태 유지
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleRSE(ResponseStatusException ex) {
        int sc = ex.getStatusCode().value();
        String code = ex.getReason(); // 서비스에서 코드로 사용
        // ex.getMessage()는 "xxx: 메시지" 형태일 수 있어 reason을 code로 그대로 노출
        String msg  = (code != null) ? code : "요청이 거부되었습니다.";
        return ResponseEntity.status(sc)
                .body(new ErrorResponse(sc, code, msg));
    }

    // 1) 인증/로그인 관련
    @ExceptionHandler({ InvalidPasswordException.class, UserNotFoundException.class })
    public ResponseEntity<?> handleCredentialErrors(RuntimeException ex) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("status", 401, "message", "이메일 또는 비밀번호가 올바르지 않습니다."));
    }

    @ExceptionHandler(UnverifiedUserException.class)
    public ResponseEntity<?> handleUnverified(UnverifiedUserException ex) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("status", 401, "message", "이메일 인증이 완료되지 않은 계정입니다."));
    }

    @ExceptionHandler(UserDeletedException.class)
    public ResponseEntity<?> handleDeleted(UserDeletedException ex) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("status", 401, "message", "탈퇴된 계정입니다."));
    }

    //2) 인가(권한) 실패 → 403
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<?> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(Map.of("status", 403, "message", "접근 권한이 없습니다."));
    }

    //3) 커스텀 예외 공통
    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ErrorResponse> handleCustomException(CustomException ex) {
        return ResponseEntity.status(ex.getStatus())
                .body(new ErrorResponse(ex.getStatus().value(), ex.getCode(), ex.getMessage()));
    }

    //4) 요청 파싱/검증류 → 400
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleBodyMissing(HttpMessageNotReadableException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(400, "BAD_REQUEST", "요청 본문이 올바르지 않습니다."));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(400, "BAD_REQUEST", "요청 파라미터 타입이 올바르지 않습니다."));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraint(ConstraintViolationException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(400, "BAD_REQUEST", "검증에 실패했습니다."));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        String message = (ex.getBindingResult().getFieldError() != null)
                ? ex.getBindingResult().getFieldError().getDefaultMessage()
                : "요청 값이 올바르지 않습니다.";
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(HttpStatus.BAD_REQUEST.value(), "BAD_REQUEST", message));
    }

    //5) DB 무결성 위반 → 409/400
    private static final String UQ_VOTE_CH_VOTER = "uq_vote_ch_voter";
    private static final String CK_VOTE_SCORE_RANGE = "chk_vote_score_range";// 실제 제약 이름
    private static final String SQLSTATE_UNIQUE  = "23505";
    private static final String SQLSTATE_CHECK   = "23514";

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrity(DataIntegrityViolationException ex) {
        String msg = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : "";
        String sqlState = (ex.getMostSpecificCause() instanceof SQLException se) ? se.getSQLState() : "";

        // 1) UNIQUE(1인 1표) 위반 → 409
        if (SQLSTATE_UNIQUE.equals(sqlState) || msg.contains(UQ_VOTE_CH_VOTER)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErrorResponse(409, "DUPLICATE_VOTE", "이미 해당 챌린지에 투표했습니다."));
        }

        // 2) CHECK(점수 범위) 위반을 쓰는 경우 → 400 (CHECK 제약 추가 시)
        if (SQLSTATE_CHECK.equals(sqlState) /* || msg.contains("ck_vote_score_range") */) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(400, "INVALID_SCORE", "점수는 1~5 사이여야 합니다."));
        }

        // 그 외 무결성 위반 → 409
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponse(409, "CONSTRAINT_VIOLATION", "무결성 제약 위반"));
    }
    // 6) 상태/전이 제약 → 400
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalState(IllegalStateException ex) {
        String msg = ex.getMessage();
        if ("voting_not_finished".equals(msg)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(400, "VOTING_NOT_FINISHED", "아직 투표가 종료되지 않았습니다."));
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(400, "BAD_REQUEST", msg != null ? msg : "잘못된 요청입니다."));
    }

    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ErrorResponse> handleOptimistic(ObjectOptimisticLockingFailureException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponse(409, "ALREADY_REMOVED",
                        "동시에 다른 작업으로 삭제/변경되었습니다. 새로고침 후 다시 시도하세요."));
    }

    // 413
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxUpload(MaxUploadSizeExceededException ex) {
        return ResponseEntity
                .status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(new ErrorResponse(413, "PAYLOAD_TOO_LARGE", "업로드 가능한 최대 용량을 초과했습니다."));
    }

    // 500
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleOther(Exception ex) {
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse(500, "INTERNAL_SERVER_ERROR", "서버 오류가 발생했습니다."));
    }
}
