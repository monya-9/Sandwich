package com.sandwich.SandWich.global.exception.exceptiontype;


import com.sandwich.SandWich.global.exception.CustomException;
import org.springframework.http.HttpStatus;

public class ProjectNotFoundException extends CustomException {
    public ProjectNotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, message);
    }
}