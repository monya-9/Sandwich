package com.sandwich.SandWich.global.exception.exceptiontype;

import com.sandwich.SandWich.global.exception.CustomException;
import org.springframework.http.HttpStatus;

public class ProjectNotFoundException extends CustomException {
    public ProjectNotFoundException() {
        super(HttpStatus.NOT_FOUND, "프로젝트를 찾을 수 없습니다.");
    }
}