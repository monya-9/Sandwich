package com.sandwich.SandWich.common.util;

import java.time.*;

public final class TimeUtil {
    public static final ZoneId Z_UTC = ZoneId.of("UTC");
    public static final ZoneId Z_KST = ZoneId.of("Asia/Seoul");
    private TimeUtil(){}

    public static OffsetDateTime nowUtc() { return OffsetDateTime.now(Z_UTC); }
    public static OffsetDateTime nowKst() { return OffsetDateTime.now(Z_KST); }

    public static OffsetDateTime toKst(OffsetDateTime odt) {
        if (odt == null) return null;
        return odt.atZoneSameInstant(Z_KST).toOffsetDateTime();
    }
    public static OffsetDateTime toUtc(OffsetDateTime odt) {
        if (odt == null) return null;
        return odt.atZoneSameInstant(Z_UTC).toOffsetDateTime();
    }
    public static OffsetDateTime toKst(Instant instant) {
        return instant.atZone(Z_KST).toOffsetDateTime();
    }
    public static OffsetDateTime toUtc(Instant instant) {
        return instant.atZone(Z_UTC).toOffsetDateTime();
    }
}