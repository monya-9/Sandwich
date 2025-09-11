package com.sandwich.SandWich.user.controller;

import com.sandwich.SandWich.common.dto.PageResponse;
import com.sandwich.SandWich.user.dto.AccountSearchItem;
import com.sandwich.SandWich.user.service.AccountSearchService;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.*;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/search")
public class AccountSearchController {

    private final AccountSearchService service;

    @GetMapping(value="/accounts", produces = MediaType.APPLICATION_JSON_VALUE)
    public PageResponse<AccountSearchItem> searchAccounts(
            @RequestParam(required = false, name = "q") String q,
            @ParameterObject Pageable pageable
    ) {
        Pageable p = (pageable == null || pageable.getPageSize() == 0)
                ? PageRequest.of(0, 20)
                : pageable;
        return service.search(q, p);
    }
}