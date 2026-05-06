const rateLimit = require("express-rate-limit");

/**
 * General API rate limiter — 100 requests per 15 minutes per IP.
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "لقد تجاوزت الحد المسموح به من الطلبات. حاول مرة أخرى بعد 15 دقيقة."
    }
});

/**
 * Strict rate limiter for OTP endpoints — 10 requests per 15 minutes per IP.
 */
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "تجاوزت عدد محاولات إرسال رمز التحقق المسموح بها. حاول مرة أخرى بعد 15 دقيقة."
    }
});

/**
 * Admin route limiter — 30 requests per 10 minutes per IP.
 */
const adminLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "تجاوزت عدد الطلبات المسموح بها على لوحة التحكم."
    }
});

module.exports = { apiLimiter, otpLimiter, adminLimiter };
