package com.sandwich.SandWich.auth.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

public class PasswordConstraintValidator implements ConstraintValidator<ValidPassword, String> {

    private static final Pattern LETTER_PATTERN = Pattern.compile("[A-Za-z]");
    private static final Pattern DIGIT_OR_SPECIAL_PATTERN = Pattern.compile("[0-9!@#$%^&*()\\-_=+]");

    @Override
    public boolean isValid(String password, ConstraintValidatorContext context) {
        if (password == null) return false;
        if (password.length() < 8 || password.length() > 20) return false;

        boolean hasLetter = LETTER_PATTERN.matcher(password).find();
        boolean hasDigitOrSpecial = DIGIT_OR_SPECIAL_PATTERN.matcher(password).find();

        return hasLetter && hasDigitOrSpecial;
    }
}