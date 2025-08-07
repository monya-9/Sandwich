package com.sandwich.SandWich.global.exception.exceptiontype;


import com.sandwich.SandWich.global.exception.CustomException;
import org.springframework.http.HttpStatus;

public class CollectionFolderNotFoundException extends CustomException {
    public CollectionFolderNotFoundException() {
        super(HttpStatus.NOT_FOUND, "컬렉션 폴더를 찾을 수 없습니다.");
    }
}
