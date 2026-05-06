const crypto = require("crypto");

const OTP_TTL_MS = 5 * 60 * 1000;
const VERIFIED_TTL_MS = 15 * 60 * 1000;

const otpSessions = new Map();
const verifiedSessions = new Map();

function cleanupExpiredSessions() {
    const now = Date.now();

    for (const [nationalId, session] of otpSessions.entries()) {
        if (session.expiresAt <= now) {
            otpSessions.delete(nationalId);
        }
    }

    for (const [token, session] of verifiedSessions.entries()) {
        if (session.expiresAt <= now) {
            verifiedSessions.delete(token);
        }
    }
}

function generateOtp() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

function generateToken() {
    return crypto.randomBytes(24).toString("hex");
}

function maskEmail(email) {
    if (!email || !email.includes("@")) {
        return email;
    }

    const [localPart, domain] = email.split("@");

    if (localPart.length <= 2) {
        return email;
    }

    const visiblePart = localPart.slice(0, 2);
    const hiddenPart = "*".repeat(localPart.length - 2);

    return `${visiblePart}${hiddenPart}@${domain}`;
}

function createOtpSession(voter) {
    cleanupExpiredSessions();

    const otp = generateOtp();
    const expiresAt = Date.now() + OTP_TTL_MS;

    otpSessions.set(voter.national_id, {
        code: otp,
        expiresAt,
        voterId: voter._id.toString(),
        nationalId: voter.national_id
    });

    return {
        otp,
        maskedEmail: maskEmail(voter.email),
        expiresInSeconds: Math.floor(OTP_TTL_MS / 1000)
    };
}

function verifyOtpSession(nationalId, otp) {
    cleanupExpiredSessions();

    const session = otpSessions.get(nationalId);

    if (!session) {
        return {
            ok: false,
            message: "انتهت صلاحية رمز التحقق. اطلب رمزًا جديدًا."
        };
    }

    if (session.code !== otp) {
        return {
            ok: false,
            message: "رمز التحقق غير صحيح."
        };
    }

    const token = generateToken();
    verifiedSessions.set(token, {
        voterId: session.voterId,
        nationalId: session.nationalId,
        expiresAt: Date.now() + VERIFIED_TTL_MS
    });

    otpSessions.delete(nationalId);

    return {
        ok: true,
        token
    };
}

function createVerifiedSession(voterId, nationalId) {
    cleanupExpiredSessions();

    const token = generateToken();
    verifiedSessions.set(token, {
        voterId,
        nationalId,
        expiresAt: Date.now() + VERIFIED_TTL_MS
    });

    return token;
}

function getVerifiedSession(token) {
    cleanupExpiredSessions();
    return verifiedSessions.get(token) || null;
}

function clearVerifiedSession(token) {
    verifiedSessions.delete(token);
}

function clearSessionsForNationalId(nationalId) {
    otpSessions.delete(nationalId);

    for (const [token, session] of verifiedSessions.entries()) {
        if (session.nationalId === nationalId) {
            verifiedSessions.delete(token);
        }
    }
}

module.exports = {
    createOtpSession,
    verifyOtpSession,
    createVerifiedSession,
    getVerifiedSession,
    clearVerifiedSession,
    clearSessionsForNationalId
};
