package com.sandwich.SandWich.upload.controller;

import com.sandwich.SandWich.upload.util.S3Uploader;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/upload")
public class ImageUploadController {

    private final S3Uploader s3Uploader;

    @Operation(
            summary = "이미지 업로드",
            description = "이미지 파일을 업로드하고 S3 URL을 반환합니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "업로드 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청"),
            @ApiResponse(responseCode = "413", description = "파일 용량 초과"),
            @ApiResponse(responseCode = "415", description = "지원하지 않는 미디어 타입")
    })
    @PostMapping(
            value = "/image",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<Map<String, String>> uploadImage(
            @Parameter(description = "업로드할 이미지 파일", required = true)
            @RequestPart("file") MultipartFile file   // @RequestParam이어도 동작하지만 @RequestPart가 문서화에 더 명확
    ) throws IOException {
        String imageUrl = s3Uploader.upload(file, "images");
        return ResponseEntity.ok(Map.of("url", imageUrl));
    }
}
