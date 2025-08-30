package com.sandwich.SandWich.common.exception.exceptiontype;


import com.sandwich.SandWich.common.exception.CustomException;
import org.springframework.http.HttpStatus;

public class CollectionFolderNotFoundException extends CustomException {
    public CollectionFolderNotFoundException() {
        super(HttpStatus.NOT_FOUND, "컬렉션 폴더를 찾을 수 없습니다.");
    }
}
