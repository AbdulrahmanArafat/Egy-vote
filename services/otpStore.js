const crypto = require("crypto");
const AuthSession = require("../models/AuthSession");

const OTP_TTL_MS = 5 * 60 * 1000;
const VERIFIED_TTL_MS = 15 * 60 * 1000;

function generateOtp() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

function generateToken() {
    return crypto.randomBytes(24).toString("hex");
}

function hashOtp(value) {
    return crypto.createHash("sha256").update(String(value || "")).digest("hex");
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

async function createOtpSession(voter) {
    const otp = generateOtp();

    await AuthSession.deleteMany({ national_id: voter.national_id });
    await AuthSession.create({
        session_type: "otp",
        national_id: voter.national_id,
        voter_id: voter._id,
        otp_code_hash: hashOtp(otp),
        expires_at: new Date(Date.now() + OTP_TTL_MS)
    });

    return {
        otp,
        maskedEmail: maskEmail(voter.email),
        expiresInSeconds: Math.floor(OTP_TTL_MS / 1000)
    };
}

async function verifyOtpSession(nationalId, otp) {
    const session = await AuthSession.findOne({
        session_type: "otp",
        national_id: nationalId
    });

    if (!session) {
        return {
            ok: false,
            message: "انتهت صلاحية رمز التحقق. اطلب رمزًا جديدًا."
        };
    }

    if (session.expires_at.getTime() <= Date.now()) {
        await session.deleteOne();
        return {
            ok: false,
            message: "انتهت صلاحية رمز التحقق. اطلب رمزًا جديدًا."
        };
    }

    if (session.otp_code_hash !== hashOtp(otp)) {
        return {
            ok: false,
            message: "رمز التحقق غير صحيح."
        };
    }

    const token = generateToken();

    await AuthSession.deleteMany({ national_id: nationalId });
    await AuthSession.create({
        session_type: "verified",
        national_id: nationalId,
        voter_id: session.voter_id,
        token,
        expires_at: new Date(Date.now() + VERIFIED_TTL_MS)
    });

    return {
        ok: true,
        token
    };
}

async function createVerifiedSession(voterId, nationalId) {
    const token = generateToken();

    await AuthSession.deleteMany({
        session_type: "verified",
        national_id: nationalId
    });
    await AuthSession.create({
        session_type: "verified",
        national_id: nationalId,
        voter_id: voterId,
        token,
        expires_at: new Date(Date.now() + VERIFIED_TTL_MS)
    });

    return token;
}

async function getVerifiedSession(token) {
    const session = await AuthSession.findOne({
        session_type: "verified",
        token
    }).lean();

    if (!session) {
        return null;
    }

    if (new Date(session.expires_at).getTime() <= Date.now()) {
        await AuthSession.deleteOne({ _id: session._id });
        return null;
    }

    return {
        voterId: String(session.voter_id),
        nationalId: session.national_id,
        expiresAt: new Date(session.expires_at).getTime()
    };
}

async function clearVerifiedSession(token) {
    await AuthSession.deleteOne({
        session_type: "verified",
        token
    });
}

async function clearSessionsForNationalId(nationalId) {
    await AuthSession.deleteMany({ national_id: nationalId });
}

module.exports = {
    createOtpSession,
    verifyOtpSession,
    createVerifiedSession,
    getVerifiedSession,
    clearVerifiedSession,
    clearSessionsForNationalId
};
