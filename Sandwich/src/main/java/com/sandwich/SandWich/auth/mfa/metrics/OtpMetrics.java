package com.sandwich.SandWich.auth.mfa.metrics;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Component;

@Component
public class OtpMetrics {
    private final Counter issued;
    private final Counter resendOk;
    private final Counter verifyOk;
    private final Counter verifyInvalid;
    private final Counter verifyExpired;
    private final Counter verifyLocked;

    private final Timer issueTimer;
    private final Timer verifyTimer;

    public OtpMetrics(MeterRegistry registry) {
        this.issued        = Counter.builder("otp_issued_total").description("OTP issued").register(registry);
        this.resendOk      = Counter.builder("otp_resend_total").description("OTP resend accepted").register(registry);
        this.verifyOk      = Counter.builder("otp_verify_ok_total").description("OTP verify OK").register(registry);
        this.verifyInvalid = Counter.builder("otp_verify_invalid_total").description("OTP invalid").register(registry);
        this.verifyExpired = Counter.builder("otp_verify_expired_total").description("OTP expired").register(registry);
        this.verifyLocked  = Counter.builder("otp_verify_locked_total").description("OTP locked").register(registry);

        this.issueTimer  = Timer.builder("otp_issue_seconds").description("OTP issue latency").register(registry);
        this.verifyTimer = Timer.builder("otp_verify_seconds").description("OTP verify latency").register(registry);
    }

    public void incIssued()        { issued.increment(); }
    public void incResendOk()      { resendOk.increment(); }
    public void incVerifyOk()      { verifyOk.increment(); }
    public void incVerifyInvalid() { verifyInvalid.increment(); }
    public void incVerifyExpired() { verifyExpired.increment(); }
    public void incVerifyLocked()  { verifyLocked.increment(); }

    public <T> T timeIssue(java.util.concurrent.Callable<T> c) {
        try { return issueTimer.recordCallable(c); }
        catch (Exception e) { throw new RuntimeException(e); }
    }

    public <T> T timeVerify(java.util.concurrent.Callable<T> c) {
        try { return verifyTimer.recordCallable(c); }
        catch (Exception e) { throw new RuntimeException(e); }
    }
}
