// src/main/java/.../debug/TimeDebugController.java
package com.sandwich.SandWich.debug;


import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import java.time.*;
import java.util.*;


@RestController
@RequestMapping("/api/_debug")
public class TimeDebugController {
    private final JdbcTemplate jdbc;
    public TimeDebugController(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @GetMapping("/time")
    public Map<String, Object> time() {
        Map<String, Object> m = new LinkedHashMap<>();

        OffsetDateTime appUtc = OffsetDateTime.now(ZoneOffset.UTC);
        OffsetDateTime appKst = OffsetDateTime.now(ZoneOffset.ofHours(9));
        OffsetDateTime dbUtc  = jdbc.queryForObject("select now()", OffsetDateTime.class);
        LocalDateTime  dbKstLdt = jdbc.queryForObject("select now() at time zone 'Asia/Seoul'", LocalDateTime.class);
        OffsetDateTime dbKst = dbKstLdt.atOffset(ZoneOffset.ofHours(9));

        // 표시 문자열(의미 파악용)
        m.put("app.utc.str", appUtc.toString());
        m.put("app.kst.str", appKst.toString());
        m.put("db.utc.str",  dbUtc.toString());
        m.put("db.kst.str",  dbKst.toString());

        // 진짜 동일 순간인지 검증용(오프셋 무시): epoch millis
        m.put("app.utc.epoch", appUtc.toInstant().toEpochMilli());
        m.put("app.kst.epoch", appKst.toInstant().toEpochMilli());
        m.put("db.utc.epoch",  dbUtc.toInstant().toEpochMilli());
        m.put("db.kst.epoch",  dbKst.toInstant().toEpochMilli());

        // 오프셋만 확인
        m.put("app.utc.offset", appUtc.getOffset().toString());
        m.put("app.kst.offset", appKst.getOffset().toString());
        m.put("db.utc.offset",  dbUtc.getOffset().toString());
        m.put("db.kst.offset",  dbKst.getOffset().toString());
        return m;
    }


}
